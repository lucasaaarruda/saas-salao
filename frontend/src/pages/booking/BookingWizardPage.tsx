import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation } from "@tanstack/react-query"
import { addDays, format, isToday, parseISO } from "date-fns"
import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { listarServicos, listarProfissionais, getDisponibilidade, agendar } from "@/api/booking"
import type { AgendamentoCliente, ProfissionalPublico, ServicoPublico } from "@/types"

const DIAS_SEMANA_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MESES_CURTO = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
const DIAS_SEMANA_LONGO = [
  "domingo", "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira", "sábado",
]
const MESES_LONGO = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i + 1 === current
              ? "w-6 bg-primary"
              : i + 1 < current
              ? "w-3 bg-primary/40"
              : "w-3 bg-muted"
          }`}
        />
      ))}
    </div>
  )
}

const STEP_TITLES = ["Serviço", "Profissional", "Data e Hora", "Confirmar"]

export default function BookingWizardPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [servico, setServico] = useState<ServicoPublico | null>(null)
  const [profissional, setProfissional] = useState<ProfissionalPublico | null>(null)
  const [data, setData] = useState<string | null>(null)
  const [horario, setHorario] = useState<string | null>(null)
  const [notas, setNotas] = useState("")

  function handleServicoSelect(s: ServicoPublico) {
    setServico(s)
    setStep(2)
  }

  function handleProfissionalSelect(p: ProfissionalPublico) {
    setProfissional(p)
    setStep(3)
  }

  function handleDataHoraSelect(d: string, h: string) {
    setData(d)
    setHorario(h)
    setStep(4)
  }

  function handleSuccess(agendamento: AgendamentoCliente) {
    navigate(`/booking/${slug}/confirmacao`, {
      state: { agendamento },
      replace: true,
    })
  }

  return (
    <div className="space-y-5 fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{STEP_TITLES[step - 1]}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Passo {step} de 4</p>
        </div>
        <StepIndicator current={step} total={4} />
      </div>

      {step === 1 && (
        <StepServico slug={slug!} selecionado={servico} onSelect={handleServicoSelect} />
      )}
      {step === 2 && servico && (
        <StepProfissional
          slug={slug!}
          selecionado={profissional}
          onSelect={handleProfissionalSelect}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && servico && profissional && (
        <StepDataHora
          slug={slug!}
          servicoId={servico.id}
          profissionalId={profissional.id}
          dataSelecionada={data}
          horarioSelecionado={horario}
          onSelect={handleDataHoraSelect}
          onBack={() => setStep(2)}
        />
      )}
      {step === 4 && servico && profissional && data && horario && (
        <StepConfirmar
          slug={slug!}
          servico={servico}
          profissional={profissional}
          data={data}
          horario={horario}
          notas={notas}
          onNotasChange={setNotas}
          onBack={() => setStep(3)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  )
}

// ─── Step 1: Serviço ────────────────────────────────────────────────────────

function StepServico({
  slug,
  selecionado,
  onSelect,
}: {
  slug: string
  selecionado: ServicoPublico | null
  onSelect: (s: ServicoPublico) => void
}) {
  const { data: servicos, isLoading } = useQuery({
    queryKey: ["booking-servicos", slug],
    queryFn: () => listarServicos(slug),
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {servicos?.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className={`w-full text-left p-4 rounded-lg border transition-all ${
            selecionado?.id === s.id
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{s.name}</p>
                {s.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{s.duration_minutes} min</p>
              </div>
            </div>
            <span className="font-semibold text-sm shrink-0">
              R$ {Number(s.price).toFixed(2).replace(".", ",")}
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

// ─── Step 2: Profissional ───────────────────────────────────────────────────

function StepProfissional({
  slug,
  selecionado,
  onSelect,
  onBack,
}: {
  slug: string
  selecionado: ProfissionalPublico | null
  onSelect: (p: ProfissionalPublico) => void
  onBack: () => void
}) {
  const { data: profissionais, isLoading } = useQuery({
    queryKey: ["booking-profissionais", slug],
    queryFn: () => listarProfissionais(slug),
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2.5">
        {profissionais?.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`w-full text-left p-4 rounded-lg border transition-all flex items-center gap-3 ${
              selecionado?.id === p.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
            }`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white font-semibold text-sm"
              style={{ backgroundColor: p.color }}
            >
              {p.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.specialty}</p>
            </div>
          </button>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-1">
        <ChevronLeft className="h-4 w-4" />
        Voltar
      </Button>
    </div>
  )
}

// ─── Step 3: Data e Hora ────────────────────────────────────────────────────

function StepDataHora({
  slug,
  servicoId,
  profissionalId,
  dataSelecionada,
  horarioSelecionado,
  onSelect,
  onBack,
}: {
  slug: string
  servicoId: string
  profissionalId: string
  dataSelecionada: string | null
  horarioSelecionado: string | null
  onSelect: (data: string, horario: string) => void
  onBack: () => void
}) {
  const [dataLocal, setDataLocal] = useState<string>(
    dataSelecionada ?? format(new Date(), "yyyy-MM-dd")
  )
  const [horarioLocal, setHorarioLocal] = useState<string | null>(horarioSelecionado)

  const diasDisponiveis = Array.from({ length: 14 }, (_, i) =>
    format(addDays(new Date(), i), "yyyy-MM-dd")
  )

  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ["booking-disponibilidade", slug, profissionalId, servicoId, dataLocal],
    queryFn: () => getDisponibilidade(slug, profissionalId, servicoId, dataLocal),
    enabled: !!dataLocal,
  })

  function handleDataChange(d: string) {
    setDataLocal(d)
    setHorarioLocal(null)
  }

  function formatarDia(d: string) {
    const dt = parseISO(d)
    if (isToday(dt)) return "Hoje"
    return `${DIAS_SEMANA_CURTO[dt.getDay()]} ${dt.getDate()}`
  }

  return (
    <div className="space-y-5">
      {/* Seleção de data */}
      <div>
        <p className="text-sm font-medium mb-2.5">Escolha o dia</p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {diasDisponiveis.map((d) => {
            const dt = parseISO(d)
            const isSelected = d === dataLocal
            return (
              <button
                key={d}
                onClick={() => handleDataChange(d)}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg border text-xs shrink-0 transition-all ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <span className="font-medium">{formatarDia(d)}</span>
                <span className={isSelected ? "text-primary-foreground/70" : "text-muted-foreground"}>
                  {MESES_CURTO[dt.getMonth()]}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Seleção de horário */}
      <div>
        <p className="text-sm font-medium mb-2.5">Horários disponíveis</p>
        {loadingSlots ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-9 rounded-md" />
            ))}
          </div>
        ) : slots && slots.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {slots.map((h) => (
              <button
                key={h}
                onClick={() => setHorarioLocal(h)}
                className={`py-2 rounded-md border text-sm font-medium transition-all ${
                  horarioLocal === h
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum horário disponível neste dia.
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 -ml-1">
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button
          className="flex-1 gap-1"
          disabled={!horarioLocal}
          onClick={() => horarioLocal && onSelect(dataLocal, horarioLocal)}
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Step 4: Confirmar ──────────────────────────────────────────────────────

function StepConfirmar({
  slug,
  servico,
  profissional,
  data,
  horario,
  notas,
  onNotasChange,
  onBack,
  onSuccess,
}: {
  slug: string
  servico: ServicoPublico
  profissional: ProfissionalPublico
  data: string
  horario: string
  notas: string
  onNotasChange: (v: string) => void
  onBack: () => void
  onSuccess: (a: AgendamentoCliente) => void
}) {
  const [erro, setErro] = useState("")

  function formatarDataLonga(d: string) {
    const dt = parseISO(d)
    return `${DIAS_SEMANA_LONGO[dt.getDay()]}, ${dt.getDate()} de ${MESES_LONGO[dt.getMonth()]} de ${dt.getFullYear()}`
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      agendar(slug, {
        professional_id: profissional.id,
        service_id: servico.id,
        scheduled_date: data,
        start_time: horario + ":00",
        notes: notas.trim() || undefined,
      }),
    onSuccess,
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setErro(typeof msg === "string" ? msg : "Erro ao realizar agendamento. Tente novamente.")
    },
  })

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: servico.color }}
            />
            <div>
              <p className="text-xs text-muted-foreground">Serviço</p>
              <p className="font-medium text-sm">{servico.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-semibold"
              style={{ backgroundColor: profissional.color }}
            >
              {profissional.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Profissional</p>
              <p className="font-medium text-sm">{profissional.name}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Data e horário</p>
            <p className="font-medium text-sm capitalize">{formatarDataLonga(data)} às {horario}</p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Duração</p>
            <p className="font-medium text-sm">{servico.duration_minutes} min</p>
          </div>

          <div className="border-t border-border pt-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-bold text-lg">
              R$ {Number(servico.price).toFixed(2).replace(".", ",")}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">
          Observações{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <textarea
          value={notas}
          onChange={(e) => onNotasChange(e.target.value)}
          placeholder="Alguma informação para o profissional?"
          rows={3}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          disabled={isPending}
          className="gap-1 -ml-1"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Button className="flex-1 gap-2" onClick={() => mutate()} disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Confirmar agendamento
        </Button>
      </div>
    </div>
  )
}
