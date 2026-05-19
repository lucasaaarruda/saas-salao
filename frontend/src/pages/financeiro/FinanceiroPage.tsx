import { useState, useEffect, type ComponentType } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format, startOfMonth } from "date-fns"
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, CalendarDays } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DrawerFormulario } from "@/components/ui/drawer-formulario"
import { EstadoVazio } from "@/components/ui/estado-vazio"
import { DatePicker } from "@/components/ui/date-picker"
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
import { cn, formatarMoeda, formatarData, formatarMoedaInput } from "@/lib/utils"
import type { Transacao, ResumoFinanceiro } from "@/types"

const CATEGORIAS_RECEITA = ["Agendamento", "Venda produto", "Outros"]
const CATEGORIAS_DESPESA = ["Aluguel", "Utilidades", "Materiais", "Salários", "Marketing", "Manutenção", "Outros"]
const METODOS_PAGAMENTO = [
  { value: "pix", label: "Pix" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "cash", label: "Dinheiro" },
  { value: "bank_transfer", label: "Transferência" },
]

const transacaoSchema = z.object({
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Categoria obrigatória"),
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.preprocess(
    (v) => {
      if (typeof v !== "string") return v
      const parsed = parseFloat((v as string).replace(/\./g, "").replace(",", "."))
      return isNaN(parsed) ? undefined : parsed
    },
    z.number({ required_error: "Valor obrigatório", invalid_type_error: "Valor inválido" }).positive("Valor deve ser positivo")
  ),
  payment_method: z.string().min(1, "Método obrigatório"),
  transaction_date: z.string().min(1, "Data obrigatória"),
  notes: z.string().optional(),
})
type TransacaoForm = z.infer<typeof transacaoSchema>

const DEFAULT_FORM: Partial<TransacaoForm> = {
  type: "income",
  transaction_date: format(new Date(), "yyyy-MM-dd"),
  payment_method: "pix",
  amount: "" as unknown as number,
}

const COLUNAS: Coluna<Transacao>[] = [
  {
    chave: "date",
    cabecalho: "Data",
    render: (t) => formatarData(t.transaction_date + "T12:00:00"),
  },
  {
    chave: "type",
    cabecalho: "Tipo",
    render: (t) => (
      <Badge variant={t.type === "income" ? "success" : "destructive"}>
        {t.type === "income" ? "Receita" : "Despesa"}
      </Badge>
    ),
  },
  {
    chave: "category",
    cabecalho: "Categoria",
    render: (t) => t.category,
    ocultoMobile: true,
  },
  { chave: "description", cabecalho: "Descrição", render: (t) => t.description },
  {
    chave: "method",
    cabecalho: "Método",
    render: (t) =>
      METODOS_PAGAMENTO.find((m) => m.value === t.payment_method)?.label ?? t.payment_method,
    ocultoMobile: true,
  },
  {
    chave: "amount",
    cabecalho: "Valor",
    cabecalhoClassName: "text-right",
    className: "text-right",
    render: (t) => (
      <span
        className={cn(
          "font-semibold tabular-nums",
          t.type === "income" ? "text-emerald-400" : "text-red-400"
        )}
      >
        {t.type === "income" ? "+" : "−"}{formatarMoeda(t.amount)}
      </span>
    ),
  },
]

