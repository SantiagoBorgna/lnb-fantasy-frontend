import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getMe } from '../api/authApi'

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
                
                const redirectTarget = localStorage.getItem('redirectUrl') || '/';
                localStorage.removeItem('redirectUrl'); // Limpiamos la memoria
                navigate(redirectTarget, { replace: true });
            })
            .catch(() => {
                // Token inválido o expirado
                setAuth(null, null)
                navigate('/login', { replace: true })
            })
    }, [navigate, setAuth])

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