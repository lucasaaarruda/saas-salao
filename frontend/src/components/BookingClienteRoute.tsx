import { Navigate, Outlet, useLocation, useParams } from "react-router-dom"
import { useClienteAuthStore } from "@/store/clienteAuthStore"

export default function BookingClienteRoute() {
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const { isAuthenticated, slug: authSlug } = useClienteAuthStore()

  if (!isAuthenticated || authSlug !== slug) {
    const parts = location.pathname.split("/")
    const next = parts[parts.length - 1] || "agendar"
    return <Navigate to={`/booking/${slug}/auth?next=${next}`} replace />
  }

  return <Outlet />
}
