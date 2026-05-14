import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CalendarDays, Users, TrendingUp, Star, List, Inbox,
} from "lucide-react"

type EstadoVazioVariant =
  | "agenda"
  | "clientes"
  | "transacoes"
  | "profissionais"
  | "servicos"
  | "default"

interface EstadoVazioProps {
  variant?: EstadoVazioVariant
  titulo?: string
  descricao?: string
  acaoPrimaria?: { label: string; onClick: () => void }
  className?: string
}

const CONFIG: Record<EstadoVazioVariant, {
  icon: React.ElementType
  titulo: string
  descricao: string
}> = {
  agenda: {
    icon: CalendarDays,
    titulo: "Nenhum agendamento",
    descricao: "Não há agendamentos para este dia.",
  },
  clientes: {
    icon: Users,
    titulo: "Nenhum cliente encontrado",
    descricao: "Adicione clientes para começar a gerenciar atendimentos.",
  },
  transacoes: {
    icon: TrendingUp,
    titulo: "Nenhuma transação",
    descricao: "As movimentações financeiras aparecerão aqui.",
  },
  profissionais: {
    icon: Star,
    titulo: "Nenhum profissional",
    descricao: "Cadastre profissionais para organizar sua equipe.",
  },
  servicos: {
    icon: List,
    titulo: "Nenhum serviço",
    descricao: "Crie serviços para começar a receber agendamentos.",
  },
  default: {
    icon: Inbox,
    titulo: "Nada por aqui",
    descricao: "Não há dados para exibir no momento.",
  },
}

export function EstadoVazio({
  variant = "default",
  titulo,
  descricao,
  acaoPrimaria,
  className,
}: EstadoVazioProps) {
  const cfg = CONFIG[variant]
  const Icon = cfg.icon
  const textoTitulo = titulo ?? cfg.titulo
  const textoDesc = descricao ?? cfg.descricao

  return (
    <div
      className={cn(
        "fade-in-up flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <p className="text-md font-medium text-foreground">{textoTitulo}</p>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">{textoDesc}</p>
      {acaoPrimaria && (
        <Button
          size="sm"
          className="mt-5"
          onClick={acaoPrimaria.onClick}
        >
          {acaoPrimaria.label}
        </Button>
      )}
    </div>
  )
}
