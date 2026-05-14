// Auth
export interface TokenOutput {
  access_token: string
  refresh_token: string
  token_type: string
  usuario: Usuario
}

export interface Usuario {
  id: string
  name: string
  email: string
  role: string
  salon_id: string
  is_active: boolean
  avatar_url?: string
  created_at: string
  last_login_at?: string
}

// Salão
export interface Salao {
  id: string
  name: string
  slug: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  logo_url?: string
  plan: string
  is_active: boolean
  opening_time: string
  closing_time: string
  working_days: number[]
  slot_duration_minutes: number
  allow_online_booking: boolean
  created_at: string
  updated_at: string
}

// Profissional
export interface HorarioDia {
  start: string // "HH:MM"
  end: string   // "HH:MM"
}

export interface Profissional {
  id: string
  salon_id: string
  user_id?: string
  name: string
  phone: string
  specialty: string
  commission_percentage: number
  color: string
  is_active: boolean
  working_hours: Record<string, HorarioDia>
  created_at: string
}

// Serviço
export interface Servico {
  id: string
  salon_id: string
  name: string
  description?: string
  category: string
  duration_minutes: number
  price: string
  commission_type: string
  commission_value: string
  color: string
  is_active: boolean
  created_at: string
}

// Cliente
export interface Cliente {
  id: string
  salon_id: string
  name: string
  phone: string
  email?: string
  birth_date?: string
  cpf?: string
  notes?: string
  how_met?: string
  total_spent: string
  visit_count: number
  last_visit_date?: string
  is_active: boolean
  created_at: string
}

// Agendamento
export type StatusAgendamento =
  | "scheduled"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"

export type StatusPagamento = "pending" | "paid" | "refunded"

export type MetodoPagamento = "pix" | "credit_card" | "debit_card" | "cash" | "bank_transfer"

export interface Agendamento {
  id: string
  salon_id: string
  client_id: string
  professional_id: string
  service_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  status: StatusAgendamento
  price: string
  discount: string
  final_price: string
  payment_status: StatusPagamento
  payment_method?: MetodoPagamento
  notes?: string
  created_by_id: string
  created_at: string
  updated_at: string
  cancelled_at?: string
  cancellation_reason?: string
}

// Financeiro
export interface Transacao {
  id: string
  salon_id: string
  appointment_id?: string
  professional_id?: string
  type: "income" | "expense"
  category: string
  description: string
  amount: string
  payment_method: string
  transaction_date: string
  notes?: string
  created_by_id: string
  created_at: string
}

export interface ResumoFinanceiro {
  total_receitas: string
  total_despesas: string
  saldo: string
  total_agendamentos_pagos: number
}

// Relatórios
export interface RelatorioAgendamentos {
  total: number
  concluidos: number
  cancelados: number
  no_show: number
  taxa_conclusao: number
  receita_total: string
}

export interface RelatorioProfissional {
  professional_id: string
  name: string
  total_agendamentos: number
  agendamentos_concluidos: number
  receita_gerada: string
  comissao_estimada: string
}

export interface RelatorioServico {
  service_id: string
  name: string
  total_agendamentos: number
  receita_gerada: string
}

export interface RelatorioCliente {
  total_clientes: number
  novos_no_periodo: number
  clientes_recorrentes: number
  ticket_medio: string
}

// Paginação e filtros
export interface FiltroAgendamento {
  data_inicio?: string
  data_fim?: string
  professional_id?: string
  client_id?: string
  status?: StatusAgendamento
}

// Erro de API
export interface ApiError {
  detail: string | { msg: string; loc: string[] }[]
}

// Booking público
export interface SalaoPublico {
  name: string
  slug: string
  city: string
  state: string
  phone: string
  opening_time: string
  closing_time: string
  working_days: number[]
  allow_online_booking: boolean
}

export interface ServicoPublico {
  id: string
  name: string
  description?: string
  category: string
  duration_minutes: number
  price: string
  color: string
}

export interface ProfissionalPublico {
  id: string
  name: string
  specialty: string
  color: string
}

export interface AgendamentoCliente {
  id: string
  service_id: string
  professional_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  status: StatusAgendamento
  final_price: string
  notes?: string
  created_at: string
  cancelled_at?: string
  cancellation_reason?: string
}

export interface ClientePublico {
  id: string
  name: string
  email: string | null
  phone: string
  cpf: string | null
  birth_date: string | null
  created_at: string
}

export interface ClienteTokenOutput {
  access_token: string
  refresh_token: string
  token_type: string
  cliente: ClientePublico
}

export interface NovoAccessTokenClienteOutput {
  access_token: string
  token_type: string
}
