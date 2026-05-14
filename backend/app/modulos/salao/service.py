import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modulos.salao.model import Salon
from app.modulos.salao.schemas import SalaoOut, SalaoUpdate


async def obter_salao(salon_id: uuid.UUID, db: AsyncSession) -> SalaoOut:
    salao = await db.scalar(select(Salon).where(Salon.id == salon_id, Salon.is_active.is_(True)))
    if not salao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salão não encontrado")
    return SalaoOut.model_validate(salao)


async def atualizar_salao(
    salon_id: uuid.UUID, dados: SalaoUpdate, db: AsyncSession
) -> SalaoOut:
    salao = await db.scalar(select(Salon).where(Salon.id == salon_id, Salon.is_active.is_(True)))
    if not salao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salão não encontrado")

    for campo, valor in dados.model_dump(exclude_none=True).items():
        setattr(salao, campo, valor)

    return SalaoOut.model_validate(salao)

