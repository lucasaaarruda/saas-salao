import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.banco import get_db
from app.core.dependencias import get_cliente_atual
from app.core.limitador import limiter
from app.modulos.booking import service
from app.modulos.booking.schemas import (
    AgendarInput,
    AgendamentoClienteOut,
    ClienteLoginInput,
    ClienteRefreshInput,
    ClienteRegistroInput,
    ClienteTokenOut,
    EsqueciSenhaInput,
    NovoAccessTokenClienteOut,
    ProfissionalPublicoOut,
    RedefinirSenhaInput,
    SalaoPublicoOut,
    ServicoPublicoOut,
)
from app.modulos.clientes.model import Client

router = APIRouter(tags=["agendamento-online"])


@router.post(
    "/{slug}/auth/register",
    response_model=ClienteTokenOut,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("5/hour")
async def registrar(
    request: Request,
    slug: str,
    dados: ClienteRegistroInput,
    db: AsyncSession = Depends(get_db),
):
    return await service.registrar_cliente(slug, dados, db)


@router.post("/{slug}/auth/login", response_model=ClienteTokenOut)
@limiter.limit("10/minute")
async def login(
    request: Request,
    slug: str,
    dados: ClienteLoginInput,
    db: AsyncSession = Depends(get_db),
):
    return await service.login_cliente(slug, dados, db)


@router.post("/{slug}/auth/refresh", response_model=NovoAccessTokenClienteOut)
async def refresh(
    slug: str,
    dados: ClienteRefreshInput,
    db: AsyncSession = Depends(get_db),
):
    return await service.renovar_token_cliente(dados.refresh_token, db)


@router.post("/{slug}/auth/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    slug: str,
    cliente_atual: Client = Depends(get_cliente_atual),
):
    await service.logout_cliente(str(cliente_atual.id))


@router.post("/{slug}/auth/forgot-password", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("3/hour")
async def esqueci_senha(
    request: Request,
    slug: str,
    dados: EsqueciSenhaInput,
    db: AsyncSession = Depends(get_db),
):
    await service.esqueci_senha_cliente(slug, dados.email, db)


@router.post("/{slug}/auth/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def redefinir_senha(
    slug: str,
    dados: RedefinirSenhaInput,
    db: AsyncSession = Depends(get_db),
):
    await service.redefinir_senha_cliente(dados.token, dados.nova_senha, db)


# ---------------------------------------------------------------------------
# Booking API — informações e agendamento
# ---------------------------------------------------------------------------

@router.get("/{slug}/", response_model=SalaoPublicoOut)
async def info_salao(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    return await service.info_salao(slug, db)


@router.get("/{slug}/servicos", response_model=list[ServicoPublicoOut])
async def listar_servicos(
    slug: str,
    cliente_atual: Client = Depends(get_cliente_atual),
    db: AsyncSession = Depends(get_db),
):
    return await service.listar_servicos_publicos(cliente_atual.salon_id, db)


@router.get("/{slug}/profissionais", response_model=list[ProfissionalPublicoOut])
async def listar_profissionais(
    slug: str,
    cliente_atual: Client = Depends(get_cliente_atual),
    db: AsyncSession = Depends(get_db),
):
    return await service.listar_profissionais_publicos(cliente_atual.salon_id, db)


@router.get("/{slug}/disponibilidade", response_model=list[str])
async def disponibilidade(
    slug: str,
    professional_id: uuid.UUID = Query(...),
    service_id: uuid.UUID = Query(...),
    data: date = Query(...),
    cliente_atual: Client = Depends(get_cliente_atual),
    db: AsyncSession = Depends(get_db),
):
    return await service.disponibilidade_publica(
        cliente_atual.salon_id, professional_id, service_id, data, db
    )


@router.post("/{slug}/agendar", response_model=AgendamentoClienteOut, status_code=status.HTTP_201_CREATED)
async def agendar(
    slug: str,
    dados: AgendarInput,
    cliente_atual: Client = Depends(get_cliente_atual),
    db: AsyncSession = Depends(get_db),
):
    return await service.agendar_cliente(cliente_atual, dados, db)


@router.get("/{slug}/meus-agendamentos", response_model=list[AgendamentoClienteOut])
async def meus_agendamentos(
    slug: str,
    status: str | None = Query(None),
    cliente_atual: Client = Depends(get_cliente_atual),
    db: AsyncSession = Depends(get_db),
):
    return await service.meus_agendamentos(cliente_atual, db, status)
