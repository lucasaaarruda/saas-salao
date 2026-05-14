import uuid
from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator


class AgendamentoCreate(BaseModel):
    client_id: uuid.UUID
    professional_id: uuid.UUID
    service_id: uuid.UUID
    scheduled_date: date
    start_time: time
    discount: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    payment_method: str | None = None
    notes: str | None = None


class AgendamentoUpdate(BaseModel):
    scheduled_date: date | None = None
    start_time: time | None = None
    professional_id: uuid.UUID | None = None
    service_id: uuid.UUID | None = None
    discount: Decimal | None = Field(None, ge=0, decimal_places=2)
    notes: str | None = None


class AgendamentoStatusUpdate(BaseModel):
    status: str
    payment_method: str | None = None
    cancellation_reason: str | None = None

    @model_validator(mode="after")
    def validar_status(self) -> "AgendamentoStatusUpdate":
        validos = {"scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"}
        if self.status not in validos:
            raise ValueError(f"Status inválido. Use: {', '.join(sorted(validos))}")
        if self.status == "cancelled" and not self.cancellation_reason:
            raise ValueError("Motivo de cancelamento é obrigatório")
        return self


class AgendamentoOut(BaseModel):
    id: uuid.UUID
    salon_id: uuid.UUID
    client_id: uuid.UUID
    professional_id: uuid.UUID
    service_id: uuid.UUID
    scheduled_date: date
    start_time: time
    end_time: time
    status: str
    price: Decimal
    discount: Decimal
    final_price: Decimal
    payment_status: str
    payment_method: str | None
    notes: str | None
    created_by_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime
    cancelled_at: datetime | None
    cancellation_reason: str | None

    model_config = {"from_attributes": True}


class DisponibilidadeQuery(BaseModel):
    professional_id: uuid.UUID
    service_id: uuid.UUID
    data: date
