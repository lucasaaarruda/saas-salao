import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.banco import get_db
from app.core.dependencias import owner_manager_ou_recepcionista, qualquer_autenticado
from app.modulos.clientes import service
from app.modulos.clientes.schemas import ClienteCreate, ClienteOut, ClienteUpdate

router = APIRouter(tags=["clientes"])


@router.get("", response_model=list[ClienteOut], summary="Listar clientes")
async def listar(
    busca: str | None = Query(None, max_length=100),
    apenas_ativos: bool = Query(True),
    usuario=Depends(qualquer_autenticado()),
    db: AsyncSession = Depends(get_db),
) -> list[ClienteOut]:
    return await service.listar_clientes(usuario.salon_id, db, busca, apenas_ativos)


@router.post(
    "",
    response_model=ClienteOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar cliente",
)
async def criar(
    dados: ClienteCreate,
    usuario=Depends(owner_manager_ou_recepcionista()),
    db: AsyncSession = Depends(get_db),
) -> ClienteOut:
    return await service.criar_cliente(usuario.salon_id, dados, db)


@router.get("/{cliente_id}", response_model=ClienteOut, summary="Obter cliente")
async def obter(
    cliente_id: uuid.UUID,
    usuario=Depends(qualquer_autenticado()),
    db: AsyncSession = Depends(get_db),
) -> ClienteOut:
    return await service.obter_cliente(usuario.salon_id, cliente_id, db)


@router.patch("/{cliente_id}", response_model=ClienteOut, summary="Atualizar cliente")
async def atualizar(
    cliente_id: uuid.UUID,
    dados: ClienteUpdate,
    usuario=Depends(owner_manager_ou_recepcionista()),
    db: AsyncSession = Depends(get_db),
) -> ClienteOut:
    return await service.atualizar_cliente(usuario.salon_id, cliente_id, dados, db)


@router.delete(
    "/{cliente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Desativar cliente",
)
async def remover(
    cliente_id: uuid.UUID,
    usuario=Depends(owner_manager_ou_recepcionista()),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.remover_cliente(usuario.salon_id, cliente_id, db)
