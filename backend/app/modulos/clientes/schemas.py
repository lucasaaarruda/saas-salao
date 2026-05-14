import uuid
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field


class ClienteCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    phone: str = Field(min_length=8, max_length=20)
    email: EmailStr | None = None
    birth_date: date | None = None
    cpf: str | None = Field(None, min_length=11, max_length=11, pattern=r"^\d{11}$")
    notes: str | None = None
    how_met: str | None = Field(None, max_length=200)


class ClienteUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=200)
    phone: str | None = Field(None, min_length=8, max_length=20)
    email: EmailStr | None = None
    birth_date: date | None = None
    cpf: str | None = Field(None, min_length=11, max_length=11, pattern=r"^\d{11}$")
    notes: str | None = None
    how_met: str | None = Field(None, max_length=200)
    is_active: bool | None = None


class ClienteOut(BaseModel):
    id: uuid.UUID
    salon_id: uuid.UUID
    name: str
    phone: str
    email: str | None
    birth_date: date | None
    cpf: str | None
    notes: str | None
    how_met: str | None
    total_spent: Decimal
    visit_count: int
    last_visit_date: date | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
