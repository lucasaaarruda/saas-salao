import uuid
from datetime import datetime, time

from pydantic import BaseModel, EmailStr, Field


class SalaoUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=200)
    phone: str | None = Field(None, min_length=8, max_length=20)
    email: EmailStr | None = None
    address: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, min_length=2, max_length=2)
    opening_time: time | None = None
    closing_time: time | None = None
    working_days: list[int] | None = None
    slot_duration_minutes: int | None = Field(None, ge=15, le=120)
    allow_online_booking: bool | None = None


class SalaoOut(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    phone: str
    email: str
    address: str
    city: str
    state: str
    logo_url: str | None
    plan: str
    is_active: bool
    opening_time: time
    closing_time: time
    working_days: list
    slot_duration_minutes: int
    allow_online_booking: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
