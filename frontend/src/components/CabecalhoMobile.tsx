import { useLocation, useNavigate } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { cn } from "@/lib/utils"

const TITULOS: Record<string, string> = {
  "/dashboard":     "Dashboard",
  "/agenda":        "Agenda",
  "/clientes":      "Clientes",
  "/profissionais": "Profissionais",
  "/servicos":      "Serviços",
  "/financeiro":    "Financeiro",
  "/relatorios":    "Relatórios",
  "/configuracoes": "Configurações",
}

interface CabecalhoMobileProps {
  className?: string
  acaoDireita?: React.ReactNode
}

export function CabecalhoMobile({ className, acaoDireita }: CabecalhoMobileProps) {
  const location = useLocation()
  const navigate = useNavigate()

  const partes = location.pathname.split("/").filter(Boolean)
  const isRaiz = partes.length <= 1
  const titulo = TITULOS["/" + partes[0]] ?? "Salão App"

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center h-[52px] px-4 gap-3",
        "bg-background border-b border-border shrink-0",
        className
      )}
    >
      {/* Botão voltar (só em rotas filhas) */}
      {!isRaiz && (
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-11 h-11 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
          aria-label="Voltar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {/* Título centralizado */}
      <p
        className={cn(
          "flex-1 text-base font-semibold text-foreground text-center leading-none",
          !isRaiz && "text-left"
        )}
      >
        {titulo}
      </p>

      {/* Slot direita */}
      <div className="flex items-center">
        {acaoDireita ?? <div className="w-8" />}
      </div>
    </header>
  )
}
