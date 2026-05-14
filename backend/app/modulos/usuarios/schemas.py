import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UsuarioCreate(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    senha: str = Field(min_length=8)
    role: str = Field(default="receptionist")


class UsuarioUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=200)
    email: EmailStr | None = None
    role: str | None = None
    is_active: bool | None = None


class AlterarSenhaInput(BaseModel):
    senha_atual: str
    nova_senha: str = Field(min_length=8)


class UsuarioOut(BaseModel):
    id: uuid.UUID
    salon_id: uuid.UUID
    name: str
    email: str
    role: str
    avatar_url: str | None
    is_active: bool
    created_at: datetime
    last_login_at: datetime | None

    model_config = {"from_attributes": True}
