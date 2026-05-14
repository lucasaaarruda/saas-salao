import axios, { type InternalAxiosRequestConfig } from "axios"
import { useClienteAuthStore } from "@/store/clienteAuthStore"
import type {
  SalaoPublico,
  ServicoPublico,
  ProfissionalPublico,
  AgendamentoCliente,
  ClienteTokenOutput,
  NovoAccessTokenClienteOutput,
  StatusAgendamento,
} from "@/types"

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1"

const bookingApi = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
})

bookingApi.interceptors.request.use((config) => {
  const token = useClienteAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

bookingApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableConfig
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const { refreshToken, slug } = useClienteAuthStore.getState()
      if (refreshToken && slug) {
        try {
          const { data } = await axios.post<NovoAccessTokenClienteOutput>(
            `${BASE}/booking/${slug}/auth/refresh`,
            { refresh_token: refreshToken }
          )
          useClienteAuthStore.getState().setAccessToken(data.access_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return bookingApi(original)
        } catch {
          useClienteAuthStore.getState().logout()
        }
      } else {
        useClienteAuthStore.getState().logout()
      }
    }
    return Promise.reject(error)
  }
)

// Public
export async function getInfoSalao(slug: string): Promise<SalaoPublico> {
  const { data } = await bookingApi.get<SalaoPublico>(`/booking/${slug}/`)
  return data
}

// Auth
export async function registrarCliente(
  slug: string,
  dados: { name: string; email: string; password: string; phone: string; cpf: string; birth_date?: string }
): Promise<ClienteTokenOutput> {
  const { data } = await bookingApi.post<ClienteTokenOutput>(`/booking/${slug}/auth/register`, dados)
  return data
}

export async function loginCliente(
  slug: string,
  dados: { email: string; password: string }
): Promise<ClienteTokenOutput> {
  const { data } = await bookingApi.post<ClienteTokenOutput>(`/booking/${slug}/auth/login`, dados)
  return data
}

export async function logoutClienteApi(slug: string): Promise<void> {
  await bookingApi.post(`/booking/${slug}/auth/logout`)
}

// Booking
export async function listarServicos(slug: string): Promise<ServicoPublico[]> {
  const { data } = await bookingApi.get<ServicoPublico[]>(`/booking/${slug}/servicos`)
  return data
}

export async function listarProfissionais(slug: string): Promise<ProfissionalPublico[]> {
  const { data } = await bookingApi.get<ProfissionalPublico[]>(`/booking/${slug}/profissionais`)
  return data
}

export async function getDisponibilidade(
  slug: string,
  professional_id: string,
  service_id: string,
  data: string
): Promise<string[]> {
  const { data: slots } = await bookingApi.get<string[]>(`/booking/${slug}/disponibilidade`, {
    params: { professional_id, service_id, data },
  })
  return slots
}

export async function agendar(
  slug: string,
  dados: {
    professional_id: string
    service_id: string
    scheduled_date: string
    start_time: string
    notes?: string
  }
): Promise<AgendamentoCliente> {
  const { data } = await bookingApi.post<AgendamentoCliente>(`/booking/${slug}/agendar`, dados)
  return data
}

export async function getMeusAgendamentos(
  slug: string,
  status?: StatusAgendamento
): Promise<AgendamentoCliente[]> {
  const { data } = await bookingApi.get<AgendamentoCliente[]>(`/booking/${slug}/meus-agendamentos`, {
    params: status ? { status } : {},
  })
  return data
}
