import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { formatarMoeda, formatarMoedaInput } from "@/lib/utils"
import type { Servico } from "@/types"

const CATEGORIAS = ["Cabelo", "Unhas", "Estética", "Depilação", "Barba", "Maquiagem", "Outros"]

const servicoSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  category: z.string().min(1, "Selecione a categoria"),
  duration_minutes: z.coerce.number().int().min(1, "Mínimo 1 minuto"),
  price: z.preprocess(
    (v) => {
      if (typeof v !== "string") return v
      const parsed = parseFloat((v as string).replace(/\./g, "").replace(",", "."))
      return isNaN(parsed) ? undefined : parsed
    },
    z.number({ required_error: "Preço obrigatório", invalid_type_error: "Preço inválido" }).min(0, "Preço inválido")
  ),
  commission_type: z.enum(["percentage", "fixed"]),
  commission_value: z.coerce.number().min(0, "Valor inválido"),
  description: z.string().optional(),
  color: z.string().min(4, "Cor obrigatória"),
})
type ServicoForm = z.infer<typeof servicoSchema>

const DEFAULT_VALUES: ServicoForm = {
  name: "",
  category: "",
  duration_minutes: 60,
  price: "" as unknown as number,
  commission_type: "percentage",
  commission_value: 0,
  description: "",
  color: "#f472b6",
}

