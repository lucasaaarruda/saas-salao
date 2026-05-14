import { useMemo, useEffect, useState, type ComponentType } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, subDays, startOfMonth, eachDayOfInterval } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarDays, CheckCircle2, DollarSign, Users } from "lucide-react"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatarMoeda } from "@/lib/utils"
import api from "@/lib/api"
import type {
  Agendamento,
  Transacao,
  ResumoFinanceiro,
  Profissional,
  Servico,
  StatusAgendamento,
} from "@/types"

const hoje = format(new Date(), "yyyy-MM-dd")
const seteAnteriores = format(subDays(new Date(), 6), "yyyy-MM-dd")
const inicioMes = format(startOfMonth(new Date()), "yyyy-MM-dd")

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info"

const STATUS_CONFIG: Record<StatusAgendamento, { label: string; variant: BadgeVariant }> = {
  scheduled: { label: "Agendado", variant: "info" },
  confirmed: { label: "Confirmado", variant: "default" },
  in_progress: { label: "Em andamento", variant: "warning" },
  completed: { label: "Concluído", variant: "success" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  no_show: { label: "Não compareceu", variant: "secondary" },
}

export default function DashboardPage() {
  const { data: agendamentos7Dias, isLoading: loadingAg } = useQuery({
    queryKey: ["appointments", "7dias", seteAnteriores, hoje],
    queryFn: async () => {
      const res = await api.get<Agendamento[]>("/appointments", {
        params: { data_inicio: seteAnteriores, data_fim: hoje },
      })
      return res.data
    },
  })

  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ["resumo-financeiro", inicioMes, hoje],
    queryFn: async () => {
      const res = await api.get<ResumoFinanceiro>("/financial/resumo", {
        params: { data_inicio: inicioMes, data_fim: hoje },
      })
      return res.data
    },
  })

  const { data: transacoes7Dias, isLoading: loadingTransacoes } = useQuery({
    queryKey: ["transacoes", "7dias", seteAnteriores, hoje],
    queryFn: async () => {
      const res = await api.get<Transacao[]>("/financial", {
        params: { data_inicio: seteAnteriores, data_fim: hoje, tipo: "income" },
      })
      return res.data
    },
  })

  const { data: profissionais } = useQuery({
    queryKey: ["profissionais"],
    queryFn: async () => {
      const res = await api.get<Profissional[]>("/professionals", {
        params: { apenas_ativos: true },
      })
      return res.data
    },
  })

  const { data: servicos } = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      const res = await api.get<Servico[]>("/services", {
        params: { apenas_ativos: true },
      })
      return res.data
    },
  })

  const profMap = useMemo(
    () => Object.fromEntries((profissionais ?? []).map((p) => [p.id, p])),
    [profissionais]
  )
  const servMap = useMemo(
    () => Object.fromEntries((servicos ?? []).map((s) => [s.id, s])),
    [servicos]
  )

  const agendamentosHoje = useMemo(
    () => (agendamentos7Dias ?? []).filter((a) => a.scheduled_date === hoje),
    [agendamentos7Dias]
  )

  const agOrdenados = useMemo(
    () => [...agendamentosHoje].sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [agendamentosHoje]
  )

  const pendentes = agOrdenados.filter((a) =>
    ["scheduled", "confirmed", "in_progress"].includes(a.status)
  ).length
  const concluidos = agOrdenados.filter((a) => a.status === "completed").length

  const ultimos7 = useMemo(
    () => eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() }),
    []
  )

  const receitaData = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of transacoes7Dias ?? []) {
      const key = t.transaction_date
      map.set(key, (map.get(key) ?? 0) + parseFloat(t.amount))
    }
    return ultimos7.map((d) => ({
      data: format(d, "dd/MM"),
      receita: map.get(format(d, "yyyy-MM-dd")) ?? 0,
    }))
  }, [transacoes7Dias, ultimos7])

  const agData = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of agendamentos7Dias ?? []) {
      const key = a.scheduled_date
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return ultimos7.map((d) => ({
      data: format(d, "EEE", { locale: ptBR }),
      agendamentos: map.get(format(d, "yyyy-MM-dd")) ?? 0,
    }))
  }, [agendamentos7Dias, ultimos7])

  const dataExibida = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="fade-in-up">
        <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground capitalize mt-0.5">{dataExibida}</p>
      </div>

      {/* KPI Cards */}
      <div className="fade-in-up-delay-1 grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Agendamentos hoje"
          value={loadingAg ? null : String(agendamentosHoje.length)}
          numericValue={loadingAg ? undefined : agendamentosHoje.length}
          sub={`${pendentes} pendente${pendentes !== 1 ? "s" : ""}`}
          icon={CalendarDays}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          loading={loadingAg}
        />
        <KpiCard
          title="Concluídos hoje"
          value={loadingAg ? null : String(concluidos)}
          numericValue={loadingAg ? undefined : concluidos}
          sub={
            agOrdenados.length > 0
              ? `${Math.round((concluidos / agOrdenados.length) * 100)}% do total`
              : "—"
          }
          icon={CheckCircle2}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
          loading={loadingAg}
        />
        <KpiCard
          title="Receita do mês"
          value={loadingResumo ? null : formatarMoeda(resumo?.total_receitas ?? 0)}
          sub={`Saldo: ${formatarMoeda(resumo?.saldo ?? 0)}`}
          icon={DollarSign}
          iconBg="bg-amber-500/15"
          iconColor="text-amber-400"
          loading={loadingResumo}
        />
        <KpiCard
          title="Profissionais ativos"
          value={profissionais ? String(profissionais.length) : null}
          numericValue={profissionais ? profissionais.length : undefined}
          sub={`${servicos?.length ?? "—"} serviços ativos`}
          icon={Users}
          iconBg="bg-violet-500/15"
          iconColor="text-violet-400"
          loading={!profissionais}
        />
      </div>

      {/* Charts */}
      <div className="fade-in-up-delay-2 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Receita dos últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTransacoes ? (
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart
                  data={receitaData}
                  margin={{ top: 4, right: 16, left: -8, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="data"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `R$${v}`}
                    width={56}
                  />
                  <Tooltip
                    content={<RevenueTooltip />}
                    cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="receita"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Agendamentos por dia</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAg ? (
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={agData}
                  margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="data"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<AptsTooltip />}
                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.5 }}
                  />
                  <Bar
                    dataKey="agendamentos"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agenda de hoje */}
      <Card className="fade-in-up-delay-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Agenda de hoje</CardTitle>
            {!loadingAg && (
              <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                {agOrdenados.length}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loadingAg ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : agOrdenados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Sem agendamentos hoje</p>
              <p className="text-xs text-muted-foreground mt-1">
                Nenhum cliente agendado para hoje
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {agOrdenados.map((a) => {
                const prof = profMap[a.professional_id]
                const serv = servMap[a.service_id]
                const cfg = STATUS_CONFIG[a.status]
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors cursor-default"
                  >
                    {/* Time */}
                    <div className="text-center shrink-0 w-11">
                      <p className="text-[13px] font-semibold tabular-nums leading-tight">
                        {a.start_time.slice(0, 5)}
                      </p>
                      <p className="text-[10px] text-muted-foreground tabular-nums leading-tight">
                        {a.end_time.slice(0, 5)}
                      </p>
                    </div>
                    {/* Color bar */}
                    <div
                      className="w-1 h-9 rounded-full shrink-0"
                      style={{ backgroundColor: prof?.color ?? serv?.color ?? "#BE185D" }}
                    />
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">
                        {serv?.name ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                        {prof?.name ?? "—"}
                      </p>
                    </div>
                    {/* Status + price */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={cfg.variant}
                        className="hidden sm:inline-flex text-[11px]"
                      >
                        {cfg.label}
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums">
                        {formatarMoeda(a.final_price)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function useCountUp(target: number, enabled: boolean, duration = 600): number {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    if (!enabled) return
    if (target === 0) { setCurrent(0); return }
    const startTime = performance.now()
    let raf: number

    const step = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCurrent(Math.round(eased * target))
      if (progress < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, enabled, duration])

  return current
}

interface KpiCardProps {
  title: string
  value: string | null
  sub: string
  icon: ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  loading?: boolean
  numericValue?: number
}

function KpiCard({ title, value, numericValue, sub, icon: Icon, iconBg, iconColor, loading }: KpiCardProps) {
  const count = useCountUp(numericValue ?? 0, !loading && numericValue !== undefined)
  const displayValue = !loading && numericValue !== undefined ? String(count) : value

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider leading-none">
              {title}
            </p>
            <div className="pt-1">
              {loading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <p key={value ?? "loading"} className="text-2xl font-bold tracking-tight leading-none count-up">
                  {displayValue}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-xl shrink-0 mt-0.5",
              iconBg
            )}
          >
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg shadow-card-md px-3 py-2 text-sm">
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      <p className="font-semibold text-foreground">{formatarMoeda(payload[0].value)}</p>
    </div>
  )
}

function AptsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0].value as number
  return (
    <div className="bg-card border border-border rounded-lg shadow-card-md px-3 py-2 text-sm">
      <p className="text-xs text-muted-foreground mb-0.5 capitalize">{label}</p>
      <p className="font-semibold text-foreground">
        {v} agendamento{v !== 1 ? "s" : ""}
      </p>
    </div>
  )
}
