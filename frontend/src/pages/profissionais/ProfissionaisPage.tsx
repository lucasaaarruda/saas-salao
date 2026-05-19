import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DrawerFormulario } from "@/components/ui/drawer-formulario"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModalConfirmacao } from "@/components/ui/modal-confirmacao"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TabelaOuCards, type Coluna } from "@/components/ui/tabela-ou-cards"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { formatarTelefone } from "@/lib/utils"
import type { HorarioDia, Profissional } from "@/types"

const ESPECIALIDADES = [
  "Cabeleireiro(a)",
  "Barbeiro(a)",
  "Manicure / Pedicure",
  "Esteticista",
  "Maquiador(a)",
  "Depilação",
  "Sobrancelhas / Lashes",
  "Massagista",
  "Outro",
]

// ─── Tipos ────────────────────────────────────────────────────────────────────

type WorkingHours = Record<string, HorarioDia>

const DIAS: { key: string; label: string }[] = [
  { key: "1", label: "Segunda" },
  { key: "2", label: "Terça" },
  { key: "3", label: "Quarta" },
  { key: "4", label: "Quinta" },
  { key: "5", label: "Sexta" },
  { key: "6", label: "Sábado" },
  { key: "0", label: "Domingo" },
]

const DEFAULT_HOURS: HorarioDia = { start: "09:00", end: "18:00" }

// ─── Componente de configuração de horários ────────────────────────────────

