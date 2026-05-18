import { useState } from "react"
import { CalendarDays, RefreshCw, Clock, ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  onClose: () => void
}

const PASSOS = [
  {
    Icone: CalendarDays,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    titulo: "Bem-vindo ao agendamento online!",
    descricao: "Agende serviços de forma rápida e fácil, direto pelo celular. Veja como funciona.",
    lista: null as string[] | null,
  },
  {
    Icone: CalendarDays,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    titulo: "Como agendar um serviço",
    descricao: null as string | null,
    lista: [
      'Toque em "Agendar um serviço"',
      "Escolha o serviço desejado",
      "Escolha o profissional",
      "Selecione a data e o horário disponível",
      "Confirme — pronto!",
    ],
  },
  {
    Icone: RefreshCw,
    iconColor: "text-primary",
    iconBg: "bg-primary/10",
    titulo: "Reagendar ou cancelar",
    descricao:
      'Acesse "Meus agendamentos" para reagendar ou cancelar um horário marcado a qualquer momento.',
    lista: null,
  },
  {
    Icone: Clock,
    iconColor: "text-yellow-500",
    iconBg: "bg-yellow-500/10",
    titulo: "Regra das 24 horas",
    descricao:
      "Cancelamentos e reagendamentos só são permitidos com mais de 24 horas de antecedência. Fique de olho no prazo!",
    lista: null,
  },
]

export default function OnboardingModal({ onClose }: Props) {
  const [passo, setPasso] = useState(0)
  const ultimo = passo === PASSOS.length - 1
  const { Icone, iconColor, iconBg, titulo, descricao, lista } = PASSOS[passo]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-modal animate-in fade-in slide-in-from-bottom-4 overflow-hidden">
        {/* Fechar */}
        <div className="flex justify-end px-4 pt-4">
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-accent transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-6 pb-2 space-y-4 text-center">
          <div
            className={`mx-auto h-16 w-16 rounded-2xl ${iconBg} flex items-center justify-center`}
          >
            <Icone className={`h-8 w-8 ${iconColor}`} />
          </div>

          <div>
            <h3 className="text-lg font-semibold leading-snug">{titulo}</h3>
            {descricao && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{descricao}</p>
            )}
            {lista && (
              <ol className="text-left mt-3 space-y-2">
                {lista.map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-semibold mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* Indicador de progresso */}
        <div className="flex justify-center gap-1.5 py-4">
          {PASSOS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === passo ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/25"
              }`}
            />
          ))}
        </div>

        {/* Navegação */}
        <div className="flex gap-2 px-6 pb-6">
          {passo > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasso((p) => p - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
          )}
          <Button
            className={passo === 0 ? "w-full" : "flex-1"}
            onClick={ultimo ? onClose : () => setPasso((p) => p + 1)}
          >
            {ultimo ? (
              "Entendido!"
            ) : (
              <>
                Próximo
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
