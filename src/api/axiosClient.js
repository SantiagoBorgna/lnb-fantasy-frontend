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
        if (!config.baseURL) {
            const liga = ligaActual()
            config.baseURL = liga.apiUrl
            // Para descartar la respuesta si mientras viaja se cambia de liga (ver abajo)
            config.ligaDelPedido = liga.id
        }

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
// Una respuesta que llega después de cambiar de liga es de la liga anterior: si se usara,
// pisaría datos de la liga actual (ej. el perfil, que en la otra liga puede estar sin onboarding)
const esDeOtraLiga = (config) => !!config?.ligaDelPedido && config.ligaDelPedido !== ligaActual().id
const respuestaDescartada = () => new axios.CanceledError('Respuesta de otra liga: se descarta')

axiosClient.interceptors.response.use(
    (response) => esDeOtraLiga(response.config) ? Promise.reject(respuestaDescartada()) : response,
    (error) => {
        if (esDeOtraLiga(error.config)) return Promise.reject(respuestaDescartada())

        if (error.response?.status === 401) {
            // Token expirado o inválido — limpiar sesión y redirigir al login
            useAuthStore.getState().logout()
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default axiosClient