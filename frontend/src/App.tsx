import { useEffect } from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "@/components/ui/toaster"
import AppLayout from "@/layouts/AppLayout"
import AuthLayout from "@/layouts/AuthLayout"
import BookingLayout from "@/layouts/BookingLayout"
import PrivateRoute from "@/components/PrivateRoute"
import BookingClienteRoute from "@/components/BookingClienteRoute"
import { useThemeStore } from "@/store/themeStore"

// Auth (staff)
import LoginPage from "@/pages/auth/LoginPage"
import RegisterPage from "@/pages/auth/RegisterPage"
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage"
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage"

// App (staff)
import DashboardPage from "@/pages/dashboard/DashboardPage"
import AgendaPage from "@/pages/agenda/AgendaPage"
import ClientesPage from "@/pages/clientes/ClientesPage"
import ProfissionaisPage from "@/pages/profissionais/ProfissionaisPage"
import ServicosPage from "@/pages/servicos/ServicosPage"
import FinanceiroPage from "@/pages/financeiro/FinanceiroPage"
import RelatoriosPage from "@/pages/relatorios/RelatoriosPage"
import ConfiguracoesPage from "@/pages/configuracoes/ConfiguracoesPage"

// Landing
import LandingPage from "@/pages/landing/LandingPage"

// Booking (public)
import BookingLandingPage from "@/pages/booking/BookingLandingPage"
import BookingAuthPage from "@/pages/booking/BookingAuthPage"
import BookingWizardPage from "@/pages/booking/BookingWizardPage"
import BookingConfirmacaoPage from "@/pages/booking/BookingConfirmacaoPage"
import MeusAgendamentosPage from "@/pages/booking/MeusAgendamentosPage"

function ThemeSync() {
  const theme = useThemeStore((s) => s.theme)
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light")
    } else {
      document.documentElement.classList.remove("light")
    }
  }, [theme])
  return null
}

export default function App() {
  return (
    <>
      <ThemeSync />
      <BrowserRouter>
        <Routes>
          {/* Landing page pública */}
          <Route path="/" element={<LandingPage />} />

          {/* Rotas públicas (staff auth) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Rotas protegidas (staff) */}
          <Route element={<PrivateRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/profissionais" element={<ProfissionaisPage />} />
              <Route path="/servicos" element={<ServicosPage />} />
              <Route path="/financeiro" element={<FinanceiroPage />} />
              <Route path="/relatorios" element={<RelatoriosPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            </Route>
          </Route>

          {/* Booking (público por slug) */}
          <Route path="/booking/:slug" element={<BookingLayout />}>
            <Route index element={<BookingLandingPage />} />
            <Route path="auth" element={<BookingAuthPage />} />
            {/* Rotas que exigem cliente autenticado */}
            <Route element={<BookingClienteRoute />}>
              <Route path="agendar" element={<BookingWizardPage />} />
              <Route path="confirmacao" element={<BookingConfirmacaoPage />} />
              <Route path="meus-agendamentos" element={<MeusAgendamentosPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </>
  )
}
