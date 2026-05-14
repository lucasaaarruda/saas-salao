import uuid

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modulos.clientes.model import Client
from app.modulos.clientes.schemas import ClienteCreate, ClienteOut, ClienteUpdate


async def listar_clientes(
    salon_id: uuid.UUID,
    db: AsyncSession,
    busca: str | None = None,
    apenas_ativos: bool = True,
) -> list[ClienteOut]:
    query = select(Client).where(Client.salon_id == salon_id)
    if apenas_ativos:
        query = query.where(Client.is_active.is_(True))
    if busca:
        termo = f"%{busca}%"
        query = query.where(
            or_(Client.name.ilike(termo), Client.phone.ilike(termo), Client.email.ilike(termo))
        )
    query = query.order_by(Client.name)
    resultado = await db.execute(query)
    return [ClienteOut.model_validate(c) for c in resultado.scalars().all()]


async def criar_cliente(
    salon_id: uuid.UUID, dados: ClienteCreate, db: AsyncSession
) -> ClienteOut:
    cliente = Client(
        salon_id=salon_id,
        name=dados.name,
        phone=dados.phone,
        email=str(dados.email) if dados.email else None,
        birth_date=dados.birth_date,
        cpf=dados.cpf,
        notes=dados.notes,
        how_met=dados.how_met,
    )
    db.add(cliente)
    await db.flush()
    return ClienteOut.model_validate(cliente)


async def obter_cliente(
    salon_id: uuid.UUID, cliente_id: uuid.UUID, db: AsyncSession
) -> ClienteOut:
    cliente = await db.scalar(
        select(Client).where(Client.id == cliente_id, Client.salon_id == salon_id)
    )
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")
    return ClienteOut.model_validate(cliente)


async def atualizar_cliente(
    salon_id: uuid.UUID,
    cliente_id: uuid.UUID,
    dados: ClienteUpdate,
    db: AsyncSession,
) -> ClienteOut:
    cliente = await db.scalar(
        select(Client).where(Client.id == cliente_id, Client.salon_id == salon_id)
    )
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    update_data = dados.model_dump(exclude_none=True)
    if "email" in update_data and update_data["email"] is not None:
        update_data["email"] = str(update_data["email"])

    for campo, valor in update_data.items():
        setattr(cliente, campo, valor)

    return ClienteOut.model_validate(cliente)


async def remover_cliente(
    salon_id: uuid.UUID, cliente_id: uuid.UUID, db: AsyncSession
) -> None:
    cliente = await db.scalar(
        select(Client).where(Client.id == cliente_id, Client.salon_id == salon_id)
    )
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")
    cliente.is_active = False
