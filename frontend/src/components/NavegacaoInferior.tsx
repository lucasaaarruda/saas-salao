import { useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import {
  LayoutDashboard, Calendar, Users, DollarSign,
  MoreHorizontal, Scissors, Briefcase, BarChart3, Settings, LogOut, X,
} from "lucide-react"
import { cn, iniciais } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/authStore"
import api from "@/lib/api"

const NAV_PRINCIPAL = [
  { to: "/dashboard",  icon: LayoutDashboard, label: "Painel"    },
  { to: "/agenda",     icon: Calendar,        label: "Agenda"    },
  { to: "/clientes",   icon: Users,           label: "Clientes"  },
  { to: "/financeiro", icon: DollarSign,      label: "Financeiro"},
]

const NAV_MAIS = [
  { to: "/profissionais", icon: Scissors,  label: "Profissionais" },
  { to: "/servicos",      icon: Briefcase, label: "Serviços"      },
  { to: "/relatorios",    icon: BarChart3,  label: "Relatórios"   },
  { to: "/configuracoes", icon: Settings,  label: "Configurações" },
]

function NavTab({
  to, icon: Icon, label,
}: { to: string; icon: React.ElementType; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "relative flex flex-col items-center justify-center gap-1 flex-1 py-2 tap-scale",
          "transition-colors duration-100",
          isActive ? "text-primary" : "text-muted-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
          )}
          <Icon className="h-5 w-5" />
          <span className={cn("text-[10px] leading-none", isActive && "font-medium")}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

export function NavegacaoInferior() {
  const [maisAberto, setMaisAberto] = useState(false)
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()

  async function handleLogout() {
    setMaisAberto(false)
    try { await api.post("/auth/logout") } finally {
      logout()
      navigate("/login")
    }
  }

  return (
    <>
      {/* Bottom Nav */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex h-14 items-stretch bg-card/90 backdrop-blur-md border-t border-border md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_PRINCIPAL.map((item) => (
          <NavTab key={item.to} {...item} />
        ))}

        {/* Mais */}
        <button
          onClick={() => setMaisAberto(true)}
          className={cn(
            "relative flex flex-col items-center justify-center gap-1 flex-1 py-2 tap-scale",
            "text-muted-foreground transition-colors duration-100"
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-[10px] leading-none">Mais</span>
        </button>
      </nav>

      {/* Sheet "Mais" */}
      <AnimatePresence>
        {maisAberto && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-50 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setMaisAberto(false)}
            />
            <motion.div
              key="sheet"
              className="fixed inset-x-0 bottom-0 z-50 bg-card border-t border-border rounded-t-xl md:hidden"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            >
              {/* Handle + header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <p className="text-sm font-semibold text-foreground">Mais opções</p>
                <button
                  onClick={() => setMaisAberto(false)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Links */}
              <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
                {NAV_MAIS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMaisAberto(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg tap-scale",
                        "transition-colors duration-100",
                        isActive
                          ? "bg-accent text-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cn("h-4 w-4 shrink-0", isActive && "text-primary")} />
                        <span className="text-sm">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Usuário + logout */}
              {usuario && (
                <>
                  <div className="h-px bg-border mx-5" />
                  <div className="flex items-center gap-3 px-5 py-4">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="text-xs font-semibold bg-primary/15 text-primary">
                        {iniciais(usuario.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{usuario.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{usuario.role}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-accent/60"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sair
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
