from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.banco import get_db
from app.core.dependencias import owner_ou_manager
from app.modulos.relatorios import service
from app.modulos.relatorios.schemas import (
    RelatorioAgendamentosOut,
    RelatorioClienteOut,
    RelatorioProfissionalOut,
    RelatorioServicoOut,
)

router = APIRouter(tags=["relatórios"])


@router.get(
    "/appointments",
    response_model=RelatorioAgendamentosOut,
    summary="Relatório de agendamentos",
)
async def agendamentos(
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> RelatorioAgendamentosOut:
    return await service.relatorio_agendamentos(usuario.salon_id, db, data_inicio, data_fim)


@router.get(
    "/professionals",
    response_model=list[RelatorioProfissionalOut],
    summary="Relatório por profissional",
)
async def profissionais(
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> list[RelatorioProfissionalOut]:
    return await service.relatorio_profissionais(usuario.salon_id, db, data_inicio, data_fim)


@router.get(
    "/services",
    response_model=list[RelatorioServicoOut],
    summary="Relatório por serviço",
)
async def servicos(
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> list[RelatorioServicoOut]:
    return await service.relatorio_servicos(usuario.salon_id, db, data_inicio, data_fim)


@router.get(
    "/clients",
    response_model=RelatorioClienteOut,
    summary="Relatório de clientes",
)
async def clientes(
    data_inicio: date = Query(...),
    data_fim: date = Query(...),
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> RelatorioClienteOut:
    return await service.relatorio_clientes(usuario.salon_id, db, data_inicio, data_fim)
