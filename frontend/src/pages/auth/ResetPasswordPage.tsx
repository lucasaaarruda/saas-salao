import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import api from "@/lib/api"

const schema = z.object({
  nova_senha: z.string().min(8, "Mínimo 8 caracteres"),
  confirmar_senha: z.string(),
}).refine((d) => d.nova_senha === d.confirmar_senha, {
  message: "As senhas não conferem",
  path: ["confirmar_senha"],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [erro, setErro] = useState("")
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Link inválido</h2>
          <p className="text-sm text-muted-foreground mt-2">
            O link de recuperação de senha é inválido ou expirou.
          </p>
        </div>
        <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">
          Solicitar novo link
        </Link>
      </div>
    )
  }

  async function onSubmit(data: FormData) {
    setErro("")
    try {
      await api.post("/auth/reset-password", { token, nova_senha: data.nova_senha })
      navigate("/login", { state: { sucesso: "Senha redefinida com sucesso! Faça login." } })
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail
      setErro(typeof detail === "string" ? detail : "Erro ao redefinir senha. O link pode ter expirado.")
    }
  }

  return (
    <div className="fade-in-up space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Redefinir senha</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha uma nova senha para sua conta
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {erro && (
          <Alert variant="destructive">
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="nova_senha">Nova senha:*</Label>
          <div className="relative">
            <Input
              id="nova_senha"
              type={verSenha ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              className="pr-10"
              {...register("nova_senha")}
            />
            <button
              type="button"
              onClick={() => setVerSenha((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {verSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.nova_senha && (
            <p className="text-xs text-destructive">{errors.nova_senha.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmar_senha">Confirmar nova senha:*</Label>
          <div className="relative">
            <Input
              id="confirmar_senha"
              type={verConfirmar ? "text" : "password"}
              placeholder="Repita a nova senha"
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
          {errors.confirmar_senha && (
            <p className="text-xs text-destructive">{errors.confirmar_senha.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Redefinir senha
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        <Link to="/login" className="text-primary hover:underline font-medium">
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}
