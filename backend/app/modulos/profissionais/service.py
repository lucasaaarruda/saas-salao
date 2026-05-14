import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modulos.profissionais.model import Professional
from app.modulos.profissionais.schemas import ProfissionalCreate, ProfissionalOut, ProfissionalUpdate


async def listar_profissionais(
    salon_id: uuid.UUID, db: AsyncSession, apenas_ativos: bool = True
) -> list[ProfissionalOut]:
    query = select(Professional).where(Professional.salon_id == salon_id)
    if apenas_ativos:
        query = query.where(Professional.is_active.is_(True))
    query = query.order_by(Professional.name)
    resultado = await db.execute(query)
    return [ProfissionalOut.model_validate(p) for p in resultado.scalars().all()]


async def criar_profissional(
    salon_id: uuid.UUID, dados: ProfissionalCreate, db: AsyncSession
) -> ProfissionalOut:
    profissional = Professional(
        salon_id=salon_id,
        name=dados.name,
        phone=dados.phone,
        specialty=dados.specialty,
        commission_percentage=dados.commission_percentage,
        color=dados.color,
        working_hours=dados.working_hours,
        user_id=dados.user_id,
    )
    db.add(profissional)
    await db.flush()
    return ProfissionalOut.model_validate(profissional)


async def obter_profissional(
    salon_id: uuid.UUID, profissional_id: uuid.UUID, db: AsyncSession
) -> ProfissionalOut:
    profissional = await db.scalar(
        select(Professional).where(
            Professional.id == profissional_id, Professional.salon_id == salon_id
        )
    )
    if not profissional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profissional não encontrado"
        )
    return ProfissionalOut.model_validate(profissional)


async def atualizar_profissional(
    salon_id: uuid.UUID,
    profissional_id: uuid.UUID,
    dados: ProfissionalUpdate,
    db: AsyncSession,
) -> ProfissionalOut:
    profissional = await db.scalar(
        select(Professional).where(
            Professional.id == profissional_id, Professional.salon_id == salon_id
        )
    )
    if not profissional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profissional não encontrado"
        )

    for campo, valor in dados.model_dump(exclude_none=True).items():
        setattr(profissional, campo, valor)

    return ProfissionalOut.model_validate(profissional)


async def remover_profissional(
    salon_id: uuid.UUID, profissional_id: uuid.UUID, db: AsyncSession
) -> None:
    profissional = await db.scalar(
        select(Professional).where(
            Professional.id == profissional_id, Professional.salon_id == salon_id
        )
    )
    if not profissional:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profissional não encontrado"
        )
    profissional.is_active = False
