import uuid
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.seguranca import (
    buscar_client_id_por_token_recuperacao,
    buscar_refresh_token_cliente_redis,
    criar_access_token_cliente,
    criar_refresh_token_cliente,
    hash_senha,
    revogar_refresh_token_cliente_redis,
    revogar_token_recuperacao_cliente,
    salvar_refresh_token_cliente_redis,
    salvar_token_recuperacao_cliente,
    verificar_senha,
    verificar_token,
)
from app.modulos.booking.schemas import (
    AgendarInput,
    AgendamentoClienteOut,
    ClienteLoginInput,
    ClientePublicoOut,
    ClienteRegistroInput,
    ClienteTokenOut,
    NovoAccessTokenClienteOut,
    ProfissionalPublicoOut,
    SalaoPublicoOut,
    ServicoPublicoOut,
)
from app.modulos.agendamentos.model import Appointment
from app.modulos.agendamentos.service import _calcular_fim, _verificar_conflito
from app.modulos.clientes.model import Client
from app.modulos.profissionais.model import Professional
from app.modulos.salao.model import Salon
from app.modulos.servicos.model import Service


# ---------------------------------------------------------------------------
# Utilitários internos
# ---------------------------------------------------------------------------

async def _buscar_salao_por_slug(slug: str, db: AsyncSession) -> Salon:
    salao = await db.scalar(select(Salon).where(Salon.slug == slug))
    if not salao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salão não encontrado")
    if not salao.allow_online_booking:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Agendamento online desativado neste salão")
    return salao


def _montar_tokens_cliente(cliente: Client) -> dict:
    payload = {"sub": str(cliente.id), "salon_id": str(cliente.salon_id)}
    return {
        "access_token": criar_access_token_cliente(payload),
        "refresh_token": criar_refresh_token_cliente(payload),
        "token_type": "bearer",
    }


# ---------------------------------------------------------------------------
# Registro
# ---------------------------------------------------------------------------

async def registrar_cliente(slug: str, dados: ClienteRegistroInput, db: AsyncSession) -> ClienteTokenOut:
    salao = await _buscar_salao_por_slug(slug, db)

    # Email único por salão para clientes com senha
    existente = await db.scalar(
        select(Client).where(
            Client.salon_id == salao.id,
            Client.email == str(dados.email),
            Client.password_hash.isnot(None),
        )
    )
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está cadastrado neste salão",
        )

    cliente = Client(
        salon_id=salao.id,
        name=dados.name,
        email=str(dados.email),
        phone=dados.phone,
        cpf=dados.cpf,
        birth_date=dados.birth_date,
        password_hash=hash_senha(dados.password),
    )
    db.add(cliente)
    await db.flush()

    tokens = _montar_tokens_cliente(cliente)
    await salvar_refresh_token_cliente_redis(str(cliente.id), tokens["refresh_token"])

    return ClienteTokenOut(**tokens, cliente=ClientePublicoOut.model_validate(cliente))


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

async def login_cliente(slug: str, dados: ClienteLoginInput, db: AsyncSession) -> ClienteTokenOut:
    salao = await _buscar_salao_por_slug(slug, db)

    cliente = await db.scalar(
        select(Client).where(
            Client.salon_id == salao.id,
            Client.email == dados.email,
            Client.password_hash.isnot(None),
        )
    )

    if not cliente or not verificar_senha(dados.password, cliente.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
        )
    if not cliente.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Conta desativada. Entre em contato com o salão.",
        )

    cliente.last_login_at = datetime.now(timezone.utc)

    tokens = _montar_tokens_cliente(cliente)
    await salvar_refresh_token_cliente_redis(str(cliente.id), tokens["refresh_token"])

    return ClienteTokenOut(**tokens, cliente=ClientePublicoOut.model_validate(cliente))


# ---------------------------------------------------------------------------
# Refresh
# ---------------------------------------------------------------------------

async def renovar_token_cliente(refresh_token_str: str, db: AsyncSession) -> NovoAccessTokenClienteOut:
    erro = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Refresh token inválido ou expirado",
    )

    try:
        payload = verificar_token(refresh_token_str)
    except JWTError:
        raise erro

    if payload.get("type") != "client_refresh":
        raise erro

    client_id: str | None = payload.get("sub")
    if not client_id:
        raise erro

    armazenado = await buscar_refresh_token_cliente_redis(client_id)
    if armazenado != refresh_token_str:
        raise erro

    cliente = await db.scalar(select(Client).where(Client.id == uuid.UUID(client_id)))
    if not cliente or not cliente.is_active:
        raise erro

    novo_access = criar_access_token_cliente(
        {"sub": client_id, "salon_id": str(cliente.salon_id)}
    )
    return NovoAccessTokenClienteOut(access_token=novo_access)


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

async def logout_cliente(client_id: str) -> None:
    await revogar_refresh_token_cliente_redis(client_id)


# ---------------------------------------------------------------------------
# Recuperação de senha
# ---------------------------------------------------------------------------

