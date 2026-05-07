import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 segundos
})

// ── Interceptor de request: inyecta el JWT en cada llamada ──────────────────
axiosClient.interceptors.request.use(
    (config) => {
        // Leemos el token directamente del store de Zustand
        // sin necesidad de pasar props — acceso global
        const token = useAuthStore.getState().token

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => Promise.reject(error)
)

// ── Interceptor de response: manejo global de errores ───────────────────────
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expirado o inválido — limpiar sesión y redirigir al login
            useAuthStore.getState().logout()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default axiosClient