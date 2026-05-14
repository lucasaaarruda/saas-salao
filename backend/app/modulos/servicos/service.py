import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modulos.servicos.model import Service
from app.modulos.servicos.schemas import ServicoCreate, ServicoOut, ServicoUpdate


async def listar_servicos(
    salon_id: uuid.UUID, db: AsyncSession, apenas_ativos: bool = True
) -> list[ServicoOut]:
    query = select(Service).where(Service.salon_id == salon_id)
    if apenas_ativos:
        query = query.where(Service.is_active.is_(True))
    query = query.order_by(Service.category, Service.name)
    resultado = await db.execute(query)
    return [ServicoOut.model_validate(s) for s in resultado.scalars().all()]


async def criar_servico(
    salon_id: uuid.UUID, dados: ServicoCreate, db: AsyncSession
) -> ServicoOut:
    if dados.commission_type not in ("percentage", "fixed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="commission_type deve ser 'percentage' ou 'fixed'",
        )

    servico = Service(
        salon_id=salon_id,
        name=dados.name,
        description=dados.description,
        category=dados.category,
        duration_minutes=dados.duration_minutes,
        price=dados.price,
        commission_type=dados.commission_type,
        commission_value=dados.commission_value,
        color=dados.color,
    )
    db.add(servico)
    await db.flush()
    return ServicoOut.model_validate(servico)


async def obter_servico(
    salon_id: uuid.UUID, servico_id: uuid.UUID, db: AsyncSession
) -> ServicoOut:
    servico = await db.scalar(
        select(Service).where(Service.id == servico_id, Service.salon_id == salon_id)
    )
    if not servico:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")
    return ServicoOut.model_validate(servico)


async def atualizar_servico(
    salon_id: uuid.UUID,
    servico_id: uuid.UUID,
    dados: ServicoUpdate,
    db: AsyncSession,
) -> ServicoOut:
    servico = await db.scalar(
        select(Service).where(Service.id == servico_id, Service.salon_id == salon_id)
    )
    if not servico:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")

    for campo, valor in dados.model_dump(exclude_none=True).items():
        setattr(servico, campo, valor)

    return ServicoOut.model_validate(servico)


async def remover_servico(
    salon_id: uuid.UUID, servico_id: uuid.UUID, db: AsyncSession
) -> None:
    servico = await db.scalar(
        select(Service).where(Service.id == servico_id, Service.salon_id == salon_id)
    )
    if not servico:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")
    servico.is_active = False
