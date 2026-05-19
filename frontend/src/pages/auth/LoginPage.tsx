import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"
import type { TokenOutput } from "@/types"

const schema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(1, "Senha obrigatória"),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { setTokens, setUsuario } = useAuthStore()
  const [erro, setErro] = useState("")
  const [verSenha, setVerSenha] = useState(false)
  const sucesso = (location.state as { sucesso?: string } | null)?.sucesso ?? ""

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setErro("")
    try {
      const res = await api.post<TokenOutput>("/auth/login", {
        email: data.email,
        senha: data.senha,
      })
      setTokens(res.data.access_token, res.data.refresh_token)
      setUsuario(res.data.usuario)
      navigate("/dashboard")
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail
      setErro(msg ?? "Email ou senha incorretos")
    }
  }

  return (
    <div className="fade-in-up space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Acesse sua conta para gerenciar o salão
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {sucesso && (
          <Alert>
            <AlertDescription>{sucesso}</AlertDescription>
          </Alert>
        )}
        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email:</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="senha">Senha:</Label>
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative">
            <Input
              id="senha"
              type={verSenha ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
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
          {errors.senha && (
            <p className="text-xs text-destructive">{errors.senha.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Entrar
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Não tem conta?{" "}
        <Link to="/register" className="text-primary hover:underline font-medium">
          Cadastre seu salão
        </Link>
      </p>
    </div>
  )
}
