import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate } from "react-router-dom"
import { Loader2, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"
import type { TokenOutput } from "@/types"

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
]

const schema = z.object({
  nome_salao: z.string().min(2, "Mínimo 2 caracteres").max(200),
  telefone_salao: z.string().min(8, "Telefone inválido").max(20),
  cidade: z.string().min(2, "Cidade obrigatória").max(100),
  estado: z.string().length(2, "Selecione o estado"),
  endereco_salao: z.string().max(500).optional().default(""),
  email_salao: z.string().email("Email inválido").optional().or(z.literal("")),
  nome_owner: z.string().min(2, "Mínimo 2 caracteres").max(200),
  email_owner: z.string().email("Email inválido"),
  senha: z.string().min(8, "Mínimo 8 caracteres"),
  confirmar_senha: z.string(),
}).refine((d) => d.senha === d.confirmar_senha, {
  message: "As senhas não conferem",
  path: ["confirmar_senha"],
})

type FormData = z.infer<typeof schema>

const STEP1_FIELDS: (keyof FormData)[] = ["nome_salao", "telefone_salao", "cidade", "estado"]

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setTokens, setUsuario } = useAuthStore()
  const [step, setStep] = useState(1)
  const [erro, setErro] = useState("")
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function avancarStep() {
    const ok = await trigger(STEP1_FIELDS)
    if (ok) setStep(2)
  }

  async function onSubmit(data: FormData) {
    setErro("")
    try {
      const payload = { ...data, email_salao: data.email_salao || undefined }
      const res = await api.post<TokenOutput>("/auth/register", payload)
      setTokens(res.data.access_token, res.data.refresh_token)
      setUsuario(res.data.usuario)
      navigate("/dashboard")
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail
      setErro(typeof detail === "string" ? detail : "Erro ao criar conta. Tente novamente.")
    }
  }

  return (
    <div className="fade-in-up space-y-6">
      {/* Header */}
      <div>
        <div className="flex gap-1.5 mb-5">
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
          <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">
          {step === 1 ? "Dados do Salão" : "Dados do Proprietário"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 1
            ? "Passo 1 de 2 — informações do salão"
            : "Passo 2 de 2 — sua conta de acesso"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="nome_salao">Nome do Salão *</Label>
              <Input id="nome_salao" placeholder="Ex: Salão Bella Vita" {...register("nome_salao")} />
              {errors.nome_salao && <p className="text-xs text-destructive">{errors.nome_salao.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="telefone_salao">Telefone *</Label>
                <Input id="telefone_salao" placeholder="(11) 99999-9999" {...register("telefone_salao")} />
                {errors.telefone_salao && <p className="text-xs text-destructive">{errors.telefone_salao.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Estado *</Label>
                <Select onValueChange={(v) => setValue("estado", v, { shouldValidate: true })}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.estado && <p className="text-xs text-destructive">{errors.estado.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade *</Label>
              <Input id="cidade" placeholder="São Paulo" {...register("cidade")} />
              {errors.cidade && <p className="text-xs text-destructive">{errors.cidade.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endereco_salao">Endereço</Label>
              <Input id="endereco_salao" placeholder="Rua das Flores, 123" {...register("endereco_salao")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email_salao">Email do Salão (opcional)</Label>
              <Input id="email_salao" type="email" placeholder="contato@salao.com" {...register("email_salao")} />
              {errors.email_salao && <p className="text-xs text-destructive">{errors.email_salao.message}</p>}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="nome_owner">Seu Nome *</Label>
              <Input id="nome_owner" placeholder="Maria Silva" {...register("nome_owner")} />
              {errors.nome_owner && <p className="text-xs text-destructive">{errors.nome_owner.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email_owner">Seu Email *</Label>
              <Input id="email_owner" type="email" placeholder="seu@email.com" autoComplete="email" {...register("email_owner")} />
              {errors.email_owner && <p className="text-xs text-destructive">{errors.email_owner.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha *</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={verSenha ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register("senha")}
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {verSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.senha && <p className="text-xs text-destructive">{errors.senha.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmar_senha">Confirmar Senha *</Label>
              <div className="relative">
                <Input
                  id="confirmar_senha"
                  type={verConfirmar ? "text" : "password"}
                  placeholder="Repita a senha"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register("confirmar_senha")}
                />
                <button
                  type="button"
                  onClick={() => setVerConfirmar((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {verConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmar_senha && <p className="text-xs text-destructive">{errors.confirmar_senha.message}</p>}
            </div>
          </>
        )}

        {step === 1 ? (
          <Button type="button" className="w-full" onClick={avancarStep}>
            Próximo <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar conta
            </Button>
          </div>
        )}
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Já tem conta?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Entrar
        </Link>
      </p>
    </div>
  )
}
