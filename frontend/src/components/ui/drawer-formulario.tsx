import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768
  )
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])
  return isDesktop
}

interface DrawerFormularioProps {
  open: boolean
  onClose: () => void
  titulo: string
  children: ReactNode
  onSalvar?: () => void
  textoBotaoSalvar?: string
  carregando?: boolean
  rodape?: ReactNode
}

const EASE = [0.32, 0.72, 0, 1] as const

export function DrawerFormulario({
  open,
  onClose,
  titulo,
  children,
  onSalvar,
  textoBotaoSalvar = "Salvar",
  carregando = false,
  rodape,
}: DrawerFormularioProps) {
  const isDesktop = useIsDesktop()

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  const panelVariants = isDesktop
    ? {
        hidden:  { x: "100%", opacity: 0 },
        visible: { x: 0, opacity: 1 },
        exit:    { x: "100%", opacity: 0 },
      }
    : {
        hidden:  { y: "100%", opacity: 0 },
        visible: { y: 0, opacity: 1 },
        exit:    { y: "100%", opacity: 0 },
      }

  const panelClass = isDesktop
    ? "fixed inset-y-0 right-0 w-full max-w-md flex flex-col bg-card border-l border-border"
    : "fixed inset-x-0 bottom-0 flex flex-col bg-card border-t border-border rounded-t-xl max-h-[92dvh]"

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            className={cn(panelClass, "z-50")}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: isDesktop ? 0.2 : 0.25, ease: EASE }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <h2 className="text-md font-semibold text-foreground">{titulo}</h2>
              <button
                onClick={onClose}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {children}
            </div>

            {/* Rodapé */}
            <div className="shrink-0 border-t border-border px-5 py-4">
              {rodape ?? (
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" onClick={onClose} disabled={carregando}>
                    Cancelar
                  </Button>
                  {onSalvar && (
                    <Button onClick={onSalvar} disabled={carregando}>
                      {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {textoBotaoSalvar}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
