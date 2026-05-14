import uuid
from datetime import date, datetime, time
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field


class ClienteRegistroInput(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    password: str = Field(min_length=8)
    phone: str = Field(min_length=8, max_length=20)
    cpf: str = Field(min_length=11, max_length=11, pattern=r"^\d{11}$")
    birth_date: date | None = None


class ClienteLoginInput(BaseModel):
    email: str
    password: str


class ClienteRefreshInput(BaseModel):
    refresh_token: str


class EsqueciSenhaInput(BaseModel):
    email: str


class RedefinirSenhaInput(BaseModel):
    token: str
    nova_senha: str = Field(min_length=8)


class ClientePublicoOut(BaseModel):
    id: uuid.UUID
    name: str
    email: str | None
    phone: str
    cpf: str | None
    birth_date: date | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ClienteTokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    cliente: ClientePublicoOut


class NovoAccessTokenClienteOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------------------------------------------------------------------------
# Booking API — schemas públicos
# ---------------------------------------------------------------------------

class SalaoPublicoOut(BaseModel):
    name: str
    slug: str
    city: str
    state: str
    phone: str
    opening_time: time
    closing_time: time
    working_days: list[int]
    allow_online_booking: bool

    model_config = {"from_attributes": True}


class ServicoPublicoOut(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    category: str
    duration_minutes: int
    price: Decimal
    color: str

    model_config = {"from_attributes": True}


class ProfissionalPublicoOut(BaseModel):
    id: uuid.UUID
    name: str
    specialty: str
    color: str

    model_config = {"from_attributes": True}


class AgendarInput(BaseModel):
    professional_id: uuid.UUID
    service_id: uuid.UUID
    scheduled_date: date
    start_time: time
    notes: str | None = None


class AgendamentoClienteOut(BaseModel):
    id: uuid.UUID
    service_id: uuid.UUID
    professional_id: uuid.UUID
    scheduled_date: date
    start_time: time
    end_time: time
    status: str
    final_price: Decimal
    notes: str | None
    created_at: datetime
    cancelled_at: datetime | None
    cancellation_reason: str | None

    model_config = {"from_attributes": True}
