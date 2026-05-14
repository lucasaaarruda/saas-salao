import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.banco import get_db
from app.core.dependencias import apenas_owner, owner_ou_manager
from app.modulos.financeiro import service
from app.modulos.financeiro.schemas import ResumoFinanceiroOut, TransacaoCreate, TransacaoOut

router = APIRouter(tags=["financeiro"])


@router.get("", response_model=list[TransacaoOut], summary="Listar transações")
async def listar(
    data_inicio: date | None = Query(None),
    data_fim: date | None = Query(None),
    tipo: str | None = Query(None),
    professional_id: uuid.UUID | None = Query(None),
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> list[TransacaoOut]:
    return await service.listar_transacoes(
        usuario.salon_id, db, data_inicio, data_fim, tipo, professional_id
    )


@router.post(
    "",
    response_model=TransacaoOut,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar transação",
)
async def criar(
    dados: TransacaoCreate,
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> TransacaoOut:
    return await service.criar_transacao(usuario.salon_id, dados, usuario.id, db)


@router.get("/resumo", response_model=ResumoFinanceiroOut, summary="Resumo financeiro")
async def resumo(
    data_inicio: date | None = Query(None),
    data_fim: date | None = Query(None),
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> ResumoFinanceiroOut:
    return await service.resumo_financeiro(usuario.salon_id, db, data_inicio, data_fim)


@router.get("/{transacao_id}", response_model=TransacaoOut, summary="Obter transação")
async def obter(
    transacao_id: uuid.UUID,
    usuario=Depends(owner_ou_manager()),
    db: AsyncSession = Depends(get_db),
) -> TransacaoOut:
    return await service.obter_transacao(usuario.salon_id, transacao_id, db)


@router.delete(
    "/{transacao_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover transação",
)
async def remover(
    transacao_id: uuid.UUID,
    usuario=Depends(apenas_owner()),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.remover_transacao(usuario.salon_id, transacao_id, db)
