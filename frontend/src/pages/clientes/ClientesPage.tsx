import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Search, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DrawerFormulario } from "@/components/ui/drawer-formulario"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ModalConfirmacao } from "@/components/ui/modal-confirmacao"
import { Skeleton } from "@/components/ui/skeleton"
import { TabelaOuCards, type Coluna } from "@/components/ui/tabela-ou-cards"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import api from "@/lib/api"
import { formatarMoeda, formatarTelefone } from "@/lib/utils"
import type { Cliente } from "@/types"

const clienteSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  phone: z.string().min(8, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  birth_date: z.string().optional(),
  cpf: z.string().optional(),
  how_met: z.string().optional(),
  notes: z.string().optional(),
})
type ClienteForm = z.infer<typeof clienteSchema>

const EMPTY_FORM: ClienteForm = {
  name: "", phone: "", email: "", birth_date: "", cpf: "", how_met: "", notes: "",
}

const COLUNAS: Coluna<Cliente>[] = [
  { chave: "name", cabecalho: "Nome", render: (c) => c.name },
  { chave: "phone", cabecalho: "Telefone", render: (c) => formatarTelefone(c.phone) },
  {
    chave: "email",
    cabecalho: "Email",
    render: (c) => c.email ?? "—",
    ocultoMobile: true,
  },
  { chave: "visit_count", cabecalho: "Visitas", render: (c) => c.visit_count, ocultoMobile: true },
  {
    chave: "total_spent",
    cabecalho: "Total gasto",
    render: (c) => formatarMoeda(c.total_spent),
    ocultoMobile: true,
  },
  {
    chave: "status",
    cabecalho: "Status",
    render: (c) => (
      <Badge variant={c.is_active ? "success" : "secondary"}>
        {c.is_active ? "Ativo" : "Inativo"}
      </Badge>
    ),
  },
]

export default function ClientesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [busca, setBusca] = useState("")
  const [debouncedBusca, setDebouncedBusca] = useState("")
  const [openDrawer, setOpenDrawer] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [deletando, setDeletando] = useState<Cliente | null>(null)
  const [formErro, setFormErro] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusca(busca), 300)
    return () => clearTimeout(t)
  }, [busca])

  const { data: clientes, isLoading } = useQuery({
    queryKey: ["clientes-list", debouncedBusca],
    queryFn: async () => {
      const params: Record<string, string> = {}
      if (debouncedBusca) params.busca = debouncedBusca
      const res = await api.get<Cliente[]>("/clients", { params })
      return res.data
    },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClienteForm>({
    resolver: zodResolver(clienteSchema),
  })

  const criarMutation = useMutation({
    mutationFn: (data: ClienteForm) =>
      api.post<Cliente>("/clients", {
        ...data,
        email: data.email || undefined,
        birth_date: data.birth_date || undefined,
        cpf: data.cpf || undefined,
        how_met: data.how_met || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-list"] })
      queryClient.invalidateQueries({ queryKey: ["clientes"] })
      toast({ title: "Cliente criado com sucesso!" })
      handleCloseDrawer()
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormErro(typeof detail === "string" ? detail : "Erro ao salvar cliente.")
    },
  })

  const editarMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteForm }) =>
      api.patch<Cliente>(`/clients/${id}`, {
        ...data,
        email: data.email || undefined,
        birth_date: data.birth_date || undefined,
        cpf: data.cpf || undefined,
        how_met: data.how_met || undefined,
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-list"] })
      queryClient.invalidateQueries({ queryKey: ["clientes"] })
      toast({ title: "Cliente atualizado!" })
      handleCloseDrawer()
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormErro(typeof detail === "string" ? detail : "Erro ao salvar cliente.")
    },
  })

  const deletarMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/clients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes-list"] })
      queryClient.invalidateQueries({ queryKey: ["clientes"] })
      toast({ title: "Cliente removido." })
      setDeletando(null)
    },
  })

  function handleOpenCreate() {
    setEditando(null)
    reset(EMPTY_FORM)
    setFormErro("")
    setOpenDrawer(true)
  }

  function handleOpenEdit(c: Cliente) {
    setEditando(c)
    reset({
      name: c.name,
      phone: c.phone,
      email: c.email ?? "",
      birth_date: c.birth_date ?? "",
      cpf: c.cpf ?? "",
      how_met: c.how_met ?? "",
      notes: c.notes ?? "",
    })
    setFormErro("")
    setOpenDrawer(true)
  }

  function handleCloseDrawer() {
    setOpenDrawer(false)
    setEditando(null)
    setFormErro("")
    reset(EMPTY_FORM)
  }

  function onSubmit(data: ClienteForm) {
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
        <h1 className="text-xl font-bold tracking-tight">Clientes</h1>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Novo cliente
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, telefone ou email..."
          className="pl-9"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Skeleton preset="lista" lines={4} />
      ) : !clientes?.length ? (
        <EstadoVazio
          variant={debouncedBusca ? "default" : "clientes"}
          titulo={debouncedBusca ? "Nenhum resultado encontrado" : undefined}
          descricao={debouncedBusca ? "Tente buscar por outro termo" : undefined}
          acaoPrimaria={!debouncedBusca ? { label: "Novo cliente", onClick: handleOpenCreate } : undefined}
        />
      ) : (
        <TabelaOuCards
          dados={clientes}
          colunas={COLUNAS}
          keyExtractor={(c) => c.id}
          cardPrincipal={(c) => (
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm">{c.name}</span>
              <Badge variant={c.is_active ? "success" : "secondary"} className="text-[11px]">
                {c.is_active ? "Ativo" : "Inativo"}
              </Badge>
            </div>
          )}
          cardSecundario={(c) => (
            <>
              {formatarTelefone(c.phone)}
              {c.email ? ` · ${c.email}` : ""}
            </>
          )}
          cardLateral={(c) => (
            <div className="text-right shrink-0">
              <p className="text-xs font-medium">{c.visit_count} visitas</p>
              <p className="text-xs text-muted-foreground">{formatarMoeda(c.total_spent)}</p>
            </div>
          )}
          acoes={(c) => (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => { e.stopPropagation(); handleOpenEdit(c) }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); setDeletando(c) }}
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
        titulo={editando ? "Editar cliente" : "Novo cliente"}
        onSalvar={() => handleSubmit(onSubmit)()}
        textoBotaoSalvar={editando ? "Salvar" : "Criar cliente"}
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
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" placeholder="Nome completo" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefone *</Label>
              <Input id="phone" placeholder="(11) 99999-9999" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="email@exemplo.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birth_date">Data de nascimento</Label>
              <Input id="birth_date" type="date" {...register("birth_date")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" placeholder="000.000.000-00" {...register("cpf")} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="how_met">Como nos conheceu</Label>
              <Input
                id="how_met"
                placeholder="Instagram, indicação, passou na rua..."
                {...register("how_met")}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Observações sobre o cliente..."
                rows={2}
                {...register("notes")}
              />
            </div>
          </div>
        </div>
      </DrawerFormulario>

      <ModalConfirmacao
        open={!!deletando}
        onClose={() => setDeletando(null)}
        onConfirmar={() => deletando && deletarMutation.mutate(deletando.id)}
        titulo="Remover cliente"
        descricao={`Tem certeza que deseja remover ${deletando?.name}? Esta ação desativa o cliente no sistema.`}
        variante="destructive"
        carregando={deletarMutation.isPending}
        textoBotaoConfirmar="Remover"
      />
    </div>
  )
}
