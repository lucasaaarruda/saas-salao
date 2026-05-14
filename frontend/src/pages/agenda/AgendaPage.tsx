import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2, MoreVertical, Plus, UserPlus } from "lucide-react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { DrawerFormulario } from "@/components/ui/drawer-formulario"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { formatarMoeda } from "@/lib/utils"
import type { Agendamento, Cliente, Profissional, Servico, StatusAgendamento } from "@/types"

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"

const STATUS_CONFIG: Record<StatusAgendamento, { label: string; variant: BadgeVariant }> = {
  scheduled: { label: "Agendado", variant: "info" },
  confirmed: { label: "Confirmado", variant: "default" },
  in_progress: { label: "Em andamento", variant: "warning" },
  completed: { label: "Concluído", variant: "success" },
  cancelled: { label: "Cancelado", variant: "destructive" },
  no_show: { label: "Não compareceu", variant: "secondary" },
}

type StatusAction = { label: string; status: StatusAgendamento }

const STATUS_ACTIONS: Partial<Record<StatusAgendamento, StatusAction[]>> = {
  scheduled: [
    { label: "Confirmar", status: "confirmed" },
    { label: "Cancelar", status: "cancelled" },
  ],
  confirmed: [
    { label: "Iniciar atendimento", status: "in_progress" },
    { label: "Cancelar", status: "cancelled" },
  ],
  in_progress: [
    { label: "Concluir", status: "completed" },
    { label: "Não compareceu", status: "no_show" },
    { label: "Cancelar", status: "cancelled" },
  ],
}

const agendSchema = z.object({
  client_id: z.string().min(1, "Selecione o cliente"),
  professional_id: z.string().min(1, "Selecione o profissional"),
  service_id: z.string().min(1, "Selecione o serviço"),
  start_time: z.string().min(1, "Selecione um horário"),
  notes: z.string().optional(),
})
type AgendForm = z.infer<typeof agendSchema>

const novoClienteSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  phone: z.string().min(8, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cpf: z
    .string()
    .length(11, "CPF deve ter 11 dígitos")
    .regex(/^\d+$/, "Apenas números")
    .optional()
    .or(z.literal("")),
})
type NovoClienteForm = z.infer<typeof novoClienteSchema>

// ─── Componente inline de novo cliente ──────────────────────────────────────

