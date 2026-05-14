"""
Tarefas Celery para lembretes de agendamento e manutenção automática.

Fluxo de lembretes:
  1. Beat chama verificar_lembretes_pendentes() a cada 15 min
  2. A tarefa busca AppointmentReminder com status="pending" e scheduled_for <= agora + 1min
  3. Para cada lembrete encontrado, enfileira enviar_lembrete.delay(reminder_id)
  4. enviar_lembrete envia o email/SMS e marca o lembrete como sent ou failed
"""

import asyncio
import logging
from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from sqlalchemy import select

from app.tarefas.celery_app import celery

logger = logging.getLogger(__name__)


def _get_session():
    """Cria uma AsyncSession síncrona para uso dentro de tarefas Celery."""
    from app.core.banco import SessionLocal
    return SessionLocal()


async def _buscar_lembretes_pendentes():
    from app.modulos.agendamentos.model import Appointment, AppointmentReminder

    agora = datetime.now(timezone.utc)
    async with _get_session() as db:
        resultado = await db.execute(
            select(AppointmentReminder)
            .join(Appointment, AppointmentReminder.appointment_id == Appointment.id)
            .where(
                AppointmentReminder.status == "pending",
                AppointmentReminder.scheduled_for <= agora + timedelta(minutes=1),
                Appointment.status.in_(["scheduled", "confirmed"]),
            )
        )
        return [r.id for r in resultado.scalars().all()]


async def _enviar_lembrete_async(reminder_id: UUID):
    from app.modulos.agendamentos.model import Appointment, AppointmentReminder
    from app.modulos.clientes.model import Client

    async with _get_session() as db:
        lembrete = await db.scalar(
            select(AppointmentReminder).where(AppointmentReminder.id == reminder_id)
        )
        if not lembrete or lembrete.status != "pending":
            return

        agendamento = await db.scalar(
            select(Appointment).where(Appointment.id == lembrete.appointment_id)
        )
        if not agendamento:
            return

        cliente = await db.scalar(
            select(Client).where(Client.id == agendamento.client_id)
        )

        try:
            await _tentar_enviar_email(lembrete, agendamento, cliente)
            lembrete.status = "sent"
            lembrete.sent_at = datetime.now(timezone.utc)
        except Exception as exc:
            logger.warning("Falha ao enviar lembrete %s: %s", reminder_id, exc)
            lembrete.status = "failed"
            lembrete.error_message = str(exc)[:500]

        await db.commit()


async def _tentar_enviar_email(lembrete, agendamento, cliente):
    from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

    from app.core.config import settings

    if not settings.SMTP_USER or not cliente or not cliente.email:
        return

    tipo = "24 horas" if lembrete.type == "24h" else "1 hora"
    conf = ConnectionConfig(
        MAIL_USERNAME=settings.SMTP_USER,
        MAIL_PASSWORD=settings.SMTP_PASSWORD,
        MAIL_FROM=settings.EMAILS_FROM_EMAIL,
        MAIL_PORT=settings.SMTP_PORT,
        MAIL_SERVER=settings.SMTP_HOST,
        MAIL_FROM_NAME=settings.EMAILS_FROM_NAME,
        MAIL_STARTTLS=True,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=bool(settings.SMTP_USER),
        VALIDATE_CERTS=True,
    )
    mensagem = MessageSchema(
        subject=f"Lembrete de agendamento — {tipo}",
        recipients=[cliente.email],
        body=(
            f"Olá, {cliente.name}!\n\n"
            f"Lembramos que você tem um agendamento em {tipo}:\n"
            f"Data: {agendamento.scheduled_date.strftime('%d/%m/%Y')}\n"
            f"Horário: {agendamento.start_time.strftime('%H:%M')}\n\n"
            f"Até breve!"
        ),
        subtype=MessageType.plain,
    )
    fm = FastMail(conf)
    await fm.send_message(mensagem)


async def _marcar_no_shows_async():
    from app.modulos.agendamentos.model import Appointment

    agora = datetime.now(timezone.utc)
    hoje = agora.date()

    async with _get_session() as db:
        resultado = await db.execute(
            select(Appointment).where(
                Appointment.status.in_(["scheduled", "confirmed"]),
                Appointment.scheduled_date < hoje,
            )
        )
        atrasados = resultado.scalars().all()
        for agendamento in atrasados:
            agendamento.status = "no_show"
        await db.commit()
        logger.info("Marcados %d agendamentos como no_show", len(atrasados))


# ---------------------------------------------------------------------------
# Tarefas Celery
# ---------------------------------------------------------------------------

@celery.task(name="app.tarefas.lembretes.verificar_lembretes_pendentes", bind=True, max_retries=3)
def verificar_lembretes_pendentes(self):
    """Busca lembretes pendentes e enfileira o envio de cada um."""
    ids = asyncio.run(_buscar_lembretes_pendentes())
    for reminder_id in ids:
        enviar_lembrete.delay(str(reminder_id))
    logger.info("Enfileirados %d lembretes", len(ids))


@celery.task(name="app.tarefas.lembretes.enviar_lembrete", bind=True, max_retries=3)
def enviar_lembrete(self, reminder_id: str):
    """Envia o lembrete (email/SMS) e atualiza o status no banco."""
    try:
        asyncio.run(_enviar_lembrete_async(UUID(reminder_id)))
    except Exception as exc:
        logger.error("Erro ao enviar lembrete %s: %s", reminder_id, exc)
        raise self.retry(exc=exc, countdown=60)


@celery.task(name="app.tarefas.lembretes.marcar_no_shows", bind=True)
def marcar_no_shows(self):
    """Marca como no_show agendamentos passados que ainda estão em scheduled/confirmed."""
    asyncio.run(_marcar_no_shows_async())


# ---------------------------------------------------------------------------
# Utilitário: agendar lembretes ao criar um agendamento
# ---------------------------------------------------------------------------

async def agendar_lembretes(appointment_id: UUID, scheduled_date, start_time, db):
    """
    Cria dois AppointmentReminder: 24h antes e 1h antes do agendamento.
    Chamado pelo service de agendamentos após criar o Appointment.
    """
    from app.modulos.agendamentos.model import AppointmentReminder

    dt_agendamento = datetime.combine(scheduled_date, start_time, tzinfo=timezone.utc)
    agora = datetime.now(timezone.utc)

    lembretes = [
        ("24h", dt_agendamento - timedelta(hours=24)),
        ("1h", dt_agendamento - timedelta(hours=1)),
    ]

    for tipo, quando in lembretes:
        if quando > agora:
            db.add(
                AppointmentReminder(
                    appointment_id=appointment_id,
                    type=tipo,
                    scheduled_for=quando,
                )
            )
