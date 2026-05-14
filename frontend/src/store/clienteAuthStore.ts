import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ClientePublico } from "@/types"

interface ClienteAuthState {
  accessToken: string | null
  refreshToken: string | null
  cliente: ClientePublico | null
  slug: string | null
  isAuthenticated: boolean
  setAuth: (access: string, refresh: string, cliente: ClientePublico, slug: string) => void
  setAccessToken: (token: string) => void
  logout: () => void
}

export const useClienteAuthStore = create<ClienteAuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      cliente: null,
      slug: null,
      isAuthenticated: false,

      setAuth: (access, refresh, cliente, slug) =>
        set({ accessToken: access, refreshToken: refresh, cliente, slug, isAuthenticated: true }),

      setAccessToken: (token) => set({ accessToken: token }),

      logout: () =>
        set({ accessToken: null, refreshToken: null, cliente: null, slug: null, isAuthenticated: false }),
    }),
    {
      name: "booking-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        cliente: state.cliente,
        slug: state.slug,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