export default function FinanceiroPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"))
  const [dataFim, setDataFim] = useState(format(new Date(), "yyyy-MM-dd"))
  const [tipoFiltro, setTipoFiltro] = useState<"all" | "income" | "expense">("all")
  const [openDrawer, setOpenDrawer] = useState(false)
  const [deletando, setDeletando] = useState<Transacao | null>(null)
  const [formErro, setFormErro] = useState("")

  const queryParams = { data_inicio: dataInicio, data_fim: dataFim }

  const { data: transacoes, isLoading } = useQuery({
    queryKey: ["transacoes", dataInicio, dataFim],
    queryFn: async () => {
      const res = await api.get<Transacao[]>("/financial", { params: queryParams })
      return res.data
    },
  })

  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ["resumo-fin-page", dataInicio, dataFim],
    queryFn: async () => {
      const res = await api.get<ResumoFinanceiro>("/financial/resumo", { params: queryParams })
      return res.data
    },
  })

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } =
    useForm<TransacaoForm>({
      resolver: zodResolver(transacaoSchema),
      defaultValues: DEFAULT_FORM,
    })

  const watchedType = watch("type")
  const categorias = watchedType === "income" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA

  useEffect(() => {
    setValue("category", "")
  }, [watchedType, setValue])

  const criarMutation = useMutation({
    mutationFn: (data: TransacaoForm) =>
      api.post<Transacao>("/financial", { ...data, notes: data.notes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] })
      queryClient.invalidateQueries({ queryKey: ["resumo-fin-page"] })
      queryClient.invalidateQueries({ queryKey: ["resumo-financeiro"] })
      toast({ title: "Transação registrada!" })
      handleCloseDrawer()
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setFormErro(typeof detail === "string" ? detail : "Erro ao registrar transação.")
    },
  })

  const deletarMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/financial/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transacoes"] })
      queryClient.invalidateQueries({ queryKey: ["resumo-fin-page"] })
      queryClient.invalidateQueries({ queryKey: ["resumo-financeiro"] })
      toast({ title: "Transação removida." })
      setDeletando(null)
    },
  })

  const transacoesFiltradas = [...(transacoes ?? [])]
    .filter((t) => tipoFiltro === "all" || t.type === tipoFiltro)
    .sort((a, b) => b.transaction_date.localeCompare(a.transaction_date))

  function handleCloseDrawer() {
    setOpenDrawer(false)
    setFormErro("")
    reset(DEFAULT_FORM)
  }

  function onSubmit(data: TransacaoForm) {
    criarMutation.mutate(data)
  }

  const saldo = Number(resumo?.saldo ?? 0)

  return (
    <div className="fade-in-up p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight">Financeiro</h1>
        <Button onClick={() => setOpenDrawer(true)} size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Nova transação
        </Button>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <Label className="text-sm text-foreground">De:</Label>
        <DatePicker value={dataInicio} onChange={setDataInicio} />
        <Label className="text-sm text-foreground">Até:</Label>
        <DatePicker value={dataFim} onChange={setDataFim} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          title="Total receitas"
          value={loadingResumo ? null : formatarMoeda(resumo?.total_receitas ?? 0)}
          icon={TrendingUp}
          iconBg="bg-emerald-500/15"
          iconColor="text-emerald-400"
          valueClass="text-emerald-400"
        />
        <SummaryCard
          title="Total despesas"
          value={loadingResumo ? null : formatarMoeda(resumo?.total_despesas ?? 0)}
          icon={TrendingDown}
          iconBg="bg-red-500/15"
          iconColor="text-red-400"
          valueClass="text-red-400"
        />
        <SummaryCard
          title="Saldo do período"
          value={loadingResumo ? null : formatarMoeda(resumo?.saldo ?? 0)}
          icon={DollarSign}
          iconBg={saldo >= 0 ? "bg-emerald-500/15" : "bg-red-500/15"}
          iconColor={saldo >= 0 ? "text-emerald-400" : "text-red-400"}
          valueClass={saldo >= 0 ? "text-emerald-400" : "text-red-400"}
        />
        <SummaryCard
          title="Agendamentos pagos"
          value={loadingResumo ? null : String(resumo?.total_agendamentos_pagos ?? 0)}
          icon={CalendarDays}
          iconBg="bg-primary/10"
          iconColor="text-primary"
        />
      </div>

      {/* Transactions list */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">Transações</CardTitle>
            <Select
              value={tipoFiltro}
              onValueChange={(v) => setTipoFiltro(v as typeof tipoFiltro)}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-1">
          {isLoading ? (
            <div className="px-4 pb-4">
              <Skeleton preset="lista" lines={4} />
            </div>
          ) : !transacoesFiltradas.length ? (
            <EstadoVazio
              variant="transacoes"
              titulo="Nenhuma transação no período"
              descricao="Ajuste o período ou registre uma nova transação"
              acaoPrimaria={{ label: "Nova transação", onClick: () => setOpenDrawer(true) }}
            />
          ) : (
            <TabelaOuCards
              dados={transacoesFiltradas}
              colunas={COLUNAS}
              keyExtractor={(t) => t.id}
              cardPrincipal={(t) => (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm truncate">{t.description}</span>
                  <Badge
                    variant={t.type === "income" ? "success" : "destructive"}
                    className="text-[11px] shrink-0"
                  >
                    {t.type === "income" ? "Receita" : "Despesa"}
                  </Badge>
                </div>
              )}
              cardSecundario={(t) => (
                <>
                  {t.category} · {formatarData(t.transaction_date + "T12:00:00")}
                </>
              )}
              cardLateral={(t) => (
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    t.type === "income" ? "text-emerald-400" : "text-red-400"
                  )}
                >
                  {t.type === "income" ? "+" : "−"}{formatarMoeda(t.amount)}
                </span>
              )}
              acoes={(t) => (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setDeletando(t) }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Drawer */}
      <DrawerFormulario
        open={openDrawer}
        onClose={handleCloseDrawer}
        titulo="Nova transação"
        onSalvar={() => handleSubmit(onSubmit)()}
        textoBotaoSalvar="Registrar"
        carregando={criarMutation.isPending}
      >
        <div className="space-y-4">
          {formErro && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {formErro}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo:*</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Data:*</Label>
              <Controller
                name="transaction_date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    className="w-full"
                    placeholder="dd/mm/aaaa"
                  />
                )}
              />
              {errors.transaction_date && (
                <p className="text-xs text-destructive">{errors.transaction_date.message}</p>
              )}
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
                      {categorias.map((cat) => (
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
              <Label>Método de pagamento:*</Label>
              <Controller
                name="payment_method"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METODOS_PAGAMENTO.map((m) => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.payment_method && (
                <p className="text-xs text-destructive">{errors.payment_method.message}</p>
              )}
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="fin-desc">Descrição:*</Label>
              <Input id="fin-desc" placeholder="Ex: Corte de cabelo" {...register("description")} />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="amount">Valor (R$):*</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none select-none">R$</span>
                <Input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  className="pl-9"
                  {...register("amount")}
                  onChange={(e) => {
                    const formatted = formatarMoedaInput(e.target.value)
                    setValue("amount", formatted as unknown as number, { shouldValidate: true, shouldDirty: true })
                  }}
                />
              </div>
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="fin-notes">Observações:</Label>
              <Textarea id="fin-notes" placeholder="Observações..." rows={2} {...register("notes")} />
            </div>
          </div>
        </div>
      </DrawerFormulario>

      <ModalConfirmacao
        open={!!deletando}
        onClose={() => setDeletando(null)}
        onConfirmar={() => deletando && deletarMutation.mutate(deletando.id)}
        titulo="Remover transação"
        descricao={`Remover "${deletando?.description}"? Esta ação não pode ser desfeita.`}
        variante="destructive"
        carregando={deletarMutation.isPending}
        textoBotaoConfirmar="Remover"
      />
    </div>
  )
}

interface SummaryCardProps {
  title: string
  value: string | null
  icon: ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  valueClass?: string
}

function SummaryCard({ title, value, icon: Icon, iconBg, iconColor, valueClass }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider leading-none">
              {title}
            </p>
            <div className="pt-1">
              {value === null ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <p className={cn("text-xl font-bold tracking-tight leading-none", valueClass)}>
                  {value}
                </p>
              )}
            </div>
          </div>
          <div className={cn("flex items-center justify-center w-10 h-10 rounded-xl shrink-0 mt-0.5", iconBg)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
