import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { ligaActual } from '../store/ligaStore'

// Sin baseURL fija: cada pedido va al backend de la liga que se está jugando
// (un pedido puede forzar otra con su propio baseURL, ej. la compra del Premium)
const axiosClient = axios.create({
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' // <-- El pase VIP para saltar la pantalla de ngrok
    },
    timeout: 10000, // 10 segundos
})

// ── Interceptor de request: inyecta el JWT en cada llamada ──────────────────
axiosClient.interceptors.request.use(
    (config) => {
        config.baseURL ??= ligaActual().apiUrl

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