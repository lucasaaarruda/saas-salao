import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class TransacaoCreate(BaseModel):
    type: str  # income | expense
    category: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=2, max_length=500)
    amount: Decimal = Field(gt=0, decimal_places=2)
    payment_method: str = Field(min_length=2, max_length=20)
    transaction_date: date
    appointment_id: uuid.UUID | None = None
    professional_id: uuid.UUID | None = None
    notes: str | None = None


class TransacaoOut(BaseModel):
    id: uuid.UUID
    salon_id: uuid.UUID
    appointment_id: uuid.UUID | None
    professional_id: uuid.UUID | None
    type: str
    category: str
    description: str
    amount: Decimal
    payment_method: str
    transaction_date: date
    notes: str | None
    created_by_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class ResumoFinanceiroOut(BaseModel):
    total_receitas: Decimal
    total_despesas: Decimal
    saldo: Decimal
    total_agendamentos_pagos: int
