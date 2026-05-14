from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.banco import get_db
from app.core.dependencias import apenas_owner, owner_ou_manager
from app.modulos.salao import service
from app.modulos.salao.schemas import SalaoOut, SalaoUpdate

router = APIRouter(tags=["salão"])


@router.get(
    "/me",
    response_model=SalaoOut,
    summary="Obter dados do salão",
)
async def obter_salao(
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> SalaoOut:
    return await service.obter_salao(usuario.salon_id, db)


@router.patch(
    "/me",
    response_model=SalaoOut,
    summary="Atualizar dados do salão",
)
async def atualizar_salao(
    dados: SalaoUpdate,
    usuario=Depends(apenas_owner()),
    db: AsyncSession = Depends(get_db),
) -> SalaoOut:
    return await service.atualizar_salao(usuario.salon_id, dados, db)
