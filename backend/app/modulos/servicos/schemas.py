import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class ServicoCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    description: str | None = None
    category: str = Field(min_length=2, max_length=100)
    duration_minutes: int = Field(ge=5, le=480)
    price: Decimal = Field(ge=0, decimal_places=2)
    commission_type: str = Field(default="percentage")  # percentage | fixed
    commission_value: Decimal = Field(default=Decimal("0"), ge=0, decimal_places=2)
    color: str = Field(default="#ec4899", pattern=r"^#[0-9a-fA-F]{6}$")


class ServicoUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=200)
    description: str | None = None
    category: str | None = Field(None, max_length=100)
    duration_minutes: int | None = Field(None, ge=5, le=480)
    price: Decimal | None = Field(None, ge=0, decimal_places=2)
    commission_type: str | None = None
    commission_value: Decimal | None = Field(None, ge=0, decimal_places=2)
    color: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    is_active: bool | None = None


class ServicoOut(BaseModel):
    id: uuid.UUID
    salon_id: uuid.UUID
    name: str
    description: str | None
    category: str
    duration_minutes: int
    price: Decimal
    commission_type: str
    commission_value: Decimal
    color: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
