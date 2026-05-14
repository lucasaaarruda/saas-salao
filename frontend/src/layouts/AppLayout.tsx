import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Sun, Moon } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import { NavegacaoInferior } from "@/components/NavegacaoInferior"
import { CabecalhoMobile } from "@/components/CabecalhoMobile"
import { useThemeStore } from "@/store/themeStore"

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
      </div>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header mobile */}
        <CabecalhoMobile
          className="md:hidden"
          acaoDireita={
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
              className="flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
            >
              {theme === "dark"
                ? <Sun className="h-4 w-4" />
                : <Moon className="h-4 w-4" />
              }
            </button>
          }
        />

        {/* Conteúdo — padding-bottom no mobile para a nav inferior */}
        <div className="flex-1 overflow-y-auto pb-14 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Navegação inferior — mobile only */}
      <NavegacaoInferior />
    </div>
  )
}
