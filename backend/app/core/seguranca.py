from datetime import datetime, timedelta, timezone
from typing import Any

import redis.asyncio as aioredis
from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

contexto_crypt = CryptContext(schemes=["bcrypt"], deprecated="auto")

_redis_client: aioredis.Redis | None = None


def _get_redis() -> aioredis.Redis:
    global _redis_client
    if _redis_client is None:
        _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis_client


# ---------------------------------------------------------------------------
# Senhas
# ---------------------------------------------------------------------------

def hash_senha(senha: str) -> str:
    return contexto_crypt.hash(senha)


def verificar_senha(senha: str, hash_armazenado: str) -> bool:
    return contexto_crypt.verify(senha, hash_armazenado)


# ---------------------------------------------------------------------------
# Tokens JWT
# ---------------------------------------------------------------------------

def criar_access_token(data: dict[str, Any]) -> str:
    payload = data.copy()
    expira = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload.update({"exp": expira, "type": "access"})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def criar_refresh_token(data: dict[str, Any]) -> str:
    payload = data.copy()
    expira = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload.update({"exp": expira, "type": "refresh"})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verificar_token(token: str) -> dict[str, Any]:
    """Decodifica e valida um JWT. Lança JWTError se inválido ou expirado."""
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


# ---------------------------------------------------------------------------
# Refresh tokens no Redis
# ---------------------------------------------------------------------------

async def salvar_refresh_token_redis(user_id: str, token: str) -> None:
    r = _get_redis()
    ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    await r.setex(f"refresh:{user_id}", ttl, token)


async def buscar_refresh_token_redis(user_id: str) -> str | None:
    r = _get_redis()
    return await r.get(f"refresh:{user_id}")


async def revogar_refresh_token_redis(user_id: str) -> None:
    r = _get_redis()
    await r.delete(f"refresh:{user_id}")


# ---------------------------------------------------------------------------
# Tokens de recuperação de senha (UUID, TTL 1h)
# ---------------------------------------------------------------------------

async def salvar_token_recuperacao(email: str, token: str) -> None:
    r = _get_redis()
    await r.setex(f"reset:{token}", 3600, email)


async def buscar_email_por_token_recuperacao(token: str) -> str | None:
    r = _get_redis()
    return await r.get(f"reset:{token}")


async def revogar_token_recuperacao(token: str) -> None:
    r = _get_redis()
    await r.delete(f"reset:{token}")


# ---------------------------------------------------------------------------
# Tokens JWT para clientes (tipo separado: "client_access" / "client_refresh")
# ---------------------------------------------------------------------------

def criar_access_token_cliente(data: dict[str, Any]) -> str:
    payload = data.copy()
    expira = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload.update({"exp": expira, "type": "client_access"})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def criar_refresh_token_cliente(data: dict[str, Any]) -> str:
    payload = data.copy()
    expira = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    payload.update({"exp": expira, "type": "client_refresh"})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ---------------------------------------------------------------------------
# Refresh tokens de clientes no Redis (chave: "client_refresh:{client_id}")
# ---------------------------------------------------------------------------

async def salvar_refresh_token_cliente_redis(client_id: str, token: str) -> None:
    r = _get_redis()
    ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    await r.setex(f"client_refresh:{client_id}", ttl, token)


async def buscar_refresh_token_cliente_redis(client_id: str) -> str | None:
    r = _get_redis()
    return await r.get(f"client_refresh:{client_id}")


async def revogar_refresh_token_cliente_redis(client_id: str) -> None:
    r = _get_redis()
    await r.delete(f"client_refresh:{client_id}")


# ---------------------------------------------------------------------------
# Tokens de recuperação de senha para clientes (chave: "client_reset:{token}")
# ---------------------------------------------------------------------------

async def salvar_token_recuperacao_cliente(client_id: str, token: str) -> None:
    r = _get_redis()
    await r.setex(f"client_reset:{token}", 3600, client_id)


async def buscar_client_id_por_token_recuperacao(token: str) -> str | None:
    r = _get_redis()
    return await r.get(f"client_reset:{token}")


async def revogar_token_recuperacao_cliente(token: str) -> None:
    r = _get_redis()
    await r.delete(f"client_reset:{token}")
