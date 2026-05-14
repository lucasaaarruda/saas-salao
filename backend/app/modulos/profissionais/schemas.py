import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ProfissionalCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    phone: str = Field(min_length=8, max_length=20)
    specialty: str = Field(min_length=2, max_length=200)
    commission_percentage: float = Field(default=40.0, ge=0, le=100)
    color: str = Field(default="#ec4899", pattern=r"^#[0-9a-fA-F]{6}$")
    working_hours: dict = Field(default_factory=dict)
    user_id: uuid.UUID | None = None


class ProfissionalUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=200)
    phone: str | None = Field(None, min_length=8, max_length=20)
    specialty: str | None = Field(None, max_length=200)
    commission_percentage: float | None = Field(None, ge=0, le=100)
    color: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    working_hours: dict | None = None
    is_active: bool | None = None
    user_id: uuid.UUID | None = None


class ProfissionalOut(BaseModel):
    id: uuid.UUID
    salon_id: uuid.UUID
    user_id: uuid.UUID | None
    name: str
    phone: str
    specialty: str
    commission_percentage: float
    color: str
    is_active: bool
    working_hours: dict
    created_at: datetime

    model_config = {"from_attributes": True}
