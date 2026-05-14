import { create } from "zustand"
import { persist } from "zustand/middleware"

interface Usuario {
  id: string
  name: string
  email: string
  role: string
  salon_id: string
  is_active: boolean
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  usuario: Usuario | null
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string) => void
  setAccessToken: (token: string) => void
  setUsuario: (usuario: Usuario) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      usuario: null,
      isAuthenticated: false,

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true }),

      setAccessToken: (token) => set({ accessToken: token }),

      setUsuario: (usuario) => set({ usuario }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          usuario: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "salao-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        usuario: state.usuario,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
