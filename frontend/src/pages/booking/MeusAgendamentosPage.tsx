import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CalendarDays, Clock, Plus, X, RefreshCw, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  cancelarAgendamento,
  getDisponibilidade,
  getMeusAgendamentos,
  reagendarAgendamento,
} from "@/api/booking"
import type { AgendamentoCliente, StatusAgendamento } from "@/types"
import { useToast } from "@/components/ui/use-toast"

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const MESES_LONGO = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

const STATUS_LABEL: Record<StatusAgendamento, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
}

const STATUS_STYLE: Record<StatusAgendamento, string> = {
  scheduled: "bg-blue-500/15 text-blue-500 border-blue-500/20",
  confirmed: "bg-primary/15 text-primary border-primary/20",
  in_progress: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20",
  completed: "bg-green-500/15 text-green-500 border-green-500/20",
  cancelled: "bg-destructive/15 text-destructive border-destructive/20",
  no_show: "bg-muted text-muted-foreground border-border",
}

const FILTROS: [StatusAgendamento | "", string][] = [
  ["", "Todos"],
  ["scheduled", "Agendados"],
  ["completed", "Concluídos"],
  ["cancelled", "Cancelados"],
]

function pode_operar(a: AgendamentoCliente): boolean {
  if (!["scheduled", "confirmed"].includes(a.status)) return false
  const dt = new Date(`${a.scheduled_date}T${a.start_time}`)
  return dt.getTime() - Date.now() > 24 * 60 * 60 * 1000
}

function formatarData(d: string) {
  const dt = new Date(d + "T00:00:00")
  return `${DIAS[dt.getDay()]}, ${dt.getDate()} ${MESES[dt.getMonth()]}`
}

// ---------------------------------------------------------------------------
// Modal de confirmação de cancelamento
// ---------------------------------------------------------------------------

