import { useState } from "react"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClienteAuthStore } from "@/store/clienteAuthStore"
import { loginCliente, registrarCliente } from "@/api/booking"
import { formatarCpf, validarCpf } from "@/lib/utils"
import type { ClientePublico } from "@/types"

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
})
type LoginData = z.infer<typeof loginSchema>

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  phone: z.string().min(8, "Telefone inválido").max(20),
  cpf: z.string().min(1, "CPF obrigatório").refine(validarCpf, "CPF inválido"),
  birth_date: z.string().optional(),
})
type RegisterData = z.infer<typeof registerSchema>

export default function BookingAuthPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get("next") ?? "agendar"
  const { setAuth } = useClienteAuthStore()

  function onSuccess(access: string, refresh: string, cliente: ClientePublico) {
    setAuth(access, refresh, cliente, slug!)
    navigate(`/booking/${slug}/${next}`, { replace: true })
  }

  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Acesse sua conta</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Entre ou crie sua conta para realizar agendamentos
        </p>
      </div>

      <Tabs defaultValue="login">
        <TabsList className="w-full">
          <TabsTrigger value="login" className="flex-1">
            Entrar
          </TabsTrigger>
          <TabsTrigger value="cadastro" className="flex-1">
            Cadastrar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login">
          <LoginForm slug={slug!} onSuccess={onSuccess} />
        </TabsContent>
        <TabsContent value="cadastro">
          <RegisterForm slug={slug!} onSuccess={onSuccess} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LoginForm({
  slug,
  onSuccess,
}: {
  slug: string
  onSuccess: (a: string, r: string, c: ClientePublico) => void
}) {
  const [erro, setErro] = useState("")
  const [verSenha, setVerSenha] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginData) {
    setErro("")
    try {
      const res = await loginCliente(slug, { email: data.email, password: data.password })
      onSuccess(res.access_token, res.refresh_token, res.cliente)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setErro(typeof msg === "string" ? msg : "Email ou senha incorretos")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label>Email:</Label>
        <Input type="email" placeholder="seu@email.com" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Senha:</Label>
        <div className="relative">
          <Input
            type={verSenha ? "text" : "password"}
            placeholder="••••••••"
            className="pr-10"
            autoComplete="current-password"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setVerSenha((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {verSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Entrar
      </Button>
    </form>
  )
}

function RegisterForm({
  slug,
  onSuccess,
}: {
  slug: string
  onSuccess: (a: string, r: string, c: ClientePublico) => void
}) {
  const [erro, setErro] = useState("")
  const [verSenha, setVerSenha] = useState(false)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterData>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterData) {
    setErro("")
    try {
      const res = await registrarCliente(slug, {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        cpf: data.cpf,
        birth_date: data.birth_date || undefined,
      })
      onSuccess(res.access_token, res.refresh_token, res.cliente)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setErro(typeof msg === "string" ? msg : "Erro ao criar conta. Verifique os dados.")
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
      {erro && (
        <Alert variant="destructive">
          <AlertDescription>{erro}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1.5">
        <Label>Nome completo:</Label>
        <Input placeholder="Seu nome" autoComplete="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Email:</Label>
        <Input type="email" placeholder="seu@email.com" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Senha:</Label>
        <div className="relative">
          <Input
            type={verSenha ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            className="pr-10"
            autoComplete="new-password"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setVerSenha((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {verSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Telefone:</Label>
          <Input placeholder="(11) 99999-9999" autoComplete="tel" {...register("phone")} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>CPF:</Label>
          <Input
            placeholder="000.000.000-00"
            maxLength={14}
            {...register("cpf")}
            onChange={(e) => {
              const formatted = formatarCpf(e.target.value)
              setValue("cpf", formatted, { shouldValidate: true, shouldDirty: true })
            }}
          />
          {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Data de nascimento:</Label>
        <Input type="date" {...register("birth_date")} />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Criar conta
      </Button>
    </form>
  )
}