async def esqueci_senha_cliente(slug: str, email: str, db: AsyncSession) -> None:
    salao = await db.scalar(select(Salon).where(Salon.slug == slug))
    if not salao:
        return  # não revelar se o salão/email existe

    cliente = await db.scalar(
        select(Client).where(
            Client.salon_id == salao.id,
            Client.email == email,
            Client.password_hash.isnot(None),
            Client.is_active.is_(True),
        )
    )
    if not cliente:
        return  # não revelar se o email existe

    token = str(uuid.uuid4())
    await salvar_token_recuperacao_cliente(str(cliente.id), token)

    try:
        from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
        from app.core.config import settings

        conf = ConnectionConfig(
            MAIL_USERNAME=settings.SMTP_USER,
            MAIL_PASSWORD=settings.SMTP_PASSWORD,
            MAIL_FROM=settings.EMAILS_FROM_EMAIL,
            MAIL_PORT=settings.SMTP_PORT,
            MAIL_SERVER=settings.SMTP_HOST,
            MAIL_FROM_NAME=settings.EMAILS_FROM_NAME,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=bool(settings.SMTP_USER),
            VALIDATE_CERTS=True,
        )
        mensagem = MessageSchema(
            subject=f"Recuperação de senha — {salao.name}",
            recipients=[email],
            body=(
                f"Olá, {cliente.name}!\n\n"
                f"Use o token abaixo para redefinir sua senha:\n\n"
                f"{token}\n\n"
                f"Este token expira em 1 hora.\n\n"
                f"Se você não solicitou isso, ignore este email."
            ),
            subtype=MessageType.plain,
        )
        fm = FastMail(conf)
        await fm.send_message(mensagem)
    except Exception:
        pass


async def redefinir_senha_cliente(token: str, nova_senha: str, db: AsyncSession) -> None:
    client_id = await buscar_client_id_por_token_recuperacao(token)
    if not client_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado",
        )

    cliente = await db.scalar(select(Client).where(Client.id == uuid.UUID(client_id)))
    if not cliente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente não encontrado",
        )

    cliente.password_hash = hash_senha(nova_senha)

    await revogar_token_recuperacao_cliente(token)
    await revogar_refresh_token_cliente_redis(client_id)


# ---------------------------------------------------------------------------
# Booking API — informações públicas e fluxo de agendamento
# ---------------------------------------------------------------------------

async def info_salao(slug: str, db: AsyncSession) -> SalaoPublicoOut:
    salao = await db.scalar(
        select(Salon).where(Salon.slug == slug, Salon.is_active.is_(True))
    )
    if not salao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salão não encontrado")
    return SalaoPublicoOut.model_validate(salao)


async def listar_servicos_publicos(salon_id: uuid.UUID, db: AsyncSession) -> list[ServicoPublicoOut]:
    result = await db.execute(
        select(Service)
        .where(Service.salon_id == salon_id, Service.is_active.is_(True))
        .order_by(Service.name)
    )
    return [ServicoPublicoOut.model_validate(s) for s in result.scalars().all()]


async def listar_profissionais_publicos(salon_id: uuid.UUID, db: AsyncSession) -> list[ProfissionalPublicoOut]:
    result = await db.execute(
        select(Professional)
        .where(Professional.salon_id == salon_id, Professional.is_active.is_(True))
        .order_by(Professional.name)
    )
    return [ProfissionalPublicoOut.model_validate(p) for p in result.scalars().all()]


async def disponibilidade_publica(
    salon_id: uuid.UUID,
    professional_id: uuid.UUID,
    service_id: uuid.UUID,
    data: date,
    db: AsyncSession,
) -> list[str]:
    from app.modulos.agendamentos.service import listar_horarios_disponiveis
    return await listar_horarios_disponiveis(salon_id, professional_id, service_id, data, db)


async def agendar_cliente(
    cliente: Client,
    dados: AgendarInput,
    db: AsyncSession,
) -> AgendamentoClienteOut:
    if dados.scheduled_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Data de agendamento não pode ser no passado",
        )

    salao = await db.scalar(select(Salon).where(Salon.id == cliente.salon_id))
    if not salao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salão não encontrado")

    # Verificar dia de funcionamento (0=Dom, 1=Seg, ..., 6=Sab)
    dia_br = (dados.scheduled_date.weekday() + 1) % 7
    if dia_br not in salao.working_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Salão não funciona neste dia da semana",
        )

    servico = await db.scalar(
        select(Service).where(
            Service.id == dados.service_id,
            Service.salon_id == cliente.salon_id,
            Service.is_active.is_(True),
        )
    )
    if not servico:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")

    profissional = await db.scalar(
        select(Professional).where(
            Professional.id == dados.professional_id,
            Professional.salon_id == cliente.salon_id,
            Professional.is_active.is_(True),
        )
    )
    if not profissional:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profissional não encontrado")

    end_time = _calcular_fim(dados.start_time, servico.duration_minutes)
    await _verificar_conflito(db, dados.professional_id, dados.scheduled_date, dados.start_time, end_time)

    agendamento = Appointment(
        salon_id=cliente.salon_id,
        client_id=cliente.id,
        professional_id=dados.professional_id,
        service_id=dados.service_id,
        scheduled_date=dados.scheduled_date,
        start_time=dados.start_time,
        end_time=end_time,
        price=servico.price,
        discount=Decimal("0"),
        final_price=servico.price,
        notes=dados.notes,
        created_by_id=None,
    )
    db.add(agendamento)
    await db.flush()

    try:
        from app.tarefas.lembretes import agendar_lembretes
        await agendar_lembretes(agendamento.id, agendamento.scheduled_date, agendamento.start_time, db)
    except Exception:
        pass

    return AgendamentoClienteOut.model_validate(agendamento)


async def meus_agendamentos(
    cliente: Client,
    db: AsyncSession,
    status_filtro: str | None = None,
) -> list[AgendamentoClienteOut]:
    query = (
        select(Appointment)
        .where(
            Appointment.client_id == cliente.id,
            Appointment.salon_id == cliente.salon_id,
        )
        .order_by(Appointment.scheduled_date.desc(), Appointment.start_time.desc())
    )
    if status_filtro:
        query = query.where(Appointment.status == status_filtro)

    result = await db.execute(query)
    return [AgendamentoClienteOut.model_validate(a) for a in result.scalars().all()]
