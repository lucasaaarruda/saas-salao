import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "motion/react"
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ModalConfirmacaoProps {
  open: boolean
  onClose: () => void
  onConfirmar: () => void
  titulo: string
  descricao?: string
  variante?: "default" | "destructive"
  carregando?: boolean
  textoBotaoConfirmar?: string
}

export function ModalConfirmacao({
  open,
  onClose,
  onConfirmar,
  titulo,
  descricao,
  variante = "default",
  carregando = false,
  textoBotaoConfirmar,
}: ModalConfirmacaoProps) {
  const isDestructive = variante === "destructive"
  const textoConfirmar = textoBotaoConfirmar ?? (isDestructive ? "Confirmar" : "Confirmar")

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2",
              "bg-card border border-border rounded-lg shadow-modal p-6"
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Ícone */}
            <div className="flex justify-center mb-4">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full",
                  isDestructive ? "bg-red-500/15" : "bg-primary/15"
                )}
              >
                {isDestructive ? (
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-primary" />
                )}
              </div>
            </div>

            {/* Texto */}
            <p className="text-center text-md font-semibold text-foreground">{titulo}</p>
            {descricao && (
              <p className="mt-2 text-center text-sm text-muted-foreground">{descricao}</p>
            )}

            {/* Botões */}
            <div className="mt-6 flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={carregando}
              >
                Cancelar
              </Button>
              <Button
                variant={isDestructive ? "destructive" : "default"}
                className="flex-1"
                onClick={onConfirmar}
                disabled={carregando}
              >
                {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {textoConfirmar}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
