import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Configurar variáveis de ambiente para testes ANTES de qualquer import da app
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-tests-only-32chars!!")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("AMBIENTE", "test")
os.environ.setdefault("PRIMEIRO_ADMIN_EMAIL", "admin@test.com")
os.environ.setdefault("PRIMEIRO_ADMIN_SENHA", "TestPass123!")

from app.core.banco import Base, get_db
from app.main import app

# Engine de teste usando SQLite em memória
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine_test = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = async_sessionmaker(
    bind=engine_test,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@pytest_asyncio.fixture(scope="session")
async def create_tables():
    """Cria todas as tabelas no banco de testes antes dos testes."""
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine_test.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session(create_tables):
    """Sessão de banco de dados isolada para cada teste."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session):
    """Cliente HTTP de teste com injeção de dependência de banco."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
def dados_registro():
    """Dados padrão para registrar um salão e usuário."""
    return {
        "nome_salao": "Salão Belezzi Teste",
        "telefone_salao": "(11) 98765-4321",
        "cidade": "São Paulo",
        "estado": "SP",
        "endereco_salao": "Rua das Flores, 123",
        "email_salao": "salao@belezzi.com.br",
        "nome_owner": "Lucas Arruda",
        "email_owner": "lucas@belezzi.com.br",
        "senha": "SenhaSegura123!",
        "confirmar_senha": "SenhaSegura123!",
    }
