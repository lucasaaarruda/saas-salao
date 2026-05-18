import uuid
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modulos.agendamentos.model import Appointment
from app.modulos.agendamentos.schemas import (
    AgendamentoCreate,
    AgendamentoOut,
    AgendamentoStatusUpdate,
    AgendamentoUpdate,
)
from app.modulos.clientes.model import Client
from app.modulos.profissionais.model import Professional
from app.modulos.salao.model import Salon
from app.modulos.servicos.model import Service


def _combinar_datetime(d: date, t: time) -> datetime:
    return datetime.combine(d, t, tzinfo=timezone.utc)


def _calcular_fim(start: time, duration_minutes: int) -> time:
    dt = datetime.combine(date.today(), start) + timedelta(minutes=duration_minutes)
    return dt.time()


async def _verificar_conflito(
    db: AsyncSession,
    professional_id: uuid.UUID,
    scheduled_date: date,
    start_time: time,
    end_time: time,
    excluir_id: uuid.UUID | None = None,
) -> None:
    query = select(Appointment).where(
        Appointment.professional_id == professional_id,
        Appointment.scheduled_date == scheduled_date,
        Appointment.status.notin_(["cancelled", "no_show"]),
        Appointment.start_time < end_time,
        Appointment.end_time > start_time,
    )
    if excluir_id:
        query = query.where(Appointment.id != excluir_id)

    conflito = await db.scalar(query)
    if conflito:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Profissional já possui agendamento nesse horário",
        )


async def listar_agendamentos(
    salon_id: uuid.UUID,
    db: AsyncSession,
    data_inicio: date | None = None,
    data_fim: date | None = None,
    professional_id: uuid.UUID | None = None,
    client_id: uuid.UUID | None = None,
    status_filtro: str | None = None,
) -> list[AgendamentoOut]:
    query = select(Appointment).where(Appointment.salon_id == salon_id)
    if data_inicio:
        query = query.where(Appointment.scheduled_date >= data_inicio)
    if data_fim:
        query = query.where(Appointment.scheduled_date <= data_fim)
    if professional_id:
        query = query.where(Appointment.professional_id == professional_id)
    if client_id:
        query = query.where(Appointment.client_id == client_id)
    if status_filtro:
        query = query.where(Appointment.status == status_filtro)
    query = query.order_by(Appointment.scheduled_date, Appointment.start_time)
    resultado = await db.execute(query)
    return [AgendamentoOut.model_validate(a) for a in resultado.scalars().all()]


async def criar_agendamento(
    salon_id: uuid.UUID,
    dados: AgendamentoCreate,
    criado_por: uuid.UUID,
    db: AsyncSession,
) -> AgendamentoOut:
    servico = await db.scalar(
        select(Service).where(Service.id == dados.service_id, Service.salon_id == salon_id, Service.is_active.is_(True))
    )
    if not servico:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")

    profissional = await db.scalar(
        select(Professional).where(
            Professional.id == dados.professional_id,
            Professional.salon_id == salon_id,
            Professional.is_active.is_(True),
        )
    )
    if not profissional:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profissional não encontrado")

    cliente = await db.scalar(
        select(Client).where(Client.id == dados.client_id, Client.salon_id == salon_id)
    )
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente não encontrado")

    end_time = _calcular_fim(dados.start_time, servico.duration_minutes)
    await _verificar_conflito(db, dados.professional_id, dados.scheduled_date, dados.start_time, end_time)

    final_price = max(Decimal("0"), servico.price - dados.discount)

    agendamento = Appointment(
        salon_id=salon_id,
        client_id=dados.client_id,
        professional_id=dados.professional_id,
        service_id=dados.service_id,
        scheduled_date=dados.scheduled_date,
        start_time=dados.start_time,
        end_time=end_time,
        price=servico.price,
        discount=dados.discount,
        final_price=final_price,
        payment_method=dados.payment_method,
        notes=dados.notes,
        created_by_id=criado_por,
    )
    db.add(agendamento)
    await db.flush()

    from app.tarefas.lembretes import agendar_lembretes
    await agendar_lembretes(agendamento.id, agendamento.scheduled_date, agendamento.start_time, db)

    try:
        from app.core.config import settings
        from app.tarefas.notificacoes import notificar_novo_agendamento
        salao = await db.scalar(select(Salon).where(Salon.id == salon_id))
        if salao and cliente and cliente.phone:
            booking_link = f"{settings.FRONTEND_URL}/booking/{salao.slug}/meus-agendamentos"
            notificar_novo_agendamento.delay(
                client_phone=cliente.phone,
                client_name=cliente.name,
                salon_phone=salao.phone,
                salon_name=salao.name,
                service_name=servico.name,
                professional_name=profissional.name,
                data=agendamento.scheduled_date.strftime("%d/%m/%Y"),
                horario=agendamento.start_time.strftime("%H:%M"),
                valor=f"R$ {agendamento.final_price:.2f}".replace(".", ","),
                booking_link=booking_link,
                notificar_salao=False,  # staff criou, não precisa avisar o salão
            )
    except Exception:
        pass

    return AgendamentoOut.model_validate(agendamento)


async def obter_agendamento(
    salon_id: uuid.UUID, agendamento_id: uuid.UUID, db: AsyncSession
) -> AgendamentoOut:
    agendamento = await db.scalar(
        select(Appointment).where(
            Appointment.id == agendamento_id, Appointment.salon_id == salon_id
        )
    )
    if not agendamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado"
        )
    return AgendamentoOut.model_validate(agendamento)