function NovoClienteInline({
  onSuccess,
  onCancel,
}: {
  onSuccess: (clienteId: string) => void
  onCancel: () => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [erro, setErro] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NovoClienteForm>({ resolver: zodResolver(novoClienteSchema) })

  async function onSubmit(data: NovoClienteForm) {
    setErro("")
    try {
      const res = await api.post<Cliente>("/clients", {
        name: data.name,
        phone: data.phone,
        ...(data.email ? { email: data.email } : {}),
        ...(data.cpf ? { cpf: data.cpf } : {}),
      })
      queryClient.invalidateQueries({ queryKey: ["clientes"] })
      toast({ title: "Cliente cadastrado com sucesso!" })
      onSuccess(res.data.id)
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setErro(typeof detail === "string" ? detail : "Erro ao cadastrar cliente.")
    }
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-muted/20 p-3 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
        <UserPlus className="h-3.5 w-3.5" />
        Novo cliente
      </p>

      {erro && (
        <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{erro}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Nome *</Label>
          <Input className="h-8 text-sm" placeholder="Nome completo" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Telefone *</Label>
          <Input className="h-8 text-sm" placeholder="(11) 99999-9999" {...register("phone")} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">CPF</Label>
          <Input
            className="h-8 text-sm"
            placeholder="00000000000"
            maxLength={11}
            {...register("cpf")}
          />
          {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
        </div>
        <div className="col-span-2 space-y-1">
          <Label className="text-xs">Email</Label>
          <Input
            className="h-8 text-sm"
            type="email"
            placeholder="email@exemplo.com"
            {...register("email")}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} className="h-7 text-xs">
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          className="h-7 text-xs gap-1"
          disabled={isSubmitting}
          onClick={handleSubmit(onSubmit)}
        >
          {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
          Cadastrar
        </Button>
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function AgendaPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [openDrawer, setOpenDrawer] = useState(false)
  const [formErro, setFormErro] = useState("")
  const [novoClienteAberto, setNovoClienteAberto] = useState(false)

  const dateStr = format(selectedDate, "yyyy-MM-dd")

  const { data: agendamentos, isLoading } = useQuery({
    queryKey: ["appointments-agenda", dateStr],
    queryFn: async () => {
      const res = await api.get<Agendamento[]>("/appointments", {
        params: { data_inicio: dateStr, data_fim: dateStr },
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

  const { data: clientes } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const res = await api.get<Cliente[]>("/clients")
      return res.data
    },
  })

  const profMap = Object.fromEntries((profissionais ?? []).map((p) => [p.id, p]))
  const servMap = Object.fromEntries((servicos ?? []).map((s) => [s.id, s]))
  const clienteMap = Object.fromEntries((clientes ?? []).map((c) => [c.id, c]))

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AgendForm>({ resolver: zodResolver(agendSchema) })

  const watchedProfId = watch("professional_id")
  const watchedServiceId = watch("service_id")
  const watchedStartTime = watch("start_time")
  const servicoSelecionado = servicos?.find((s) => s.id === watchedServiceId)

  // Busca slots disponíveis quando prof + serviço selecionados
  const { data: slots, isLoading: loadingSlots } = useQuery({
    queryKey: ["slots-agenda", watchedProfId, watchedServiceId, dateStr],
    queryFn: async () => {
      const res = await api.get<string[]>("/appointments/disponibilidade", {
        params: {
          professional_id: watchedProfId,
          service_id: watchedServiceId,
          data: dateStr,
        },
      })
      return res.data
    },
    enabled: !!watchedProfId && !!watchedServiceId,
  })

  const criarMutation = useMutation({
    mutationFn: async (data: AgendForm) => {
      await api.post("/appointments", {
        ...data,
        scheduled_date: dateStr,
        start_time: data.start_time + ":00",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments-agenda", dateStr] })
      toast({ title: "Agendamento criado com sucesso!" })
      handleCloseDrawer()
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormErro(typeof detail === "string" ? detail : "Erro ao criar agendamento.")
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusAgendamento }) => {
      await api.patch(`/appointments/${id}/status`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments-agenda", dateStr] })
      toast({ title: "Status atualizado" })
    },
  })

  const agOrdenados = [...(agendamentos ?? [])].sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  )

  const dataExibida = selectedDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  function handleCloseDrawer() {
    setOpenDrawer(false)
    setFormErro("")
    setNovoClienteAberto(false)
    reset()
  }

  function onSubmit(data: AgendForm) {
    criarMutation.mutate(data)
  }

  return (
    <div className="fade-in-up p-4 sm:p-6 space-y-5">
      <h1 className="text-xl font-bold tracking-tight">Agenda</h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar */}
        <Card className="w-full lg:w-auto shrink-0 self-start">
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => d && setSelectedDate(d)}
              className="rounded-md"
            />
          </CardContent>
        </Card>

        {/* Appointment list */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold capitalize">{dataExibida}</p>
              <p className="text-sm text-muted-foreground">
                {agOrdenados.length} agendamento{agOrdenados.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button onClick={() => setOpenDrawer(true)} size="sm">
              <Plus className="mr-1.5 h-4 w-4" /> Novo agendamento
            </Button>
          </div>

          {isLoading ? (
            <Skeleton preset="lista" lines={3} />
          ) : agOrdenados.length === 0 ? (
            <EstadoVazio
              variant="agenda"
              acaoPrimaria={{ label: "Novo agendamento", onClick: () => setOpenDrawer(true) }}
            />
          ) : (
            <div className="space-y-2">
              {agOrdenados.map((a) => {
                const prof = profMap[a.professional_id]
                const serv = servMap[a.service_id]
                const cliente = clienteMap[a.client_id]
                const cfg = STATUS_CONFIG[a.status]
                const actions = STATUS_ACTIONS[a.status] ?? []
                return (
                  <Card key={a.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 text-center shrink-0">
                          <p className="text-[13px] font-semibold tabular-nums leading-tight">
                            {a.start_time.slice(0, 5)}
                          </p>
                          <p className="text-[10px] text-muted-foreground tabular-nums leading-tight">
                            {a.end_time.slice(0, 5)}
                          </p>
                        </div>
                        <div
                          className="w-1 h-10 rounded-full shrink-0"
                          style={{ backgroundColor: prof?.color ?? "#6366f1" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate leading-tight">
                            {cliente?.name ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                            {serv?.name ?? "—"} · {prof?.name ?? "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant={cfg.variant} className="text-[11px]">{cfg.label}</Badge>
                          <p className="text-sm font-semibold tabular-nums hidden sm:block">
                            {formatarMoeda(a.final_price)}
                          </p>
                          {actions.length > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {actions.map((act) => (
                                  <DropdownMenuItem
                                    key={act.status}
                                    onClick={() =>
                                      statusMutation.mutate({ id: a.id, status: act.status })
                                    }
                                    className={
                                      act.status === "cancelled" || act.status === "no_show"
                                        ? "text-destructive focus:text-destructive"
                                        : ""
                                    }
                                  >
                                    {act.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Drawer */}
      <DrawerFormulario
        open={openDrawer}
        onClose={handleCloseDrawer}
        titulo="Novo agendamento"
        onSalvar={() => handleSubmit(onSubmit)()}
        textoBotaoSalvar="Agendar"
        carregando={criarMutation.isPending}
      >
        <div className="space-y-4">
          {formErro && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {formErro}
            </p>
          )}

          {/* Cliente com opção de cadastro inline */}
          <div className="space-y-1.5">
            <Label>Cliente *</Label>
            <Controller
              name="client_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(clientes ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.client_id && (
              <p className="text-xs text-destructive">{errors.client_id.message}</p>
            )}

            {!novoClienteAberto ? (
              <button
                type="button"
                onClick={() => setNovoClienteAberto(true)}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <UserPlus className="h-3 w-3" />
                Cadastrar novo cliente
              </button>
            ) : (
              <NovoClienteInline
                onSuccess={(id) => {
                  setValue("client_id", id, { shouldValidate: true })
                  setNovoClienteAberto(false)
                }}
                onCancel={() => setNovoClienteAberto(false)}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Profissional *</Label>
              <Controller
                name="professional_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v)
                      setValue("start_time", "", { shouldValidate: false })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(profissionais ?? []).map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.professional_id && (
                <p className="text-xs text-destructive">{errors.professional_id.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Serviço *</Label>
              <Controller
                name="service_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v)
                      setValue("start_time", "", { shouldValidate: false })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(servicos ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.service_id && (
                <p className="text-xs text-destructive">{errors.service_id.message}</p>
              )}
            </div>
          </div>

          {servicoSelecionado && (
            <p className="text-xs text-muted-foreground">
              Duração: {servicoSelecionado.duration_minutes} min · Preço:{" "}
              {formatarMoeda(servicoSelecionado.price)}
            </p>
          )}

          {/* Data */}
          <div className="space-y-1.5">
            <Label>Data</Label>
            <Input type="date" value={dateStr} readOnly className="bg-muted cursor-default" />
          </div>

          {/* Slot buttons de horário */}
          <div className="space-y-1.5">
            <Label>Horário *</Label>
            <input type="hidden" {...register("start_time")} />

            {!watchedProfId || !watchedServiceId ? (
              <p className="text-xs text-muted-foreground py-1">
                Selecione o profissional e o serviço para ver os horários disponíveis.
              </p>
            ) : loadingSlots ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} className="h-8 rounded-md" />
                ))}
              </div>
            ) : slots && slots.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValue("start_time", s, { shouldValidate: true })}
                    className={`py-1.5 rounded-md border text-xs font-medium transition-all ${
                      watchedStartTime === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-1">
                Nenhum horário disponível neste dia para o profissional e serviço selecionados.
              </p>
            )}

            {errors.start_time && (
              <p className="text-xs text-destructive">{errors.start_time.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ag-notes">Observações</Label>
            <Textarea
              id="ag-notes"
              placeholder="Alguma observação..."
              rows={2}
              {...register("notes")}
            />
          </div>
        </div>
      </DrawerFormulario>
    </div>
  )
}
