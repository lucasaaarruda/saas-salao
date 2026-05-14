import axios, { type InternalAxiosRequestConfig } from "axios"
import { useAuthStore } from "@/store/authStore"

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableConfig

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = useAuthStore.getState().refreshToken

      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1"}/auth/refresh`,
            { refresh_token: refreshToken }
          )
          useAuthStore.getState().setAccessToken(data.access_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          useAuthStore.getState().logout()
          window.location.href = "/login"
        }
      } else {
        useAuthStore.getState().logout()
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  }
)

export default api