async def atualizar_agendamento(
    salon_id: uuid.UUID,
    agendamento_id: uuid.UUID,
    dados: AgendamentoUpdate,
    db: AsyncSession,
) -> AgendamentoOut:
    agendamento = await db.scalar(
        select(Appointment).where(
            Appointment.id == agendamento_id, Appointment.salon_id == salon_id
        )
    )
    if not agendamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado"
        )
    if agendamento.status in ("cancelled", "completed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não é possível alterar agendamento finalizado ou cancelado",
        )

    nova_data = dados.scheduled_date or agendamento.scheduled_date
    novo_inicio = dados.start_time or agendamento.start_time
    novo_service_id = dados.service_id or agendamento.service_id
    novo_professional_id = dados.professional_id or agendamento.professional_id

    servico = await db.scalar(
        select(Service).where(Service.id == novo_service_id, Service.salon_id == salon_id)
    )
    if not servico:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")
    end_time = _calcular_fim(novo_inicio, servico.duration_minutes)

    await _verificar_conflito(db, novo_professional_id, nova_data, novo_inicio, end_time, agendamento_id)

    if dados.scheduled_date:
        agendamento.scheduled_date = dados.scheduled_date
    if dados.start_time:
        agendamento.start_time = dados.start_time
        agendamento.end_time = end_time
    if dados.professional_id:
        agendamento.professional_id = dados.professional_id
    if dados.service_id:
        agendamento.service_id = dados.service_id
        agendamento.price = servico.price
    if dados.discount is not None:
        agendamento.discount = dados.discount
    if dados.notes is not None:
        agendamento.notes = dados.notes

    agendamento.final_price = max(Decimal("0"), agendamento.price - agendamento.discount)
    return AgendamentoOut.model_validate(agendamento)


async def atualizar_status(
    salon_id: uuid.UUID,
    agendamento_id: uuid.UUID,
    dados: AgendamentoStatusUpdate,
    db: AsyncSession,
) -> AgendamentoOut:
    agendamento = await db.scalar(
        select(Appointment).where(
            Appointment.id == agendamento_id, Appointment.salon_id == salon_id
        )
    )
    if not agendamento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Agendamento não encontrado"
        )

    agendamento.status = dados.status

    if dados.status == "cancelled":
        agendamento.cancelled_at = datetime.now(timezone.utc)
        agendamento.cancellation_reason = dados.cancellation_reason

        # Cancela lembretes WhatsApp pendentes para não avisar de agendamento cancelado
        from app.modulos.agendamentos.model import AppointmentReminder
        lembretes_pendentes = await db.execute(
            select(AppointmentReminder).where(
                AppointmentReminder.appointment_id == agendamento.id,
                AppointmentReminder.status == "pending",
            )
        )
        for lembrete in lembretes_pendentes.scalars().all():
            lembrete.status = "cancelled"

    if dados.status == "completed":
        agendamento.payment_status = "paid"
        if dados.payment_method:
            agendamento.payment_method = dados.payment_method
        # Atualiza métricas do cliente
        cliente = await db.scalar(select(Client).where(Client.id == agendamento.client_id))
        if cliente:
            cliente.visit_count += 1
            cliente.total_spent += agendamento.final_price
            cliente.last_visit_date = agendamento.scheduled_date

    return AgendamentoOut.model_validate(agendamento)


async def listar_horarios_disponiveis(
    salon_id: uuid.UUID,
    professional_id: uuid.UUID,
    service_id: uuid.UUID,
    data: date,
    db: AsyncSession,
) -> list[str]:
    from app.modulos.profissionais.model import Professional
    from app.modulos.salao.model import Salon

    salao = await db.scalar(select(Salon).where(Salon.id == salon_id))
    if not salao:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salão não encontrado")

    servico = await db.scalar(
        select(Service).where(Service.id == service_id, Service.salon_id == salon_id)
    )
    if not servico:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")

    # Determinar horários de trabalho para o dia solicitado
    # Convenção BR: 0=Dom, 1=Seg, ..., 6=Sab
    dia_semana = str((data.weekday() + 1) % 7)

    profissional = await db.scalar(
        select(Professional).where(Professional.id == professional_id)
    )

    if profissional and profissional.working_hours:
        if dia_semana not in profissional.working_hours:
            return []  # profissional não trabalha neste dia
        horas = profissional.working_hours[dia_semana]
        abertura = time.fromisoformat(horas["start"])
        fechamento = time.fromisoformat(horas["end"])
    else:
        # sem configuração específica: usa horário do salão
        abertura = salao.opening_time
        fechamento = salao.closing_time

    agendamentos = await db.execute(
        select(Appointment).where(
            Appointment.professional_id == professional_id,
            Appointment.scheduled_date == data,
            Appointment.status.notin_(["cancelled", "no_show"]),
        )
    )
    ocupados = [(a.start_time, a.end_time) for a in agendamentos.scalars().all()]

    slots = []
    slot = datetime.combine(data, abertura)
    fim_dia = datetime.combine(data, fechamento)
    duracao = timedelta(minutes=servico.duration_minutes)
    slot_step = timedelta(minutes=salao.slot_duration_minutes)

    while slot + duracao <= fim_dia:
        slot_start = slot.time()
        slot_end = (slot + duracao).time()
        conflito = any(s < slot_end and e > slot_start for s, e in ocupados)
        if not conflito:
            slots.append(slot_start.strftime("%H:%M"))
        slot += slot_step

    return slots
