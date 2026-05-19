import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { CidadeCombobox } from "@/components/ui/cidade-combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useCep } from "@/hooks/useCep"
import api from "@/lib/api"
import { formatarTelefone } from "@/lib/utils"
import type { Salao } from "@/types"

const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
]

const DIAS_SEMANA = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
]

const salaoSchema = z.object({
  name: z.string().min(2, "Mínimo 2 caracteres"),
  phone: z.string().min(8, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  street: z.string().optional(),
  number: z.string().optional(),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "Selecione o estado"),
  opening_time: z.string().min(1, "Obrigatório"),
  closing_time: z.string().min(1, "Obrigatório"),
  slot_duration_minutes: z.coerce.number().int().min(5, "Mínimo 5 min"),
  working_days: z.array(z.number()),
  allow_online_booking: z.boolean(),
})
type SalaoForm = z.infer<typeof salaoSchema>

const senhaSchema = z
  .object({
    senha_atual: z.string().min(1, "Informe a senha atual"),
    nova_senha: z.string().min(8, "Mínimo 8 caracteres"),
    confirmar_nova_senha: z.string(),
  })
  .refine((d) => d.nova_senha === d.confirmar_nova_senha, {
    message: "As senhas não conferem",
    path: ["confirmar_nova_senha"],
  })
