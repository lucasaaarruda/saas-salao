from contextlib import asynccontextmanager
from datetime import time

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import select, text

from app.core.banco import SessionLocal, engine
from app.core.config import settings
from app.core.limitador import limiter
from app.core.seguranca import hash_senha
from app.modulos.salao.model import Salon
from app.modulos.usuarios.model import User


async def _criar_admin_padrao() -> None:
    async with SessionLocal() as db:
        existe = await db.scalar(
            select(User).where(User.email == settings.PRIMEIRO_ADMIN_EMAIL)
        )
        if existe:
            return

        salao = Salon(
            name="Administração",
            slug="admin",
            phone="(11) 99999-9999",
            email=settings.PRIMEIRO_ADMIN_EMAIL,
            address="",
            city="São Paulo",
            state="SP",
            opening_time=time(8, 0),
            closing_time=time(20, 0),
            working_days=[1, 2, 3, 4, 5],
            slot_duration_minutes=30,
        )
        db.add(salao)
        await db.flush()

        admin = User(
            salon_id=salao.id,
            name="Administrador",
            email=settings.PRIMEIRO_ADMIN_EMAIL,
            password_hash=hash_senha(settings.PRIMEIRO_ADMIN_SENHA),
            role="owner",
        )
        db.add(admin)
        await db.commit()
        print(f"✅ Admin padrão criado: {settings.PRIMEIRO_ADMIN_EMAIL}")


# ---------------------------------------------------------------------------
# Lifespan: verifica conexão com banco e cria admin padrão
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.connect() as conn:
        await conn.execute(text("SELECT 1"))
    await _criar_admin_padrao()
    yield
    await engine.dispose()


# ---------------------------------------------------------------------------
# Instância da aplicação
# ---------------------------------------------------------------------------
app = FastAPI(
    title="SaaS Salão de Beleza",
    description="API de gerenciamento de agendamentos para salões de beleza",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Em produção, bloquear hosts não autorizados
if settings.AMBIENTE == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["seudominio.com.br", "www.seudominio.com.br"],
    )


# ---------------------------------------------------------------------------
# Handler global de exceções não tratadas
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def handler_erro_generico(request: Request, exc: Exception):
    if settings.AMBIENTE == "development":
        raise exc
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Erro interno do servidor. Tente novamente mais tarde."},
    )


# ---------------------------------------------------------------------------
# Registro dos routers (importados após a criação do app para evitar circular)
# ---------------------------------------------------------------------------
def registrar_routers():
    from app.modulos.auth.router import router as auth_router
    from app.modulos.agendamentos.router import router as agendamentos_router
    from app.modulos.booking.router import router as booking_router
    from app.modulos.clientes.router import router as clientes_router
    from app.modulos.financeiro.router import router as financeiro_router
    from app.modulos.profissionais.router import router as profissionais_router
    from app.modulos.relatorios.router import router as relatorios_router
    from app.modulos.salao.router import router as salao_router
    from app.modulos.servicos.router import router as servicos_router
    from app.modulos.usuarios.router import router as usuarios_router

    prefix = "/api/v1"

    app.include_router(auth_router, prefix=f"{prefix}/auth")
    app.include_router(salao_router, prefix=f"{prefix}/salon")
    app.include_router(usuarios_router, prefix=f"{prefix}/users")
    app.include_router(profissionais_router, prefix=f"{prefix}/professionals")
    app.include_router(servicos_router, prefix=f"{prefix}/services")
    app.include_router(clientes_router, prefix=f"{prefix}/clients")
    app.include_router(agendamentos_router, prefix=f"{prefix}/appointments")
    app.include_router(financeiro_router, prefix=f"{prefix}/financial")
    app.include_router(relatorios_router, prefix=f"{prefix}/reports")
    app.include_router(booking_router, prefix=f"{prefix}/booking")


registrar_routers()


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/api/health", tags=["sistema"])
async def health_check():
    return {"status": "ok", "ambiente": settings.AMBIENTE}