function HorariosTrabalho({
  value,
  onChange,
}: {
  value: WorkingHours
  onChange: (v: WorkingHours) => void
}) {
  function toggleDia(key: string, checked: boolean) {
    if (checked) {
      onChange({ ...value, [key]: DEFAULT_HOURS })
    } else {
      const next = { ...value }
      delete next[key]
      onChange(next)
    }
  }

  function updateHora(key: string, field: "start" | "end", hora: string) {
    onChange({ ...value, [key]: { ...value[key], [field]: hora } })
  }

  return (
    <div className="space-y-2">
      {DIAS.map(({ key, label }) => {
        const ativo = key in value
        return (
          <div
            key={key}
            className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
              ativo ? "bg-muted/30" : "opacity-60"
            }`}
          >
            <Checkbox
              id={`dia-${key}`}
              checked={ativo}
              onCheckedChange={(v) => toggleDia(key, !!v)}
            />
            <label
              htmlFor={`dia-${key}`}
              className="text-sm w-16 shrink-0 cursor-pointer select-none"
            >
              {label}
            </label>
            <div className="flex items-center gap-1.5 flex-1">
              <Input
                type="time"
                value={ativo ? value[key].start : ""}
                onChange={(e) => updateHora(key, "start", e.target.value)}
                disabled={!ativo}
                className="h-7 text-xs px-2 w-24"
              />
              <span className="text-muted-foreground text-xs shrink-0">até</span>
              <Input
                type="time"
                value={ativo ? value[key].end : ""}
                onChange={(e) => updateHora(key, "end", e.target.value)}
                disabled={!ativo}
                className="h-7 text-xs px-2 w-24"
              />
            </div>
          </div>
        )
      })}
      <p className="text-[11px] text-muted-foreground px-1">
        Dias desmarcados usam o horário do salão. Deixe todos desmarcados para herdar o
        horário do salão.
      </p>
    </div>
  )
}

// ─── Schema do formulário ──────────────────────────────────────────────────

const profSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  phone: z.string().min(8, "Telefone inválido"),
  specialty: z.string().min(1, "Especialidade obrigatória"),
  specialty_outro: z.string().optional(),
  commission_percentage: z.coerce.number().min(0, "Mínimo 0%").max(100, "Máximo 100%"),
  color: z.string().min(4, "Cor obrigatória"),
})
type ProfForm = z.infer<typeof profSchema>

const DEFAULT_VALUES: ProfForm = {
  name: "",
  phone: "",
  specialty: "",
  specialty_outro: "",
  commission_percentage: 0,
  color: "#6366f1",
}

// ─── Colunas da tabela ─────────────────────────────────────────────────────

const COLUNAS: Coluna<Profissional>[] = [
  { chave: "name", cabecalho: "Nome", render: (p) => p.name },
  {
    chave: "specialty",
    cabecalho: "Especialidade",
    render: (p) => p.specialty,
    ocultoMobile: true,
  },
  {
    chave: "phone",
    cabecalho: "Telefone",
    render: (p) => formatarTelefone(p.phone),
    ocultoMobile: true,
  },
  {
    chave: "commission",
    cabecalho: "Comissão",
    render: (p) => `${p.commission_percentage}%`,
    ocultoMobile: true,
  },
  {
    chave: "color",
    cabecalho: "Cor",
    render: (p) => (
      <div
        className="w-5 h-5 rounded-md border border-white/10"
        style={{ backgroundColor: p.color }}
        title={p.color}
      />
    ),
  },
  {
    chave: "status",
    cabecalho: "Status",
    render: (p) => (
      <Badge variant={p.is_active ? "success" : "secondary"}>
        {p.is_active ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
]

// ─── Página ────────────────────────────────────────────────────────────────

export default function ProfissionaisPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [editando, setEditando] = useState<Profissional | null>(null)
  const [deletando, setDeletando] = useState<Profissional | null>(null)
  const [formErro, setFormErro] = useState("")
  const [workingHours, setWorkingHours] = useState<WorkingHours>({})

  const { data: profissionais, isLoading } = useQuery({
    queryKey: ["profissionais-admin"],
    queryFn: async () => {
      const res = await api.get<Profissional[]>("/professionals", {
        params: { apenas_ativos: false },
      })
      return res.data
    },
  })

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<ProfForm>({
    resolver: zodResolver(profSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const watchedColor = watch("color")
  const specialtyValue = watch("specialty")

  function resolveSpecialty(data: ProfForm): string {
    return data.specialty === "Outro" ? (data.specialty_outro ?? "") : data.specialty
  }

  const criarMutation = useMutation({
    mutationFn: (data: ProfForm) =>
      api.post<Profissional>("/professionals", {
        ...data,
        specialty: resolveSpecialty(data),
        specialty_outro: undefined,
        working_hours: workingHours,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais-admin"] })
      queryClient.invalidateQueries({ queryKey: ["profissionais"] })
      toast({ title: "Profissional criado com sucesso!" })
      handleCloseDrawer()
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormErro(typeof detail === "string" ? detail : "Erro ao salvar profissional.")
    },
  })

  const editarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProfForm }) =>
      api.patch<Profissional>(`/professionals/${id}`, {
        ...data,
        specialty: resolveSpecialty(data),
        specialty_outro: undefined,
        working_hours: workingHours,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais-admin"] })
      queryClient.invalidateQueries({ queryKey: ["profissionais"] })
      toast({ title: "Profissional atualizado!" })
      handleCloseDrawer()
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormErro(typeof detail === "string" ? detail : "Erro ao salvar profissional.")
    },
  })

  const deletarMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/professionals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profissionais-admin"] })
      queryClient.invalidateQueries({ queryKey: ["profissionais"] })
      toast({ title: "Profissional removido." })
      setDeletando(null)
    },
  })

  function handleOpenCreate() {
    setEditando(null)
    reset(DEFAULT_VALUES)
    setWorkingHours({})
    setFormErro("")
    setOpenDrawer(true)
  }

  function handleOpenEdit(p: Profissional) {
    const isPreset = ESPECIALIDADES.filter((e) => e !== "Outro").includes(p.specialty)
    setEditando(p)
    reset({
      name: p.name,
      phone: p.phone,
      specialty: isPreset ? p.specialty : (p.specialty ? "Outro" : ""),
      specialty_outro: isPreset ? "" : (p.specialty ?? ""),
      commission_percentage: p.commission_percentage,
      color: p.color,
    })
    setWorkingHours(p.working_hours ?? {})
    setFormErro("")
    setOpenDrawer(true)
  }

  function handleCloseDrawer() {
    setOpenDrawer(false)
    setEditando(null)
    setFormErro("")
    setWorkingHours({})
    reset(DEFAULT_VALUES)
  }

  function onSubmit(data: ProfForm) {
    if (editando) {
      editarMutation.mutate({ id: editando.id, data })
    } else {
      criarMutation.mutate(data)
    }
  }

  const isPending = criarMutation.isPending || editarMutation.isPending

  return (
    <div className="fade-in-up p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Profissionais</h1>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Novo profissional
        </Button>
      </div>

      {isLoading ? (
        <Skeleton preset="lista" lines={3} />
      ) : !profissionais?.length ? (
        <EstadoVazio
          variant="profissionais"
          acaoPrimaria={{ label: "Novo profissional", onClick: handleOpenCreate }}
        />
      ) : (
        <TabelaOuCards
          dados={profissionais}
          colunas={COLUNAS}
          keyExtractor={(p) => p.id}
          cardPrincipal={(p) => (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: p.color }}
                />
                <span className="font-medium text-sm truncate">{p.name}</span>
              </div>
              <Badge variant={p.is_active ? "success" : "secondary"} className="text-[11px]">
                {p.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          )}
          cardSecundario={(p) => (
            <>
              {p.specialty} · {formatarTelefone(p.phone)}
            </>
          )}
          cardLateral={(p) => (
            <span className="text-xs text-muted-foreground">{p.commission_percentage}%</span>
          )}
          acoes={(p) => (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(p) }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); setDeletando(p) }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        />
      )}

      <DrawerFormulario
        open={openDrawer}
        onClose={handleCloseDrawer}
        titulo={editando ? "Editar profissional" : "Novo profissional"}
        onSalvar={() => handleSubmit(onSubmit)()}
        textoBotaoSalvar={editando ? "Salvar" : "Criar profissional"}
        carregando={isPending}
      >
        <div className="space-y-4">
          {formErro && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {formErro}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="prof-name">Nome:*</Label>
              <Input id="prof-name" placeholder="Nome completo" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prof-phone">Telefone:*</Label>
              <Input
                id="prof-phone"
                placeholder="(11) 99999-9999"
                {...register("phone")}
                onChange={(e) => {
                  const formatted = formatarTelefone(e.target.value)
                  setValue("phone", formatted, { shouldValidate: true, shouldDirty: true })
                }}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Especialidade:*</Label>
              <Controller
                name="specialty"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ESPECIALIDADES.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {specialtyValue === "Outro" && (
                <Input
                  placeholder="Descreva a especialidade..."
                  {...register("specialty_outro")}
                />
              )}
              {errors.specialty && (
                <p className="text-xs text-destructive">{errors.specialty.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="commission_percentage">Comissão (%):</Label>
              <div className="relative">
                <Input
                  id="commission_percentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  className="pr-8"
                  {...register("commission_percentage")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">%</span>
              </div>
              {errors.commission_percentage && (
                <p className="text-xs text-destructive">{errors.commission_percentage.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Cor da agenda:</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  {...register("color")}
                  className="h-9 w-14 cursor-pointer rounded border border-border p-1 bg-transparent"
                />
                <span className="text-xs text-muted-foreground font-mono">{watchedColor}</span>
              </div>
              {errors.color && <p className="text-xs text-destructive">{errors.color.message}</p>}
            </div>
          </div>

          {/* Horários de trabalho */}
          <div className="space-y-2.5 pt-1">
            <div className="border-t border-border pt-3">
              <Label className="text-sm font-semibold">Horários de trabalho</Label>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Configure os dias e horários em que este profissional atende.
              </p>
              <HorariosTrabalho value={workingHours} onChange={setWorkingHours} />
            </div>
          </div>
        </div>
      </DrawerFormulario>

      <ModalConfirmacao
        open={!!deletando}
        onClose={() => setDeletando(null)}
        onConfirmar={() => deletando && deletarMutation.mutate(deletando.id)}
        titulo="Remover profissional"
        descricao={`Tem certeza que deseja remover ${deletando?.name}? Esta ação desativa o profissional no sistema.`}
        variante="destructive"
        carregando={deletarMutation.isPending}
        textoBotaoConfirmar="Remover"
      />
    </div>
  )
}