type SenhaForm = z.infer<typeof senhaSchema>

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [verAtual, setVerAtual] = useState(false)
  const [verNova, setVerNova] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [senhaErro, setSenhaErro] = useState("")
  const [cep, setCep] = useState("")
  const { buscarCep, loading: loadingCep } = useCep()

  const { data: salao, isLoading } = useQuery({
    queryKey: ["salon-me"],
    queryFn: async () => {
      const res = await api.get<Salao>("/salon/me")
      return res.data
    },
  })

  const salaoForm = useForm<SalaoForm>({
    resolver: zodResolver(salaoSchema),
    values: salao
      ? {
          name: salao.name,
          phone: salao.phone,
          email: salao.email ?? "",
          street: salao.address ?? "",
          number: "",
          city: salao.city,
          state: salao.state,
          opening_time: salao.opening_time.slice(0, 5),
          closing_time: salao.closing_time.slice(0, 5),
          slot_duration_minutes: salao.slot_duration_minutes,
          working_days: salao.working_days,
          allow_online_booking: salao.allow_online_booking,
        }
      : undefined,
  })

  const senhaForm = useForm<SenhaForm>({
    resolver: zodResolver(senhaSchema),
    defaultValues: { senha_atual: "", nova_senha: "", confirmar_nova_senha: "" },
  })

  const salaoMutation = useMutation({
    mutationFn: (data: SalaoForm) =>
      api.patch<Salao>("/salon/me", {
        ...data,
        email: data.email || undefined,
        address: [data.street, data.number].filter(Boolean).join(", ") || undefined,
        opening_time: data.opening_time + ":00",
        closing_time: data.closing_time + ":00",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salon-me"] })
      toast({ title: "Dados atualizados!" })
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      toast({
        title: "Erro ao salvar",
        description: typeof detail === "string" ? detail : "Verifique os dados e tente novamente.",
        variant: "destructive",
      })
    },
  })

  const senhaMutation = useMutation({
    mutationFn: (data: SenhaForm) =>
      api.post("/users/me/change-password", {
        senha_atual: data.senha_atual,
        nova_senha: data.nova_senha,
      }),
    onSuccess: () => {
      toast({ title: "Senha alterada com sucesso!" })
      senhaForm.reset()
      setSenhaErro("")
    },
    onError: (e: unknown) => {
      const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setSenhaErro(typeof detail === "string" ? detail : "Erro ao alterar senha.")
    },
  })

  return (
    <div className="fade-in-up p-4 sm:p-6 space-y-5">
      <h1 className="text-xl font-bold tracking-tight">Configurações</h1>

      <Tabs defaultValue="salao">
        <TabsList>
          <TabsTrigger value="salao">Dados do salão</TabsTrigger>
          <TabsTrigger value="seguranca">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="salao" className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <form onSubmit={salaoForm.handleSubmit((data) => salaoMutation.mutate(data))}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações do salão</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Nome do Salão:*</Label>
                      <Input placeholder="Nome do seu salão" {...salaoForm.register("name")} />
                      {salaoForm.formState.errors.name && (
                        <p className="text-xs text-destructive">
                          {salaoForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Telefone:*</Label>
                      <Input
                        placeholder="(11) 99999-9999"
                        {...salaoForm.register("phone")}
                        onChange={(e) => {
                          const formatted = formatarTelefone(e.target.value)
                          salaoForm.setValue("phone", formatted, { shouldValidate: true, shouldDirty: true })
                        }}
                      />
                      {salaoForm.formState.errors.phone && (
                        <p className="text-xs text-destructive">
                          {salaoForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email:</Label>
                      <Input type="email" placeholder="contato@salao.com" {...salaoForm.register("email")} />
                      {salaoForm.formState.errors.email && (
                        <p className="text-xs text-destructive">
                          {salaoForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>CEP:</Label>
                      <div className="relative">
                        <Input
                          value={cep}
                          maxLength={9}
                          placeholder="00000-000"
                          onChange={async (e) => {
                            const raw = e.target.value.replace(/\D/g, "").slice(0, 8)
                            const masked = raw.length > 5 ? `${raw.slice(0, 5)}-${raw.slice(5)}` : raw
                            setCep(masked)
                            if (raw.length === 8) {
                              const data = await buscarCep(raw)
                              if (data) {
                                salaoForm.setValue("street", data.logradouro)
                                salaoForm.setValue("state", data.uf)
                                salaoForm.setValue("city", data.localidade)
                              }
                            }
                          }}
                        />
                        {loadingCep && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Rua:</Label>
                      <Input placeholder="Rua das Flores" {...salaoForm.register("street")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Número:</Label>
                      <Input placeholder="123" {...salaoForm.register("number")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Estado:*</Label>
                      <Controller
                        name="state"
                        control={salaoForm.control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={(v) => {
                            field.onChange(v)
                            salaoForm.setValue("city", "")
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="UF" />
                            </SelectTrigger>
                            <SelectContent>
                              {ESTADOS_BR.map((uf) => (
                                <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {salaoForm.formState.errors.state && (
                        <p className="text-xs text-destructive">
                          {salaoForm.formState.errors.state.message}
                        </p>
                      )}
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label>Cidade:*</Label>
                      <Controller
                        name="city"
                        control={salaoForm.control}
                        render={({ field }) => (
                          <CidadeCombobox
                            uf={salaoForm.watch("state") ?? ""}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      {salaoForm.formState.errors.city && (
                        <p className="text-xs text-destructive">
                          {salaoForm.formState.errors.city.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Abertura:*</Label>
                      <Input type="time" {...salaoForm.register("opening_time")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Fechamento:*</Label>
                      <Input type="time" {...salaoForm.register("closing_time")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Intervalo de agendamento (min):*</Label>
                      <Input
                        type="number"
                        min="5"
                        max="120"
                        step="5"
                        placeholder="30"
                        {...salaoForm.register("slot_duration_minutes")}
                      />
                      {salaoForm.formState.errors.slot_duration_minutes && (
                        <p className="text-xs text-destructive">
                          {salaoForm.formState.errors.slot_duration_minutes.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Dias de funcionamento</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {DIAS_SEMANA.map((dia) => (
                        <Controller
                          key={dia.value}
                          name="working_days"
                          control={salaoForm.control}
                          render={({ field }) => {
                            const checked = (field.value ?? []).includes(dia.value)
                            return (
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`dia-${dia.value}`}
                                  checked={checked}
                                  onCheckedChange={(v) => {
                                    const current = field.value ?? []
                                    field.onChange(
                                      v
                                        ? [...current, dia.value]
                                        : current.filter((d) => d !== dia.value)
                                    )
                                  }}
                                />
                                <Label
                                  htmlFor={`dia-${dia.value}`}
                                  className="font-normal cursor-pointer"
                                >
                                  {dia.label}
                                </Label>
                              </div>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <Controller
                    name="allow_online_booking"
                    control={salaoForm.control}
                    render={({ field }) => (
                      <div className="flex items-center gap-3">
                        <Switch
                          id="online-booking"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="online-booking" className="cursor-pointer">
                          Permitir agendamento online
                        </Label>
                      </div>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={salaoMutation.isPending}>
                      {salaoMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Salvar alterações
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          )}
        </TabsContent>

        <TabsContent value="seguranca" className="mt-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">Alterar senha</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={senhaForm.handleSubmit((data) => senhaMutation.mutate(data))}
                className="space-y-4"
              >
                {senhaErro && (
                  <Alert variant="destructive">
                    <AlertDescription>{senhaErro}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="senha-atual">Senha atual:*</Label>
                  <div className="relative">
                    <Input
                      id="senha-atual"
                      type={verAtual ? "text" : "password"}
                      placeholder="Senha atual"
                      {...senhaForm.register("senha_atual")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setVerAtual(!verAtual)}
                    >
                      {verAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {senhaForm.formState.errors.senha_atual && (
                    <p className="text-xs text-destructive">
                      {senhaForm.formState.errors.senha_atual.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nova-senha">Nova senha:*</Label>
                  <div className="relative">
                    <Input
                      id="nova-senha"
                      type={verNova ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      {...senhaForm.register("nova_senha")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setVerNova(!verNova)}
                    >
                      {verNova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {senhaForm.formState.errors.nova_senha && (
                    <p className="text-xs text-destructive">
                      {senhaForm.formState.errors.nova_senha.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmar-nova-senha">Confirmar nova senha:*</Label>
                  <div className="relative">
                    <Input
                      id="confirmar-nova-senha"
                      type={verConfirmar ? "text" : "password"}
                      placeholder="Repita a nova senha"
                      {...senhaForm.register("confirmar_nova_senha")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setVerConfirmar(!verConfirmar)}
                    >
                      {verConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {senhaForm.formState.errors.confirmar_nova_senha && (
                    <p className="text-xs text-destructive">
                      {senhaForm.formState.errors.confirmar_nova_senha.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={senhaMutation.isPending}>
                    {senhaMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Alterar senha
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
