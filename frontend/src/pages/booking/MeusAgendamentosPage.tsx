import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, Clock, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getMeusAgendamentos } from "@/api/booking"
import type { StatusAgendamento } from "@/types"

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MESES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

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

export default function MeusAgendamentosPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<StatusAgendamento | "">("")

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ["meus-agendamentos", slug, filtro],
    queryFn: () => getMeusAgendamentos(slug!, filtro || undefined),
  })

  function formatarData(d: string) {
    const dt = new Date(d + "T00:00:00")
    return `${DIAS[dt.getDay()]}, ${dt.getDate()} ${MESES[dt.getMonth()]}`
  }

  return (
    <div className="space-y-5 fade-in-up">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Meus agendamentos</h2>
        <Button
          size="sm"
          onClick={() => navigate(`/booking/${slug}/agendar`)}
          className="gap-1.5"
        >
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
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : agendamentos && agendamentos.length > 0 ? (
        <div className="space-y-3">
          {agendamentos.map((a) => (
            <Card key={a.id}>
              <CardContent className="py-4 px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="font-medium">{formatarData(a.scheduled_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)}
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
                {a.cancellation_reason && (
                  <p className="text-xs text-muted-foreground mt-2.5 pt-2.5 border-t border-border">
                    Motivo: {a.cancellation_reason}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center py-16 text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground mb-3" />
          <p className="font-medium">Nenhum agendamento encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filtro ? "Tente outro filtro." : "Que tal marcar um horário agora?"}
          </p>
          {!filtro && (
            <Button
              size="sm"
              className="mt-4"
              onClick={() => navigate(`/booking/${slug}/agendar`)}
            >
              Agendar serviço
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
