from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.banco import get_db
from app.core.dependencias import get_usuario_atual
from app.core.limitador import limiter
from app.modulos.auth import service
from app.modulos.auth.schemas import (
    LoginInput,
    NovoAccessTokenOut,
    RecuperarSenhaInput,
    RedefinirSenhaInput,
    RefreshInput,
    RegistrarSalaoInput,
    TokenOutput,
)

router = APIRouter(tags=["autenticação"])


@router.post(
    "/register",
    response_model=TokenOutput,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar novo salão",
)
@limiter.limit("5/hour")
async def registrar(
    request: Request,
    dados: RegistrarSalaoInput,
    db: AsyncSession = Depends(get_db),
) -> TokenOutput:
    """Cria um novo salão e o usuário proprietário. Retorna par de tokens."""
    return await service.registrar(dados, db)


@router.post(
    "/login",
    response_model=TokenOutput,
    summary="Entrar no sistema",
)
@limiter.limit("10/minute")
async def login(
    request: Request,
    dados: LoginInput,
    db: AsyncSession = Depends(get_db),
) -> TokenOutput:
    """Autentica com email e senha. Retorna access token e refresh token."""
    return await service.fazer_login(dados.email, dados.senha, db)


@router.post(
    "/refresh",
    response_model=NovoAccessTokenOut,
    summary="Renovar access token",
)
async def refresh(
    dados: RefreshInput,
    db: AsyncSession = Depends(get_db),
) -> NovoAccessTokenOut:
    """Usa o refresh token para emitir um novo access token."""
    return await service.renovar_token(dados.refresh_token, db)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Sair do sistema",
)
async def logout(
    usuario=Depends(get_usuario_atual),
) -> None:
    """Revoga o refresh token da sessão atual."""
    await service.fazer_logout(str(usuario.id))


@router.post(
    "/forgot-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Solicitar recuperação de senha",
)
@limiter.limit("3/hour")
async def forgot_password(
    request: Request,
    dados: RecuperarSenhaInput,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Envia email com token de recuperação de senha (válido por 1 hora)."""
    await service.solicitar_recuperacao(dados.email, db)


@router.post(
    "/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Redefinir senha",
)
async def reset_password(
    dados: RedefinirSenhaInput,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Redefine a senha usando o token recebido por email."""
    await service.redefinir_senha(dados.token, dados.nova_senha, db)