const COLUNAS: Coluna<Servico>[] = [
  { chave: "name", cabecalho: "Nome", render: (s) => s.name },
  {
    chave: "category",
    cabecalho: "Categoria",
    render: (s) => s.category,
    ocultoMobile: true,
  },
  {
    chave: "duration",
    cabecalho: "Duração",
    render: (s) => `${s.duration_minutes} min`,
    ocultoMobile: true,
  },
  { chave: "price", cabecalho: "Preço", render: (s) => formatarMoeda(s.price) },
  {
    chave: "commission",
    cabecalho: "Comissão",
    render: (s) =>
      s.commission_type === "percentage"
        ? `${s.commission_value}%`
        : formatarMoeda(s.commission_value),
    ocultoMobile: true,
  },
  {
    chave: "color",
    cabecalho: "Cor",
    render: (s) => (
      <div
        className="w-5 h-5 rounded-md border border-white/10"
        style={{ backgroundColor: s.color }}
        title={s.color}
      />
    ),
  },
  {
    chave: "status",
    cabecalho: "Status",
    render: (s) => (
      <Badge variant={s.is_active ? "success" : "secondary"}>
        {s.is_active ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
]

export default function ServicosPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [openDrawer, setOpenDrawer] = useState(false)
  const [editando, setEditando] = useState<Servico | null>(null)
  const [deletando, setDeletando] = useState<Servico | null>(null)
  const [formErro, setFormErro] = useState("")

  const { data: servicos, isLoading } = useQuery({
    queryKey: ["servicos-admin"],
    queryFn: async () => {
      const res = await api.get<Servico[]>("/services", {
        params: { apenas_ativos: false },
      })
      return res.data
    },
  })

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<ServicoForm>({
    resolver: zodResolver(servicoSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const watchedColor = watch("color")
  const watchedCommType = watch("commission_type")

  const criarMutation = useMutation({
    mutationFn: (data: ServicoForm) =>
      api.post<Servico>("/services", {
        ...data,
        description: data.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos-admin"] })
      queryClient.invalidateQueries({ queryKey: ["servicos"] })
      toast({ title: "Serviço criado com sucesso!" })
      handleCloseDrawer()
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormErro(typeof detail === "string" ? detail : "Erro ao salvar serviço.")
    },
  })

  const editarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServicoForm }) =>
      api.patch<Servico>(`/services/${id}`, {
        ...data,
        description: data.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos-admin"] })
      queryClient.invalidateQueries({ queryKey: ["servicos"] })
      toast({ title: "Serviço atualizado!" })
      handleCloseDrawer()
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormErro(typeof detail === "string" ? detail : "Erro ao salvar serviço.")
    },
  })

  const deletarMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos-admin"] })
      queryClient.invalidateQueries({ queryKey: ["servicos"] })
      toast({ title: "Serviço removido." })
      setDeletando(null)
    },
  })

  function handleOpenCreate() {
    setEditando(null)
    reset(DEFAULT_VALUES)
    setFormErro("")
    setOpenDrawer(true)
  }

  function handleOpenEdit(s: Servico) {
    setEditando(s)
    reset({
      name: s.name,
      category: s.category,
      duration_minutes: s.duration_minutes,
      price: Number(s.price).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) as unknown as number,
      commission_type: s.commission_type as "percentage" | "fixed",
      commission_value: Number(s.commission_value),
      description: s.description ?? "",
      color: s.color,
    })
    setFormErro("")
    setOpenDrawer(true)
  }

  function handleCloseDrawer() {
    setOpenDrawer(false)
    setEditando(null)
    setFormErro("")
    reset(DEFAULT_VALUES)
  }

  function onSubmit(data: ServicoForm) {
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
        <h1 className="text-xl font-bold tracking-tight">Serviços</h1>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Novo serviço
        </Button>
      </div>

      {isLoading ? (
        <Skeleton preset="lista" lines={3} />
      ) : !servicos?.length ? (
        <EstadoVazio
          variant="servicos"
          acaoPrimaria={{ label: "Novo serviço", onClick: handleOpenCreate }}
        />
      ) : (
        <TabelaOuCards
          dados={servicos}
          colunas={COLUNAS}
          keyExtractor={(s) => s.id}
          cardPrincipal={(s) => (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="font-medium text-sm truncate">{s.name}</span>
              </div>
              <Badge variant={s.is_active ? "success" : "secondary"} className="text-[11px]">
                {s.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          )}
          cardSecundario={(s) => (
            <>
              {s.category} · {s.duration_minutes} min · {formatarMoeda(s.price)}
            </>
          )}
          acoes={(s) => (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(s) }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); setDeletando(s) }}
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
        titulo={editando ? "Editar serviço" : "Novo serviço"}
        onSalvar={() => handleSubmit(onSubmit)()}
        textoBotaoSalvar={editando ? "Salvar" : "Criar serviço"}
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
              <Label htmlFor="srv-name">Nome:*</Label>
              <Input id="srv-name" placeholder="Ex: Corte de cabelo" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Categoria:*</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="duration_minutes">Duração (min):*</Label>
              <div className="relative">
                <Input
                  id="duration_minutes"
                  type="number"
                  min="1"
                  step="5"
                  className="pr-12"
                  {...register("duration_minutes")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">min</span>
              </div>
              {errors.duration_minutes && (
                <p className="text-xs text-destructive">{errors.duration_minutes.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price">Preço (R$):*</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">R$</span>
                <Input
                  id="price"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className="pl-9"
                  {...register("price")}
                  onChange={(e) => {
                    const formatted = formatarMoedaInput(e.target.value)
                    setValue("price", formatted as unknown as number, { shouldValidate: true, shouldDirty: true })
                  }}
                />
              </div>
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de comissão:*</Label>
              <Controller
                name="commission_type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentual (%)</SelectItem>
                      <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="commission_value">
                Comissão {watchedCommType === "percentage" ? "(%)" : "(R$)"}:*
              </Label>
              <div className="relative">
                {watchedCommType === "fixed" && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">R$</span>
                )}
                <Input
                  id="commission_value"
                  type="number"
                  min="0"
                  step={watchedCommType === "percentage" ? "0.5" : "0.01"}
                  className={watchedCommType === "fixed" ? "pl-9 pr-3" : "pr-8"}
                  {...register("commission_value")}
                />
                {watchedCommType === "percentage" && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">%</span>
                )}
              </div>
              {errors.commission_value && (
                <p className="text-xs text-destructive">{errors.commission_value.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Cor:</Label>
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

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="description">Descrição:</Label>
              <Textarea
                id="description"
                placeholder="Descrição do serviço..."
                rows={2}
                {...register("description")}
              />
            </div>
          </div>
        </div>
      </DrawerFormulario>

      <ModalConfirmacao
        open={!!deletando}
        onClose={() => setDeletando(null)}
        onConfirmar={() => deletando && deletarMutation.mutate(deletando.id)}
        titulo="Remover serviço"
        descricao={`Tem certeza que deseja remover ${deletando?.name}? Esta ação desativa o serviço no sistema.`}
        variante="destructive"
        carregando={deletarMutation.isPending}
        textoBotaoConfirmar="Remover"
      />
    </div>
  )
}
