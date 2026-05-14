import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.banco import get_db
from app.core.dependencias import apenas_owner, owner_ou_manager, qualquer_autenticado
from app.modulos.usuarios import service
from app.modulos.usuarios.schemas import AlterarSenhaInput, UsuarioCreate, UsuarioOut, UsuarioUpdate

router = APIRouter(tags=["usuários"])


@router.get("", response_model=list[UsuarioOut], summary="Listar usuários do salão")
async def listar(
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> list[UsuarioOut]:
    return await service.listar_usuarios(usuario.salon_id, db)


@router.post(
    "",
    response_model=UsuarioOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar usuário",
)
async def criar(
    dados: UsuarioCreate,
    usuario=Depends(apenas_owner()),
    db: AsyncSession = Depends(get_db),
) -> UsuarioOut:
    return await service.criar_usuario(usuario.salon_id, dados, db)


@router.get("/me", response_model=UsuarioOut, summary="Meu perfil")
async def meu_perfil(usuario=Depends(qualquer_autenticado())) -> UsuarioOut:
    return UsuarioOut.model_validate(usuario)


@router.post(
    "/me/change-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Alterar minha senha",
)
async def alterar_senha(
    dados: AlterarSenhaInput,
    usuario=Depends(qualquer_autenticado()),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.alterar_senha(usuario, dados, db)


@router.get("/{usuario_id}", response_model=UsuarioOut, summary="Obter usuário")
async def obter(
    usuario_id: uuid.UUID,
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> UsuarioOut:
    return await service.obter_usuario(usuario.salon_id, usuario_id, db)


@router.patch("/{usuario_id}", response_model=UsuarioOut, summary="Atualizar usuário")
async def atualizar(
    usuario_id: uuid.UUID,
    dados: UsuarioUpdate,
    usuario=Depends(apenas_owner()),
    db: AsyncSession = Depends(get_db),
) -> UsuarioOut:
    return await service.atualizar_usuario(usuario.salon_id, usuario_id, dados, usuario.role, db)


@router.delete(
    "/{usuario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desativar usuário",
)
async def remover(
    usuario_id: uuid.UUID,
    usuario=Depends(apenas_owner()),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.remover_usuario(usuario.salon_id, usuario_id, usuario.id, db)
