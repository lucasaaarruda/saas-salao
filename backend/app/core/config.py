from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Configuracoes(BaseSettings):
    model_config = SettingsConfigDict(
        env_file="../.env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Banco de dados
    DATABASE_URL: str
    POSTGRES_DB: str = "salao_db"
    POSTGRES_USER: str = "salao_user"
    POSTGRES_PASSWORD: str = "salao_pass"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: int = 5432

    # Redis
    REDIS_URL: str = "redis://redis:6379/0"

    # Segurança / JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # WhatsApp — Evolution API
    EVOLUTION_API_URL: str = ""
    EVOLUTION_API_KEY: str = ""
    EVOLUTION_INSTANCE: str = ""
    FRONTEND_URL: str = "http://localhost:5173"

    # Aplicação
    AMBIENTE: str = "development"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]
    PRIMEIRO_ADMIN_EMAIL: str = "admin@salaoapp.com.br"
    PRIMEIRO_ADMIN_SENHA: str = "troque-em-producao"

    # Storage
    STORAGE_TYPE: str = "local"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = ""

    # Frontend (apenas para referência — usadas pelo Vite)
    VITE_API_URL: str = "http://localhost:8000/api/v1"
    VITE_APP_NOME: str = "Salão App"
    VITE_APP_VERSAO: str = "1.0.0"

    @field_validator("BACKEND_CORS_ORIGINS", "ALLOWED_HOSTS", mode="before")
    @classmethod
    def montar_lista(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, str):
            import json
            return json.loads(v)
        return v


settings = Configuracoes()
