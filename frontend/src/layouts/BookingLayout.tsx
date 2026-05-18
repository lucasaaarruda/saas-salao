import { useEffect, useState } from "react"
import { Outlet, useParams, Link, useNavigate } from "react-router-dom"
import { CalendarDays, HelpCircle, LogIn, LogOut, User2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClienteAuthStore } from "@/store/clienteAuthStore"
import { logoutClienteApi } from "@/api/booking"
import OnboardingModal from "@/components/booking/OnboardingModal"

export default function BookingLayout() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { cliente, isAuthenticated, logout } = useClienteAuthStore()
  const [onboardingAberto, setOnboardingAberto] = useState(false)

  useEffect(() => {
    if (slug && !localStorage.getItem(`belezzi_onboarding_${slug}`)) {
      setOnboardingAberto(true)
    }
  }, [slug])

  function fecharOnboarding() {
    if (slug) localStorage.setItem(`belezzi_onboarding_${slug}`, "1")
    setOnboardingAberto(false)
  }

  async function handleLogout() {
    try {
      await logoutClienteApi(slug!)
    } catch {}
    logout()
    navigate(`/booking/${slug}`)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link
            to={`/booking/${slug}`}
            className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors"
          >
            <CalendarDays className="h-5 w-5 text-primary" />
            <span>Agendamento Online</span>
          </Link>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOnboardingAberto(true)}
              title="Ajuda"
              className="text-muted-foreground"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>

            {isAuthenticated ? (
              <>
                <Link to={`/booking/${slug}/meus-agendamentos`}>
                  <Button variant="ghost" size="sm" className="gap-1.5">
                    <User2 className="h-4 w-4" />
                    <span className="hidden sm:inline text-sm">
                      {cliente?.name.split(" ")[0]}
                    </span>
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} title="Sair">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Link to={`/booking/${slug}/auth`}>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <LogIn className="h-4 w-4" />
                  <span>Entrar</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      <footer className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Salão App
      </footer>

      {onboardingAberto && <OnboardingModal onClose={fecharOnboarding} />}
    </div>
  )
}
