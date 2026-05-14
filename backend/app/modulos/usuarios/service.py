import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.seguranca import hash_senha, verificar_senha
from app.modulos.usuarios.model import User
from app.modulos.usuarios.schemas import AlterarSenhaInput, UsuarioCreate, UsuarioOut, UsuarioUpdate


async def listar_usuarios(salon_id: uuid.UUID, db: AsyncSession) -> list[UsuarioOut]:
    resultado = await db.execute(
        select(User).where(User.salon_id == salon_id).order_by(User.name)
    )
    return [UsuarioOut.model_validate(u) for u in resultado.scalars().all()]


async def criar_usuario(
    salon_id: uuid.UUID, dados: UsuarioCreate, db: AsyncSession
) -> UsuarioOut:
    existente = await db.scalar(
        select(User).where(User.salon_id == salon_id, User.email == dados.email)
    )
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado neste salão",
        )

    roles_validas = {"owner", "manager", "professional", "receptionist"}
    if dados.role not in roles_validas:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role inválida. Use: {', '.join(roles_validas)}",
        )

    usuario = User(
        salon_id=salon_id,
        name=dados.name,
        email=dados.email,
        password_hash=hash_senha(dados.senha),
        role=dados.role,
    )
    db.add(usuario)
    await db.flush()
    return UsuarioOut.model_validate(usuario)


async def obter_usuario(
    salon_id: uuid.UUID, usuario_id: uuid.UUID, db: AsyncSession
) -> UsuarioOut:
    usuario = await db.scalar(
        select(User).where(User.id == usuario_id, User.salon_id == salon_id)
    )
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    return UsuarioOut.model_validate(usuario)


async def atualizar_usuario(
    salon_id: uuid.UUID,
    usuario_id: uuid.UUID,
    dados: UsuarioUpdate,
    solicitante_role: str,
    db: AsyncSession,
) -> UsuarioOut:
    usuario = await db.scalar(
        select(User).where(User.id == usuario_id, User.salon_id == salon_id)
    )
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")

    if usuario.role == "owner" and solicitante_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Não é possível alterar o proprietário",
        )

    for campo, valor in dados.model_dump(exclude_none=True).items():
        setattr(usuario, campo, valor)

    return UsuarioOut.model_validate(usuario)


async def remover_usuario(
    salon_id: uuid.UUID, usuario_id: uuid.UUID, solicitante_id: uuid.UUID, db: AsyncSession
) -> None:
    usuario = await db.scalar(
        select(User).where(User.id == usuario_id, User.salon_id == salon_id)
    )
    if not usuario:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado")
    if usuario.id == solicitante_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível remover seu próprio usuário",
        )
    if usuario.role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível remover o proprietário do salão",
        )
    usuario.is_active = False


async def alterar_senha(
    usuario_atual: User, dados: AlterarSenhaInput, db: AsyncSession
) -> None:
    if not verificar_senha(dados.senha_atual, usuario_atual.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta",
        )
    usuario_atual.password_hash = hash_senha(dados.nova_senha)
