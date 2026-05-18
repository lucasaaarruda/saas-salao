"""
Tarefas Celery para notificações imediatas via WhatsApp.

Disparadas com .delay() logo após a criação de um agendamento,
recebendo todos os dados como parâmetros para evitar race condition
com a transação do banco ainda não commitada.
"""

import asyncio
import logging

from app.tarefas.celery_app import celery

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Mensagens
# ---------------------------------------------------------------------------

def _msg_confirmacao_cliente(
    client_name: str,
    service_name: str,
    professional_name: str,
    data: str,
    horario: str,
    valor: str,
    salon_name: str,
    booking_link: str,
) -> str:
    return (
        f"✅ *Agendamento confirmado!*\n\n"
        f"Olá, {client_name}! Seu agendamento foi marcado com sucesso.\n\n"
        f"📋 *Serviço:* {service_name}\n"
        f"👤 *Profissional:* {professional_name}\n"
        f"📅 *Data:* {data}\n"
        f"🕐 *Horário:* {horario}\n"
        f"💰 *Valor:* {valor}\n\n"
        f"Para ver ou gerenciar seus agendamentos:\n"
        f"{booking_link}\n\n"
        f"_{salon_name}_"
    )


def _msg_novo_agendamento_salao(
    client_name: str,
    client_phone: str,
    service_name: str,
    data: str,
    horario: str,
) -> str:
    return (
        f"🔔 *Novo agendamento recebido!*\n\n"
        f"👤 *Cliente:* {client_name}\n"
        f"📞 *Telefone:* {client_phone}\n"
        f"📋 *Serviço:* {service_name}\n"
        f"📅 *Data:* {data}\n"
        f"🕐 *Horário:* {horario}"
    )


def _msg_cancelamento_cliente(
    client_name: str,
    service_name: str,
    data: str,
    horario: str,
    salon_name: str,
) -> str:
    return (
        f"❌ *Agendamento cancelado*\n\n"
        f"Olá, {client_name}! Seu agendamento foi cancelado.\n\n"
        f"📋 *Serviço:* {service_name}\n"
        f"📅 *Data:* {data}\n"
        f"🕐 *Horário:* {horario}\n\n"
        f"Para fazer um novo agendamento, acesse o link do salão.\n\n"
        f"_{salon_name}_"
    )


def _msg_cancelamento_salao(
    client_name: str,
    service_name: str,
    data: str,
    horario: str,
) -> str:
    return (
        f"⚠️ *Agendamento cancelado pelo cliente*\n\n"
        f"👤 *Cliente:* {client_name}\n"
        f"📋 *Serviço:* {service_name}\n"
        f"📅 *Data:* {data}\n"
        f"🕐 *Horário:* {horario}"
    )


def _msg_reagendamento_cliente(
    client_name: str,
    service_name: str,
    professional_name: str,
    nova_data: str,
    novo_horario: str,
    salon_name: str,
    booking_link: str,
) -> str:
    return (
        f"🔄 *Agendamento reagendado!*\n\n"
        f"Olá, {client_name}! Seu agendamento foi reagendado com sucesso.\n\n"
        f"📋 *Serviço:* {service_name}\n"
        f"👤 *Profissional:* {professional_name}\n"
        f"📅 *Nova data:* {nova_data}\n"
        f"🕐 *Novo horário:* {novo_horario}\n\n"
        f"Para ver seus agendamentos:\n"
        f"{booking_link}\n\n"
        f"_{salon_name}_"
    )


def _msg_reagendamento_salao(
    client_name: str,
    service_name: str,
    nova_data: str,
    novo_horario: str,
) -> str:
    return (
        f"🔄 *Agendamento reagendado pelo cliente*\n\n"
        f"👤 *Cliente:* {client_name}\n"
        f"📋 *Serviço:* {service_name}\n"
        f"📅 *Nova data:* {nova_data}\n"
        f"🕐 *Novo horário:* {novo_horario}"
    )


# ---------------------------------------------------------------------------
# Helpers async
# ---------------------------------------------------------------------------

