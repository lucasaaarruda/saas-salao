import type { ElementType } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import {
  LayoutDashboard, Calendar, Users, Scissors, Briefcase,
  DollarSign, BarChart3, Settings, LogOut, ChevronLeft, ChevronRight, Sun, Moon,
} from "lucide-react"
import { cn, iniciais } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/authStore"
import { useThemeStore } from "@/store/themeStore"
import api from "@/lib/api"

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const NAV_PRINCIPAL = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard"     },
  { to: "/agenda",        icon: Calendar,        label: "Agenda"        },
  { to: "/clientes",      icon: Users,           label: "Clientes"      },
  { to: "/profissionais", icon: Scissors,        label: "Profissionais" },
  { to: "/servicos",      icon: Briefcase,       label: "Serviços"      },
]

const NAV_FINANCEIRO = [
  { to: "/financeiro", icon: DollarSign, label: "Financeiro" },
  { to: "/relatorios", icon: BarChart3,  label: "Relatórios" },
]

function GroupLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) return <div className="h-px bg-border mx-2 my-2" />
  return (
    <p className="px-3 pt-4 pb-1 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.08em] select-none">
      {label}
    </p>
  )
}

function NavItem({
  to,
  icon: Icon,
  label,
  collapsed,
}: {
  to: string
  icon: ElementType
  label: string
  collapsed: boolean
}) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-md text-sm transition-colors duration-100",
          collapsed ? "justify-center px-0 py-2" : "px-2.5 py-[7px]",
          isActive
            ? "bg-accent text-foreground font-medium"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "shrink-0 transition-colors",
              collapsed ? "h-[18px] w-[18px]" : "h-4 w-4",
              isActive ? "text-primary" : ""
            )}
          />
          {!collapsed && <span className="truncate leading-none">{label}</span>}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { usuario, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  async function handleLogout() {
    try { await api.post("/auth/logout") } finally {
      logout()
      navigate("/login")
    }
  }

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border",
        "transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-[52px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-14 shrink-0 px-3 gap-2",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <img src="/icon.png" alt="Bellezi" className="w-9 h-9 rounded-lg object-cover shrink-0" />
            <span className="font-semibold text-xl text-foreground truncate">Bellezi</span>
          </div>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? "Expandir" : "Colapsar"}
          className={cn(
            "flex items-center justify-center rounded-md transition-colors duration-100",
            "text-muted-foreground hover:text-foreground hover:bg-accent/60",
            collapsed ? "w-7 h-7" : "w-6 h-6 shrink-0"
          )}
        >
          {collapsed
            ? <ChevronRight className="h-3.5 w-3.5" />
            : <ChevronLeft className="h-3.5 w-3.5" />
          }
        </button>
      </div>

      <div className="h-px bg-sidebar-border shrink-0" />

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        <GroupLabel label="Principal" collapsed={collapsed} />
        {NAV_PRINCIPAL.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}

        <GroupLabel label="Financeiro" collapsed={collapsed} />
        {NAV_FINANCEIRO.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}

        <GroupLabel label="Conta" collapsed={collapsed} />
        <NavItem to="/configuracoes" icon={Settings} label="Configurações" collapsed={collapsed} />
        <button
          onClick={toggleTheme}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
          className={cn(
            "flex items-center gap-2.5 rounded-md text-sm transition-colors duration-100 w-full",
            collapsed ? "justify-center px-0 py-2" : "px-2.5 py-[7px]",
            "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          )}
        >
          {theme === "dark"
            ? <Sun className={cn("shrink-0 transition-colors", collapsed ? "h-[18px] w-[18px]" : "h-4 w-4")} />
            : <Moon className={cn("shrink-0 transition-colors", collapsed ? "h-[18px] w-[18px]" : "h-4 w-4")} />
          }
          {!collapsed && <span className="truncate leading-none">Tema</span>}
        </button>
      </nav>

      <div className="h-px bg-sidebar-border shrink-0" />

      {/* Rodapé — usuário + logout */}
      <div className="shrink-0 px-2 py-3">
        {usuario && (
          <div
            className={cn(
              "group flex items-center gap-2.5 rounded-md px-2 py-2",
              "hover:bg-accent/60 transition-colors duration-100",
              collapsed && "justify-center px-0"
            )}
          >
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-[10px] font-semibold bg-primary/15 text-primary">
                {iniciais(usuario.name)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate leading-none mb-0.5">
                    {usuario.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate capitalize leading-none">
                    {usuario.role}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sair"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-100 p-1 rounded text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        )}
        {collapsed && (
          <button
            onClick={handleLogout}
            title="Sair"
            className="flex items-center justify-center w-full py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors duration-100"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </aside>
  )
}
