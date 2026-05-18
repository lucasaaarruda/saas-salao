"""
Tarefas Celery para lembretes de agendamento e manutenção automática.

Fluxo de lembretes:
  1. Beat chama verificar_lembretes_pendentes() a cada 15 min
  2. A tarefa busca AppointmentReminder com status="pending" e scheduled_for <= agora + 1min
  3. Para cada lembrete encontrado, enfileira enviar_lembrete.delay(reminder_id)
  4. enviar_lembrete envia a mensagem WhatsApp e marca o lembrete como sent ou failed
"""

import asyncio
import logging
from datetime import date, datetime, time, timedelta, timezone
from uuid import UUID

from sqlalchemy import select

from app.tarefas.celery_app import celery

logger = logging.getLogger(__name__)


def _get_session():
    """Cria uma AsyncSession para uso dentro de tarefas Celery."""
    from app.core.banco import SessionLocal
    return SessionLocal()


# ---------------------------------------------------------------------------
# Mensagens de lembrete
# ---------------------------------------------------------------------------

def _msg_lembrete_24h(
    client_name: str,
    service_name: str,
    professional_name: str,
    data: str,
    horario: str,
    salon_name: str,
) -> str:
    return (
        f"⏰ *Lembrete: você tem agendamento amanhã!*\n\n"
        f"Olá, {client_name}!\n\n"
        f"📋 *Serviço:* {service_name}\n"
        f"👤 *Profissional:* {professional_name}\n"
        f"📅 *Data:* {data}\n"
        f"🕐 *Horário:* {horario}\n\n"
        f"Te esperamos! 😊\n"
        f"_{salon_name}_"
    )


def _msg_lembrete_1h(
    client_name: str,
    service_name: str,
    professional_name: str,
    horario: str,
    salon_name: str,
) -> str:
    return (
        f"⏰ *Seu agendamento começa em 1 hora!*\n\n"
        f"Olá, {client_name}!\n\n"
        f"📋 *{service_name}* com {professional_name}\n"
        f"🕐 *Horário:* {horario}\n\n"
        f"Até daqui a pouco! ✨\n"
        f"_{salon_name}_"
    )


# ---------------------------------------------------------------------------
# Lógica assíncrona
# ---------------------------------------------------------------------------

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
    from app.infra.whatsapp import enviar_mensagem
    from app.modulos.agendamentos.model import Appointment, AppointmentReminder
    from app.modulos.clientes.model import Client
    from app.modulos.profissionais.model import Professional
    from app.modulos.salao.model import Salon
    from app.modulos.servicos.model import Service

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

        cliente = await db.scalar(select(Client).where(Client.id == agendamento.client_id))
        servico = await db.scalar(select(Service).where(Service.id == agendamento.service_id))
        profissional = await db.scalar(
            select(Professional).where(Professional.id == agendamento.professional_id)
        )
        salao = await db.scalar(select(Salon).where(Salon.id == agendamento.salon_id))

        if not cliente or not cliente.phone:
            lembrete.status = "failed"
            lembrete.error_message = "Cliente sem telefone cadastrado"
            await db.commit()
            return

        data_fmt = agendamento.scheduled_date.strftime("%d/%m/%Y")
        horario_fmt = agendamento.start_time.strftime("%H:%M")
        nome_servico = servico.name if servico else "Serviço"
        nome_profissional = profissional.name if profissional else "Profissional"
        nome_salao = salao.name if salao else "Salão"

        if lembrete.type == "24h":
            mensagem = _msg_lembrete_24h(
                cliente.name, nome_servico, nome_profissional,
                data_fmt, horario_fmt, nome_salao,
            )
        else:
            mensagem = _msg_lembrete_1h(
                cliente.name, nome_servico, nome_profissional,
                horario_fmt, nome_salao,
            )

        try:
            await enviar_mensagem(cliente.phone, mensagem)
            lembrete.status = "sent"
            lembrete.sent_at = datetime.now(timezone.utc)
        except Exception as exc:
            logger.warning("Falha ao enviar lembrete %s: %s", reminder_id, exc)
            lembrete.status = "failed"
            lembrete.error_message = str(exc)[:500]

        await db.commit()


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
    """Envia o lembrete via WhatsApp e atualiza o status no banco."""
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
