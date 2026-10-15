import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getMe } from '../api/authApi'
import { useGameStore } from '../store/gameStore'
import { useQueryClient } from '@tanstack/react-query'
import { consumirRedirectPendiente, verRedirectPendiente } from '../utils/redirectPendiente'
import { track } from '../utils/analytics'

export default function AuthCallbackPage() {
    const setAuth = useAuthStore(state => state.setAuth)
    const { setContextoActual } = useGameStore()
    const navigate = useNavigate()

    const queryClient = useQueryClient()

    useEffect(() => {
        const hash = window.location.hash  // "#token=eyJ..."

        if (!hash || !hash.includes('token=')) {
            // Si no hay token en el fragment, volver al login
            navigate('/login', { replace: true })
            return
        }

        const token = hash.split('token=')[1]

        // Guardamos el token primero para que el interceptor de axios
        // lo inyecte en el request de /me
        setAuth(token, null)
        
        // Reset context to global
        setContextoActual(null)

        // Si el efecto se descarta (ej. StrictMode lo corre dos veces en desarrollo),
        // ignoramos esa respuesta para no consumir dos veces el redirect pendiente
        let descartado = false

        getMe()
            .then(usuario => {
                if (descartado) return
                setAuth(token, usuario)

                // Usuario recién creado = registro; si no, es un login de alguien que ya existía.
                // Si abandona el onboarding y vuelve, sigue NUEVO: lo marcamos para no contarlo dos veces.
                const claveRegistro = `ga_sign_up_${usuario?.id}`
                let yaContado = false
                try { yaContado = localStorage.getItem(claveRegistro) === '1' } catch { /* sin storage */ }
                const esRegistro = usuario?.estadoOnboarding === 'NUEVO' && !yaContado
                track(esRegistro ? 'sign_up' : 'login', {
                    invitado: !!verRedirectPendiente()?.startsWith('/u/'),
                })
                if (esRegistro) {
                    try { localStorage.setItem(claveRegistro, '1') } catch { /* sin storage */ }
                }
                queryClient.clear() // Limpiamos la caché de react-query de un usuario anterior
                
                // Si venía de un link (ej. invitación a un torneo) y ya tiene el equipo armado,
                // lo mandamos ahí. Si le falta el onboarding, la URL queda guardada y se usa al terminarlo.
                const destino = usuario?.estadoOnboarding === 'ACTIVO' ? consumirRedirectPendiente() : null
                navigate(destino || '/', { replace: true });
            })
            .catch(() => {
                if (descartado) return
                // Token inválido o expirado
                setAuth(null, null)
                navigate('/login', { replace: true })
            })

        return () => { descartado = true }
    }, [navigate, setAuth, queryClient])

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent
                        rounded-full animate-spin mx-auto" />
                <p className="text-textMuted text-sm">Iniciando sesión...</p>
            </div>
        </div>
    )
}