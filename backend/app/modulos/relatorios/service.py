import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modulos.agendamentos.model import Appointment
from app.modulos.clientes.model import Client
from app.modulos.profissionais.model import Professional
from app.modulos.relatorios.schemas import (
    RelatorioAgendamentosOut,
    RelatorioClienteOut,
    RelatorioProfissionalOut,
    RelatorioServicoOut,
)
from app.modulos.servicos.model import Service


async def relatorio_agendamentos(
    salon_id: uuid.UUID,
    db: AsyncSession,
    data_inicio: date,
    data_fim: date,
) -> RelatorioAgendamentosOut:
    base = select(Appointment).where(
        Appointment.salon_id == salon_id,
        Appointment.scheduled_date >= data_inicio,
        Appointment.scheduled_date <= data_fim,
    )

    total = await db.scalar(select(func.count()).select_from(base.subquery())) or 0
    concluidos = await db.scalar(
        select(func.count()).select_from(
            base.where(Appointment.status == "completed").subquery()
        )
    ) or 0
    cancelados = await db.scalar(
        select(func.count()).select_from(
            base.where(Appointment.status == "cancelled").subquery()
        )
    ) or 0
    no_show = await db.scalar(
        select(func.count()).select_from(
            base.where(Appointment.status == "no_show").subquery()
        )
    ) or 0
    receita = await db.scalar(
        select(func.coalesce(func.sum(Appointment.final_price), 0)).where(
            Appointment.salon_id == salon_id,
            Appointment.scheduled_date >= data_inicio,
            Appointment.scheduled_date <= data_fim,
            Appointment.status == "completed",
        )
    ) or Decimal("0")

    taxa = round((concluidos / total * 100), 2) if total > 0 else 0.0

    return RelatorioAgendamentosOut(
        total=total,
        concluidos=concluidos,
        cancelados=cancelados,
        no_show=no_show,
        taxa_conclusao=taxa,
        receita_total=Decimal(str(receita)),
    )


async def relatorio_profissionais(
    salon_id: uuid.UUID,
    db: AsyncSession,
    data_inicio: date,
    data_fim: date,
) -> list[RelatorioProfissionalOut]:
    profissionais = await db.execute(
        select(Professional).where(
            Professional.salon_id == salon_id, Professional.is_active.is_(True)
        )
    )
    resultado = []
    for prof in profissionais.scalars().all():
        agendamentos = await db.execute(
            select(Appointment).where(
                Appointment.professional_id == prof.id,
                Appointment.salon_id == salon_id,
                Appointment.scheduled_date >= data_inicio,
                Appointment.scheduled_date <= data_fim,
            )
        )
        todos = agendamentos.scalars().all()
        concluidos = [a for a in todos if a.status == "completed"]
        receita = sum(a.final_price for a in concluidos)
        comissao = receita * Decimal(str(prof.commission_percentage / 100))

        resultado.append(
            RelatorioProfissionalOut(
                professional_id=str(prof.id),
                name=prof.name,
                total_agendamentos=len(todos),
                agendamentos_concluidos=len(concluidos),
                receita_gerada=Decimal(str(receita)),
                comissao_estimada=round(comissao, 2),
            )
        )
    return resultado


async def relatorio_servicos(
    salon_id: uuid.UUID,
    db: AsyncSession,
    data_inicio: date,
    data_fim: date,
) -> list[RelatorioServicoOut]:
    servicos = await db.execute(
        select(Service).where(Service.salon_id == salon_id, Service.is_active.is_(True))
    )
    resultado = []
    for serv in servicos.scalars().all():
        agendamentos = await db.execute(
            select(Appointment).where(
                Appointment.service_id == serv.id,
                Appointment.salon_id == salon_id,
                Appointment.scheduled_date >= data_inicio,
                Appointment.scheduled_date <= data_fim,
                Appointment.status == "completed",
            )
        )
        todos = agendamentos.scalars().all()
        receita = sum(a.final_price for a in todos)
        resultado.append(
            RelatorioServicoOut(
                service_id=str(serv.id),
                name=serv.name,
                total_agendamentos=len(todos),
                receita_gerada=Decimal(str(receita)),
            )
        )
    return sorted(resultado, key=lambda x: x.total_agendamentos, reverse=True)


async def relatorio_clientes(
    salon_id: uuid.UUID,
    db: AsyncSession,
    data_inicio: date,
    data_fim: date,
) -> RelatorioClienteOut:
    total_clientes = await db.scalar(
        select(func.count(Client.id)).where(
            Client.salon_id == salon_id, Client.is_active.is_(True)
        )
    ) or 0

    novos = await db.scalar(
        select(func.count(Client.id)).where(
            Client.salon_id == salon_id,
            func.date(Client.created_at) >= data_inicio,
            func.date(Client.created_at) <= data_fim,
        )
    ) or 0

    recorrentes = await db.scalar(
        select(func.count(Client.id)).where(
            Client.salon_id == salon_id, Client.visit_count > 1
        )
    ) or 0

    ticket_result = await db.scalar(
        select(func.coalesce(func.avg(Appointment.final_price), 0)).where(
            Appointment.salon_id == salon_id,
            Appointment.scheduled_date >= data_inicio,
            Appointment.scheduled_date <= data_fim,
            Appointment.status == "completed",
        )
    ) or Decimal("0")

    return RelatorioClienteOut(
        total_clientes=total_clientes,
        novos_no_periodo=novos,
        clientes_recorrentes=recorrentes,
        ticket_medio=round(Decimal(str(ticket_result)), 2),
    )
