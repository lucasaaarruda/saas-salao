import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.banco import get_db
from app.core.dependencias import apenas_owner, owner_ou_manager, qualquer_autenticado
from app.modulos.servicos import service
from app.modulos.servicos.schemas import ServicoCreate, ServicoOut, ServicoUpdate

router = APIRouter(tags=["serviços"])


@router.get("", response_model=list[ServicoOut], summary="Listar serviços")
async def listar(
    apenas_ativos: bool = Query(True),
    usuario=Depends(qualquer_autenticado()),
    db: AsyncSession = Depends(get_db),
) -> list[ServicoOut]:
    return await service.listar_servicos(usuario.salon_id, db, apenas_ativos)


@router.post(
    "",
    response_model=ServicoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar serviço",
)
async def criar(
    dados: ServicoCreate,
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> ServicoOut:
    return await service.criar_servico(usuario.salon_id, dados, db)


@router.get("/{servico_id}", response_model=ServicoOut, summary="Obter serviço")
async def obter(
    servico_id: uuid.UUID,
    usuario=Depends(qualquer_autenticado()),
    db: AsyncSession = Depends(get_db),
) -> ServicoOut:
    return await service.obter_servico(usuario.salon_id, servico_id, db)


@router.patch("/{servico_id}", response_model=ServicoOut, summary="Atualizar serviço")
async def atualizar(
    servico_id: uuid.UUID,
    dados: ServicoUpdate,
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> ServicoOut:
    return await service.atualizar_servico(usuario.salon_id, servico_id, dados, db)


@router.delete(
    "/{servico_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desativar serviço",
)
async def remover(
    servico_id: uuid.UUID,
    usuario=Depends(apenas_owner()),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.remover_servico(usuario.salon_id, servico_id, db)
