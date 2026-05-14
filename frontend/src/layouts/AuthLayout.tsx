import { Outlet, Navigate } from "react-router-dom"
import { Check } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

const FEATURES = [
  "Agenda integrada com status em tempo real",
  "Controle financeiro completo",
  "Gestão de clientes e equipe",
]

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand (desktop only) */}
      <div className="hidden lg:flex lg:w-[45%] bg-sidebar flex-col justify-between p-12 shrink-0">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary shrink-0">
              <span className="font-bold text-white text-lg leading-none select-none">
                S
              </span>
            </div>
            <span className="font-bold text-xl text-sidebar-accent-foreground tracking-tight">
              Salão App
            </span>
          </div>

          {/* Tagline */}
          <div className="mt-16">
            <h1 className="font-bold text-3xl text-sidebar-accent-foreground leading-snug">
              Gestão inteligente<br />para o seu salão
            </h1>
            <p className="text-sidebar-foreground mt-4 text-[15px] leading-relaxed">
              Organize agendamentos, controle finanças e gerencie sua equipe em um só lugar.
            </p>
          </div>

          {/* Features */}
          <ul className="mt-10 space-y-3.5">
            {FEATURES.map((feat) => (
              <li key={feat} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span className="text-sm text-sidebar-foreground">{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-sidebar-foreground/40">
          © {new Date().getFullYear()} Salão App. Todos os direitos reservados.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background min-h-screen">
        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 mb-8 lg:hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary shrink-0">
            <span className="font-bold text-white text-base leading-none select-none">
              S
            </span>
          </div>
          <span className="font-bold text-xl text-foreground tracking-tight">
            Salão App
          </span>
        </div>

        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
