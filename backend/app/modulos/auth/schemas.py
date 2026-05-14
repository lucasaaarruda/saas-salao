import uuid

from pydantic import BaseModel, EmailStr, Field, model_validator


class RegistrarSalaoInput(BaseModel):
    # Dados do salão (Step 1 do wizard)
    nome_salao: str = Field(min_length=2, max_length=200)
    telefone_salao: str = Field(min_length=8, max_length=20)
    cidade: str = Field(min_length=2, max_length=100)
    estado: str = Field(min_length=2, max_length=2)
    endereco_salao: str = Field(default="", max_length=500)
    email_salao: EmailStr | None = None

    # Dados do proprietário (Step 2 do wizard)
    nome_owner: str = Field(min_length=2, max_length=200)
    email_owner: EmailStr
    senha: str = Field(min_length=8)
    confirmar_senha: str

    @model_validator(mode="after")
    def senhas_conferem(self) -> "RegistrarSalaoInput":
        if self.senha != self.confirmar_senha:
            raise ValueError("As senhas não conferem")
        return self


class LoginInput(BaseModel):
    email: EmailStr
    senha: str


class RefreshInput(BaseModel):
    refresh_token: str


class RecuperarSenhaInput(BaseModel):
    email: EmailStr


class RedefinirSenhaInput(BaseModel):
    token: str
    nova_senha: str = Field(min_length=8)


class UsuarioOut(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    salon_id: uuid.UUID
    is_active: bool

    model_config = {"from_attributes": True}


class TokenOutput(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut


class NovoAccessTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
