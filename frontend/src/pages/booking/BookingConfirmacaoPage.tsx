import { useLocation, useNavigate, useParams } from "react-router-dom"
import { CalendarDays, CheckCircle2, Home, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AgendamentoCliente } from "@/types"

const DIAS_SEMANA = [
  "domingo", "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira", "sábado",
]
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

export default function BookingConfirmacaoPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { state } = useLocation()
  const agendamento = (state as { agendamento?: AgendamentoCliente } | null)?.agendamento

  function formatarData(d: string) {
    const dt = new Date(d + "T00:00:00")
    return `${DIAS_SEMANA[dt.getDay()]}, ${dt.getDate()} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
  }

  return (
    <div className="flex flex-col items-center text-center space-y-6 py-8 fade-in-up">
      <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-500" />
      </div>

      <div>
        <h2 className="text-2xl font-bold">Agendamento confirmado!</h2>
        <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto">
          Seu agendamento foi realizado com sucesso. Até logo!
        </p>
      </div>

      {agendamento && (
        <div className="w-full max-w-xs rounded-lg border border-border bg-card p-4 text-left space-y-2">
          <div>
            <p className="text-xs text-muted-foreground">Data e horário</p>
            <p className="font-medium text-sm capitalize">
              {formatarData(agendamento.scheduled_date)} às {agendamento.start_time.slice(0, 5)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="font-semibold text-sm">
              R$ {Number(agendamento.final_price).toFixed(2).replace(".", ",")}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5 w-full max-w-xs">
        <Button
          onClick={() => navigate(`/booking/${slug}/meus-agendamentos`)}
          className="gap-2"
        >
          <CalendarDays className="h-4 w-4" />
          Ver meus agendamentos
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate(`/booking/${slug}/agendar`)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Fazer outro agendamento
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate(`/booking/${slug}`)}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          Página inicial
        </Button>
      </div>
    </div>
  )
}
