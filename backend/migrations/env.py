import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

# Adiciona o diretório backend ao sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings
from app.core.banco import Base

# Importa todos os models para que o Alembic os detecte
from app.modulos.salao.model import Salon  # noqa: F401
from app.modulos.usuarios.model import User  # noqa: F401
from app.modulos.profissionais.model import Professional  # noqa: F401
from app.modulos.servicos.model import Service  # noqa: F401
from app.modulos.clientes.model import Client  # noqa: F401
from app.modulos.agendamentos.model import Appointment, AppointmentReminder  # noqa: F401
from app.modulos.financeiro.model import FinancialTransaction  # noqa: F401

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Gera SQL sem conexão ativa com o banco."""
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Executa migrations usando engine async (asyncpg)."""
    engine = create_async_engine(settings.DATABASE_URL, poolclass=pool.NullPool)
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