function ModalCancelar({
  agendamento,
  onConfirm,
  onClose,
  loading,
}: {
  agendamento: AgendamentoCliente
  onConfirm: () => void
  onClose: () => void
  loading: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-modal animate-in fade-in slide-in-from-bottom-4">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
          <X className="h-5 w-5 text-destructive" />
        </div>
        <h3 className="mb-1 text-base font-semibold">Cancelar agendamento?</h3>
        <p className="mb-1 text-sm text-muted-foreground">
          {agendamento.service_name} · {formatarData(agendamento.scheduled_date)} às{" "}
          {agendamento.start_time.slice(0, 5)}
        </p>
        <p className="mb-5 text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            Voltar
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancelar"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal de reagendamento
// ---------------------------------------------------------------------------

function ModalReagendar({
  agendamento,
  slug,
  onConfirm,
  onClose,
  loading,
}: {
  agendamento: AgendamentoCliente
  slug: string
  onConfirm: (data: string, horario: string) => void
  onClose: () => void
  loading: boolean
}) {
  const hoje = new Date()
  const [offsetSemana, setOffsetSemana] = useState(0)
  const [dataSel, setDataSel] = useState<string | null>(null)
  const [horarioSel, setHorarioSel] = useState<string | null>(null)

  // Gera os 7 dias da semana atual com offset
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje)
    d.setDate(hoje.getDate() + offsetSemana * 7 + i + 1) // começa amanhã
    return d
  })

  const dataFmt = dataSel
    ? (() => {
        const d = new Date(dataSel + "T00:00:00")
        return `${d.getDate()} de ${MESES_LONGO[d.getMonth()]}`
      })()
    : null

  const { data: slots, isFetching: buscandoSlots } = useQuery({
    queryKey: ["disponibilidade-reagendar", slug, agendamento.professional_id, agendamento.service_id, dataSel],
    queryFn: () =>
      getDisponibilidade(slug, agendamento.professional_id, agendamento.service_id, dataSel!),
    enabled: !!dataSel,
  })

  function toISO(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  }

  function handleData(d: Date) {
    const iso = toISO(d)
    if (iso === dataSel) return
    setDataSel(iso)
    setHorarioSel(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-modal animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Reagendar</p>
            <p className="text-xs text-muted-foreground">{agendamento.service_name}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-accent transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Navegação de semana */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setOffsetSemana((o) => Math.max(0, o - 1)); setDataSel(null); setHorarioSel(null) }}
              disabled={offsetSemana === 0}
              className="rounded-md p-1 hover:bg-accent disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              {MESES[diasSemana[0].getMonth()]} {diasSemana[0].getFullYear()}
            </span>
            <button
              onClick={() => { setOffsetSemana((o) => Math.min(3, o + 1)); setDataSel(null); setHorarioSel(null) }}
              disabled={offsetSemana >= 3}
              className="rounded-md p-1 hover:bg-accent disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Grid de dias */}
          <div className="grid grid-cols-7 gap-1">
            {diasSemana.map((d) => {
              const iso = toISO(d)
              const sel = dataSel === iso
              return (
                <button
                  key={iso}
                  onClick={() => handleData(d)}
                  className={`flex flex-col items-center rounded-lg py-2 text-xs transition-colors ${
                    sel
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent text-foreground"
                  }`}
                >
                  <span className="text-[10px] text-muted-foreground mb-0.5">
                    {DIAS[d.getDay()]}
                  </span>
                  <span className="font-semibold">{d.getDate()}</span>
                </button>
              )
            })}
          </div>

          {/* Horários */}
          {dataSel && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Horários disponíveis — {dataFmt}
              </p>
              {buscandoSlots ? (
                <div className="grid grid-cols-4 gap-1.5">
                  {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-8 rounded-md" />)}
                </div>
              ) : slots && slots.length > 0 ? (
                <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto">
                  {slots.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHorarioSel(h)}
                      className={`rounded-md py-1.5 text-xs font-medium transition-colors ${
                        horarioSel === h
                          ? "bg-primary text-primary-foreground"
                          : "border border-border hover:border-primary/50 hover:bg-accent"
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3">
                  Nenhum horário disponível nesta data.
                </p>
              )}
            </div>
          )}

          {/* Confirmar */}
          <Button
            className="w-full"
            disabled={!dataSel || !horarioSel || loading}
            onClick={() => onConfirm(dataSel!, horarioSel!)}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Confirmar — ${horarioSel ?? "..."} de ${dataFmt ?? "..."}`
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Página principal
// ---------------------------------------------------------------------------

export default function MeusAgendamentosPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [filtro, setFiltro] = useState<StatusAgendamento | "">("")
  const [cancelando, setCancelando] = useState<AgendamentoCliente | null>(null)
  const [reagendando, setReagendando] = useState<AgendamentoCliente | null>(null)

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ["meus-agendamentos", slug, filtro],
    queryFn: () => getMeusAgendamentos(slug!, filtro || undefined),
  })

  const mutCancelar = useMutation({
    mutationFn: () => cancelarAgendamento(slug!, cancelando!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meus-agendamentos"] })
      setCancelando(null)
      toast({ title: "Agendamento cancelado" })
    },
    onError: (err: any) => {
      toast({
        title: "Não foi possível cancelar",
        description: err?.response?.data?.detail ?? "Tente novamente.",
        variant: "destructive",
      })
    },
  })

  const mutReagendar = useMutation({
    mutationFn: ({ data, horario }: { data: string; horario: string }) =>
      reagendarAgendamento(slug!, reagendando!.id, {
        scheduled_date: data,
        start_time: horario + ":00",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meus-agendamentos"] })
      setReagendando(null)
      toast({ title: "Agendamento reagendado com sucesso!" })
    },
    onError: (err: any) => {
      toast({
        title: "Não foi possível reagendar",
        description: err?.response?.data?.detail ?? "Tente novamente.",
        variant: "destructive",
      })
    },
  })

  return (
    <div className="space-y-5 fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Meus agendamentos</h2>
        <Button size="sm" onClick={() => navigate(`/booking/${slug}/agendar`)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Novo
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTROS.map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFiltro(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-colors ${
              filtro === val
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : agendamentos && agendamentos.length > 0 ? (
        <div className="space-y-3">
          {agendamentos.map((a) => {
            const podeOperar = pode_operar(a)
            return (
              <Card key={a.id}>
                <CardContent className="py-4 px-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      {/* Serviço e profissional */}
                      <p className="text-sm font-semibold truncate">{a.service_name || "Serviço"}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        com {a.professional_name || "Profissional"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {formatarData(a.scheduled_date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {a.start_time.slice(0, 5)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        R$ {Number(a.final_price).toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${
                        STATUS_STYLE[a.status as StatusAgendamento] ?? ""
                      }`}
                    >
                      {STATUS_LABEL[a.status as StatusAgendamento] ?? a.status}
                    </span>
                  </div>

                  {/* Motivo de cancelamento */}
                  {a.cancellation_reason && (
                    <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                      Motivo: {a.cancellation_reason}
                    </p>
                  )}

                  {/* Aviso de prazo esgotado */}
                  {["scheduled", "confirmed"].includes(a.status) && !podeOperar && (
                    <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                      Cancelamento e reagendamento encerrado (menos de 24h)
                    </p>
                  )}

                  {/* Ações */}
                  {podeOperar && (
                    <div className="flex gap-2 pt-1 border-t border-border">
                      <button
                        onClick={() => setReagendando(a)}
                        className="tap-scale flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border py-1.5 text-xs font-medium text-foreground hover:bg-accent transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reagendar
                      </button>
                      <button
                        onClick={() => setCancelando(a)}
                        className="tap-scale flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Cancelar
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium">Nenhum agendamento encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filtro ? "Tente outro filtro." : "Que tal marcar um horário agora?"}
          </p>
          {!filtro && (
            <Button size="sm" className="mt-4" onClick={() => navigate(`/booking/${slug}/agendar`)}>
              Agendar serviço
            </Button>
          )}
        </div>
      )}

      {/* Modais */}
      {cancelando && (
        <ModalCancelar
          agendamento={cancelando}
          onConfirm={() => mutCancelar.mutate()}
          onClose={() => setCancelando(null)}
          loading={mutCancelar.isPending}
        />
      )}

      {reagendando && (
        <ModalReagendar
          agendamento={reagendando}
          slug={slug!}
          onConfirm={(data, horario) => mutReagendar.mutate({ data, horario })}
          onClose={() => setReagendando(null)}
          loading={mutReagendar.isPending}
        />
      )}
    </div>
  )
}
