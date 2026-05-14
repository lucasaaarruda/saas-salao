import uuid
from datetime import date
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modulos.agendamentos.model import Appointment
from app.modulos.financeiro.model import FinancialTransaction
from app.modulos.financeiro.schemas import ResumoFinanceiroOut, TransacaoCreate, TransacaoOut


async def listar_transacoes(
    salon_id: uuid.UUID,
    db: AsyncSession,
    data_inicio: date | None = None,
    data_fim: date | None = None,
    tipo: str | None = None,
    professional_id: uuid.UUID | None = None,
) -> list[TransacaoOut]:
    query = select(FinancialTransaction).where(FinancialTransaction.salon_id == salon_id)
    if data_inicio:
        query = query.where(FinancialTransaction.transaction_date >= data_inicio)
    if data_fim:
        query = query.where(FinancialTransaction.transaction_date <= data_fim)
    if tipo:
        query = query.where(FinancialTransaction.type == tipo)
    if professional_id:
        query = query.where(FinancialTransaction.professional_id == professional_id)
    query = query.order_by(FinancialTransaction.transaction_date.desc(), FinancialTransaction.created_at.desc())
    resultado = await db.execute(query)
    return [TransacaoOut.model_validate(t) for t in resultado.scalars().all()]


async def criar_transacao(
    salon_id: uuid.UUID,
    dados: TransacaoCreate,
    criado_por: uuid.UUID,
    db: AsyncSession,
) -> TransacaoOut:
    if dados.type not in ("income", "expense"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="type deve ser 'income' ou 'expense'",
        )

    transacao = FinancialTransaction(
        salon_id=salon_id,
        appointment_id=dados.appointment_id,
        professional_id=dados.professional_id,
        type=dados.type,
        category=dados.category,
        description=dados.description,
        amount=dados.amount,
        payment_method=dados.payment_method,
        transaction_date=dados.transaction_date,
        notes=dados.notes,
        created_by_id=criado_por,
    )
    db.add(transacao)
    await db.flush()
    return TransacaoOut.model_validate(transacao)


async def obter_transacao(
    salon_id: uuid.UUID, transacao_id: uuid.UUID, db: AsyncSession
) -> TransacaoOut:
    transacao = await db.scalar(
        select(FinancialTransaction).where(
            FinancialTransaction.id == transacao_id,
            FinancialTransaction.salon_id == salon_id,
        )
    )
    if not transacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada"
        )
    return TransacaoOut.model_validate(transacao)


async def remover_transacao(
    salon_id: uuid.UUID, transacao_id: uuid.UUID, db: AsyncSession
) -> None:
    transacao = await db.scalar(
        select(FinancialTransaction).where(
            FinancialTransaction.id == transacao_id,
            FinancialTransaction.salon_id == salon_id,
        )
    )
    if not transacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Transação não encontrada"
        )
    await db.delete(transacao)


async def resumo_financeiro(
    salon_id: uuid.UUID,
    db: AsyncSession,
    data_inicio: date | None = None,
    data_fim: date | None = None,
) -> ResumoFinanceiroOut:
    def _filtros_data(query):
        if data_inicio:
            query = query.where(FinancialTransaction.transaction_date >= data_inicio)
        if data_fim:
            query = query.where(FinancialTransaction.transaction_date <= data_fim)
        return query

    q_receitas = _filtros_data(
        select(func.coalesce(func.sum(FinancialTransaction.amount), 0)).where(
            FinancialTransaction.salon_id == salon_id,
            FinancialTransaction.type == "income",
        )
    )
    q_despesas = _filtros_data(
        select(func.coalesce(func.sum(FinancialTransaction.amount), 0)).where(
            FinancialTransaction.salon_id == salon_id,
            FinancialTransaction.type == "expense",
        )
    )

    receitas = await db.scalar(q_receitas) or Decimal("0")
    despesas = await db.scalar(q_despesas) or Decimal("0")

    q_agend = select(func.count(Appointment.id)).where(
        Appointment.salon_id == salon_id,
        Appointment.payment_status == "paid",
    )
    if data_inicio:
        q_agend = q_agend.where(Appointment.scheduled_date >= data_inicio)
    if data_fim:
        q_agend = q_agend.where(Appointment.scheduled_date <= data_fim)
    total_pagos = await db.scalar(q_agend) or 0

    return ResumoFinanceiroOut(
        total_receitas=Decimal(str(receitas)),
        total_despesas=Decimal(str(despesas)),
        saldo=Decimal(str(receitas)) - Decimal(str(despesas)),
        total_agendamentos_pagos=total_pagos,
    )