async def _enviar_confirmacao_async(
    client_phone: str,
    client_name: str,
    salon_phone: str,
    salon_name: str,
    service_name: str,
    professional_name: str,
    data: str,
    horario: str,
    valor: str,
    booking_link: str,
    notificar_salao: bool,
) -> None:
    from app.infra.whatsapp import enviar_mensagem

    msg_cliente = _msg_confirmacao_cliente(
        client_name, service_name, professional_name, data, horario, valor, salon_name, booking_link
    )
    await enviar_mensagem(client_phone, msg_cliente)

    if notificar_salao:
        msg_salao = _msg_novo_agendamento_salao(client_name, client_phone, service_name, data, horario)
        await enviar_mensagem(salon_phone, msg_salao)


async def _enviar_reagendamento_async(
    client_phone: str,
    client_name: str,
    salon_phone: str,
    salon_name: str,
    service_name: str,
    professional_name: str,
    nova_data: str,
    novo_horario: str,
    booking_link: str,
) -> None:
    from app.infra.whatsapp import enviar_mensagem

    msg_cliente = _msg_reagendamento_cliente(
        client_name, service_name, professional_name, nova_data, novo_horario, salon_name, booking_link
    )
    await enviar_mensagem(client_phone, msg_cliente)

    msg_salao = _msg_reagendamento_salao(client_name, service_name, nova_data, novo_horario)
    await enviar_mensagem(salon_phone, msg_salao)


async def _enviar_cancelamento_async(
    client_phone: str,
    client_name: str,
    salon_phone: str,
    salon_name: str,
    service_name: str,
    data: str,
    horario: str,
) -> None:
    from app.infra.whatsapp import enviar_mensagem

    msg_cliente = _msg_cancelamento_cliente(client_name, service_name, data, horario, salon_name)
    await enviar_mensagem(client_phone, msg_cliente)

    msg_salao = _msg_cancelamento_salao(client_name, service_name, data, horario)
    await enviar_mensagem(salon_phone, msg_salao)


# ---------------------------------------------------------------------------
# Tarefas Celery
# ---------------------------------------------------------------------------

@celery.task(
    name="app.tarefas.notificacoes.notificar_novo_agendamento",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def notificar_novo_agendamento(
    self,
    client_phone: str,
    client_name: str,
    salon_phone: str,
    salon_name: str,
    service_name: str,
    professional_name: str,
    data: str,
    horario: str,
    valor: str,
    booking_link: str,
    notificar_salao: bool = True,
) -> None:
    """
    Envia confirmação de agendamento para o cliente e, opcionalmente,
    aviso de novo agendamento para o salão.
    """
    try:
        asyncio.run(_enviar_confirmacao_async(
            client_phone, client_name, salon_phone, salon_name,
            service_name, professional_name, data, horario, valor,
            booking_link, notificar_salao,
        ))
        logger.info("Confirmação WhatsApp enviada para %s", client_phone)
    except Exception as exc:
        logger.error("Erro ao notificar novo agendamento: %s", exc)
        raise self.retry(exc=exc)


@celery.task(
    name="app.tarefas.notificacoes.notificar_cancelamento",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def notificar_cancelamento(
    self,
    client_phone: str,
    client_name: str,
    salon_phone: str,
    salon_name: str,
    service_name: str,
    data: str,
    horario: str,
) -> None:
    """Envia aviso de cancelamento para o cliente e para o salão."""
    try:
        asyncio.run(_enviar_cancelamento_async(
            client_phone, client_name, salon_phone, salon_name,
            service_name, data, horario,
        ))
        logger.info("Notificação de cancelamento enviada para %s", client_phone)
    except Exception as exc:
        logger.error("Erro ao notificar cancelamento: %s", exc)
        raise self.retry(exc=exc)


@celery.task(
    name="app.tarefas.notificacoes.notificar_reagendamento",
    bind=True,
    max_retries=3,
    default_retry_delay=30,
)
def notificar_reagendamento(
    self,
    client_phone: str,
    client_name: str,
    salon_phone: str,
    salon_name: str,
    service_name: str,
    professional_name: str,
    nova_data: str,
    novo_horario: str,
    booking_link: str,
) -> None:
    """Envia confirmação de reagendamento para o cliente e aviso para o salão."""
    try:
        asyncio.run(_enviar_reagendamento_async(
            client_phone, client_name, salon_phone, salon_name,
            service_name, professional_name, nova_data, novo_horario, booking_link,
        ))
        logger.info("Notificação de reagendamento enviada para %s", client_phone)
    except Exception as exc:
        logger.error("Erro ao notificar reagendamento: %s", exc)
        raise self.retry(exc=exc)
