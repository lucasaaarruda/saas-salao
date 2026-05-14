from typing import Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.banco import get_db
from app.core.seguranca import verificar_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_usuario_atual(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Decodifica o JWT e retorna o usuário autenticado."""
    from app.modulos.usuarios.model import User  # import tardio para evitar circular

    credenciais_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas ou sessão expirada",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = verificar_token(token)
        user_id: str | None = payload.get("sub")
        tipo: str | None = payload.get("type")
        if user_id is None or tipo != "access":
            raise credenciais_invalidas
    except JWTError:
        raise credenciais_invalidas

    resultado = await db.execute(select(User).where(User.id == UUID(user_id)))
    usuario = resultado.scalar_one_or_none()

    if usuario is None or not usuario.is_active:
        raise credenciais_invalidas

    return usuario


def verificar_permissao(roles: list[str]) -> Callable:
    """Retorna uma dependência que valida se o usuário tem a role exigida."""

    async def _verificar(usuario=Depends(get_usuario_atual)):
        if usuario.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não tem permissão para esta ação",
            )
        return usuario

    return _verificar


# Atalhos de permissão por papel
def apenas_owner():
    return verificar_permissao(["owner"])


def owner_ou_manager():
    return verificar_permissao(["owner", "manager"])


def owner_manager_ou_recepcionista():
    return verificar_permissao(["owner", "manager", "receptionist"])


def qualquer_autenticado():
    return verificar_permissao(["owner", "manager", "professional", "receptionist"])


async def get_cliente_atual(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Decodifica o JWT de cliente e retorna o cliente autenticado."""
    from app.modulos.clientes.model import Client

    credenciais_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais de cliente inválidas ou sessão expirada",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = verificar_token(token)
        client_id: str | None = payload.get("sub")
        tipo: str | None = payload.get("type")
        if client_id is None or tipo != "client_access":
            raise credenciais_invalidas
    except JWTError:
        raise credenciais_invalidas

    resultado = await db.execute(select(Client).where(Client.id == UUID(client_id)))
    cliente = resultado.scalar_one_or_none()

    if cliente is None or not cliente.is_active or cliente.password_hash is None:
        raise credenciais_invalidas

    return cliente
