import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getMe } from '../api/authApi'

/**
 * El backend redirige aquí tras el login exitoso:
 * http://localhost:5173/auth/callback#token=eyJ...
 *
 * Esta página:
 * 1. Lee el token del fragment (#) de la URL
 * 2. Llama a /api/auth/me para obtener los datos del usuario
 * 3. Guarda token + usuario en el store de Zustand
 * 4. Redirige al Dashboard
 */
export default function AuthCallbackPage() {
    const setAuth = useAuthStore(state => state.setAuth)
    const navigate = useNavigate()

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

        getMe()
            .then(usuario => {
                setAuth(token, usuario)
                navigate('/', { replace: true })
            })
            .catch(() => {
                // Token inválido o expirado
                setAuth(null, null)
                navigate('/login', { replace: true })
            })
    }, [])

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