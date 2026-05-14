import re
import unicodedata
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.seguranca import (
    buscar_email_por_token_recuperacao,
    buscar_refresh_token_redis,
    criar_access_token,
    criar_refresh_token,
    hash_senha,
    revogar_refresh_token_redis,
    revogar_token_recuperacao,
    salvar_refresh_token_redis,
    salvar_token_recuperacao,
    verificar_senha,
    verificar_token,
)
from app.modulos.auth.schemas import (
    NovoAccessTokenOut,
    RegistrarSalaoInput,
    TokenOutput,
    UsuarioOut,
)
from app.modulos.salao.model import Salon
from app.modulos.usuarios.model import User


# ---------------------------------------------------------------------------
# Utilitários
# ---------------------------------------------------------------------------

def _gerar_slug(nome: str) -> str:
    """Converte nome do salão em slug URL-safe."""
    nfkd = unicodedata.normalize("NFKD", nome)
    ascii_str = nfkd.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_str.lower()).strip("-") or "salao"


async def _slug_unico(base: str, db: AsyncSession) -> str:
    """Garante que o slug seja único, adicionando sufixo numérico se necessário."""
    slug = base
    counter = 1
    while True:
        existe = await db.scalar(select(Salon).where(Salon.slug == slug))
        if not existe:
            return slug
        slug = f"{base}-{counter}"
        counter += 1


def _montar_tokens(usuario: User) -> dict:
    payload = {"sub": str(usuario.id), "salon_id": str(usuario.salon_id)}
    return {
        "access_token": criar_access_token(payload),
        "refresh_token": criar_refresh_token(payload),
        "token_type": "bearer",
    }


# ---------------------------------------------------------------------------
# Registro
# ---------------------------------------------------------------------------

async def registrar(dados: RegistrarSalaoInput, db: AsyncSession) -> TokenOutput:
    """Cria um novo salão e o usuário proprietário."""
    # Verificar se o email já existe em qualquer salão
    email_em_uso = await db.scalar(select(User).where(User.email == dados.email_owner))
    if email_em_uso:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está cadastrado no sistema",
        )

    slug = await _slug_unico(_gerar_slug(dados.nome_salao), db)
    email_salao = str(dados.email_salao) if dados.email_salao else dados.email_owner

    salao = Salon(
        name=dados.nome_salao,
        slug=slug,
        phone=dados.telefone_salao,
        email=email_salao,
        address=dados.endereco_salao,
        city=dados.cidade,
        state=dados.estado.upper(),
    )
    db.add(salao)
    await db.flush()

    usuario = User(
        salon_id=salao.id,
        name=dados.nome_owner,
        email=dados.email_owner,
        password_hash=hash_senha(dados.senha),
        role="owner",
    )
    db.add(usuario)
    await db.flush()

    tokens = _montar_tokens(usuario)
    await salvar_refresh_token_redis(str(usuario.id), tokens["refresh_token"])

    return TokenOutput(**tokens, usuario=UsuarioOut.model_validate(usuario))


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

async def fazer_login(email: str, senha: str, db: AsyncSession) -> TokenOutput:
    """Autentica o usuário e retorna par de tokens."""
    usuario = await db.scalar(select(User).where(User.email == email))

    if not usuario or not verificar_senha(senha, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
        )
    if not usuario.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Conta desativada. Entre em contato com o administrador.",
        )

    usuario.last_login_at = datetime.now(timezone.utc)

    tokens = _montar_tokens(usuario)
    await salvar_refresh_token_redis(str(usuario.id), tokens["refresh_token"])

    return TokenOutput(**tokens, usuario=UsuarioOut.model_validate(usuario))


# ---------------------------------------------------------------------------
# Refresh
# ---------------------------------------------------------------------------

async def renovar_token(refresh_token_str: str, db: AsyncSession) -> NovoAccessTokenOut:
    """Valida o refresh token e emite um novo access token."""
    erro_invalido = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Refresh token inválido ou expirado",
    )

    try:
        payload = verificar_token(refresh_token_str)
    except JWTError:
        raise erro_invalido

    if payload.get("type") != "refresh":
        raise erro_invalido

    user_id: str | None = payload.get("sub")
    if not user_id:
        raise erro_invalido

    armazenado = await buscar_refresh_token_redis(user_id)
    if armazenado != refresh_token_str:
        raise erro_invalido

    usuario = await db.scalar(select(User).where(User.id == uuid.UUID(user_id)))
    if not usuario or not usuario.is_active:
        raise erro_invalido

    novo_access = criar_access_token(
        {"sub": user_id, "salon_id": str(usuario.salon_id)}
    )
    return NovoAccessTokenOut(access_token=novo_access)


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

async def fazer_logout(user_id: str) -> None:
    """Revoga o refresh token no Redis."""
    await revogar_refresh_token_redis(user_id)


# ---------------------------------------------------------------------------
# Recuperação de senha
# ---------------------------------------------------------------------------

async def solicitar_recuperacao(email: str, db: AsyncSession) -> None:
    """Envia email com token de recuperação de senha (TTL 1h)."""
    usuario = await db.scalar(select(User).where(User.email == email))
    if not usuario or not usuario.is_active:
        # Não revelar se o email existe ou não (segurança)
        return

    token = str(uuid.uuid4())
    await salvar_token_recuperacao(email, token)

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
            subject="Recuperação de senha — Salão App",
            recipients=[email],
            body=(
                f"Olá!\n\n"
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
        # Em desenvolvimento, SMTP pode não estar configurado — falha silenciosa
        pass


async def redefinir_senha(token: str, nova_senha: str, db: AsyncSession) -> None:
    """Redefine a senha do usuário usando o token de recuperação."""
    email = await buscar_email_por_token_recuperacao(token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido ou expirado",
        )

    usuario = await db.scalar(select(User).where(User.email == email))
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado",
        )

    usuario.password_hash = hash_senha(nova_senha)

    # Invalida token de recuperação e todas as sessões ativas
    await revogar_token_recuperacao(token)
    await revogar_refresh_token_redis(str(usuario.id))
