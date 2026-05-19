import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Link } from "react-router-dom"
import { Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import api from "@/lib/api"

const schema = z.object({
  email: z.string().email("Email inválido"),
})
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [erro, setErro] = useState("")
  const [enviado, setEnviado] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setErro("")
    try {
      await api.post("/auth/forgot-password", { email: data.email })
      setEnviado(true)
    } catch (e: unknown) {
      const detail = (e as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail
      setErro(typeof detail === "string" ? detail : "Erro ao enviar email. Tente novamente.")
    }
  }

  if (enviado) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <MailCheck className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email enviado!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Verifique sua caixa de entrada e siga as instruções para recuperar sua senha.
          </p>
        </div>
        <Link to="/login" className="text-sm text-primary hover:underline font-medium">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="fade-in-up space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Recuperar senha</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Informe seu email e enviaremos instruções para redefinir sua senha
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enviar instruções
        </Button>
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Lembrou a senha?{" "}
        <Link to="/login" className="text-primary hover:underline font-medium">
          Entrar
        </Link>
      </p>
    </div>
  )
}
