import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.banco import get_db
from app.core.dependencias import owner_manager_ou_recepcionista, qualquer_autenticado
from app.modulos.agendamentos import service
from app.modulos.agendamentos.schemas import (
    AgendamentoCreate,
    AgendamentoOut,
    AgendamentoStatusUpdate,
    AgendamentoUpdate,
)

router = APIRouter(tags=["agendamentos"])


@router.get("", response_model=list[AgendamentoOut], summary="Listar agendamentos")
async def listar(
    data_inicio: date | None = Query(None),
    data_fim: date | None = Query(None),
    professional_id: uuid.UUID | None = Query(None),
    client_id: uuid.UUID | None = Query(None),
    status_filtro: str | None = Query(None, alias="status"),
    usuario=Depends(qualquer_autenticado()),
    db: AsyncSession = Depends(get_db),
) -> list[AgendamentoOut]:
    return await service.listar_agendamentos(
        usuario.salon_id, db, data_inicio, data_fim, professional_id, client_id, status_filtro
    )


@router.post(
    "",
    response_model=AgendamentoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Criar agendamento",
)
async def criar(
    dados: AgendamentoCreate,
    usuario=Depends(owner_manager_ou_recepcionista()),
    db: AsyncSession = Depends(get_db),
) -> AgendamentoOut:
    return await service.criar_agendamento(usuario.salon_id, dados, usuario.id, db)


@router.get(
    "/disponibilidade",
    response_model=list[str],
    summary="Horários disponíveis",
)
async def disponibilidade(
    professional_id: uuid.UUID = Query(...),
    service_id: uuid.UUID = Query(...),
    data: date = Query(...),
    usuario=Depends(qualquer_autenticado()),
    db: AsyncSession = Depends(get_db),
) -> list[str]:
    return await service.listar_horarios_disponiveis(
        usuario.salon_id, professional_id, service_id, data, db
    )


@router.get("/{agendamento_id}", response_model=AgendamentoOut, summary="Obter agendamento")
async def obter(
    agendamento_id: uuid.UUID,
    usuario=Depends(qualquer_autenticado()),
    db: AsyncSession = Depends(get_db),
) -> AgendamentoOut:
    return await service.obter_agendamento(usuario.salon_id, agendamento_id, db)


@router.patch("/{agendamento_id}", response_model=AgendamentoOut, summary="Atualizar agendamento")
async def atualizar(
    agendamento_id: uuid.UUID,
    dados: AgendamentoUpdate,
    usuario=Depends(owner_manager_ou_recepcionista()),
    db: AsyncSession = Depends(get_db),
) -> AgendamentoOut:
    return await service.atualizar_agendamento(usuario.salon_id, agendamento_id, dados, db)


@router.patch(
    "/{agendamento_id}/status",
    response_model=AgendamentoOut,
    summary="Atualizar status do agendamento",
)
async def atualizar_status(
    agendamento_id: uuid.UUID,
    dados: AgendamentoStatusUpdate,
    usuario=Depends(owner_manager_ou_recepcionista()),
    db: AsyncSession = Depends(get_db),
) -> AgendamentoOut:
    return await service.atualizar_status(usuario.salon_id, agendamento_id, dados, db)
