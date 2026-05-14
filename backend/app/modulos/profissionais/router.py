import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.banco import get_db
from app.core.dependencias import apenas_owner, owner_ou_manager, qualquer_autenticado
from app.modulos.profissionais import service
from app.modulos.profissionais.schemas import ProfissionalCreate, ProfissionalOut, ProfissionalUpdate

router = APIRouter(tags=["profissionais"])


@router.get("", response_model=list[ProfissionalOut], summary="Listar profissionais")
async def listar(
    apenas_ativos: bool = Query(True),
    usuario=Depends(qualquer_autenticado()),
    db: AsyncSession = Depends(get_db),
) -> list[ProfissionalOut]:
    return await service.listar_profissionais(usuario.salon_id, db, apenas_ativos)


@router.post(
    "",
    response_model=ProfissionalOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar profissional",
)
async def criar(
    dados: ProfissionalCreate,
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> ProfissionalOut:
    return await service.criar_profissional(usuario.salon_id, dados, db)


@router.get("/{profissional_id}", response_model=ProfissionalOut, summary="Obter profissional")
async def obter(
    profissional_id: uuid.UUID,
    usuario=Depends(qualquer_autenticado()),
    db: AsyncSession = Depends(get_db),
) -> ProfissionalOut:
    return await service.obter_profissional(usuario.salon_id, profissional_id, db)


@router.patch("/{profissional_id}", response_model=ProfissionalOut, summary="Atualizar profissional")
async def atualizar(
    profissional_id: uuid.UUID,
    dados: ProfissionalUpdate,
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> ProfissionalOut:
    return await service.atualizar_profissional(usuario.salon_id, profissional_id, dados, db)


@router.delete(
    "/{profissional_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desativar profissional",
)
async def remover(
    profissional_id: uuid.UUID,
    usuario=Depends(apenas_owner()),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.remover_profissional(usuario.salon_id, profissional_id, db)
