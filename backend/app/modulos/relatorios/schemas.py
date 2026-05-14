from decimal import Decimal

from pydantic import BaseModel


class RelatorioAgendamentosOut(BaseModel):
    total: int
    concluidos: int
    cancelados: int
    no_show: int
    taxa_conclusao: float
    receita_total: Decimal


class RelatorioProfissionalOut(BaseModel):
    professional_id: str
    name: str
    total_agendamentos: int
    agendamentos_concluidos: int
    receita_gerada: Decimal
    comissao_estimada: Decimal


class RelatorioServicoOut(BaseModel):
    service_id: str
    name: str
    total_agendamentos: int
    receita_gerada: Decimal


class RelatorioClienteOut(BaseModel):
    total_clientes: int
    novos_no_periodo: int
    clientes_recorrentes: int
    ticket_medio: Decimal


class RelatorioOcupacaoOut(BaseModel):
    professional_id: str
    name: str
    slots_disponiveis: int
    slots_ocupados: int
    taxa_ocupacao: float
