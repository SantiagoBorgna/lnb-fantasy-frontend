import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
    const token = useAuthStore(state => state.token)
    const navigate = useNavigate()

    // Si ya está autenticado, redirigir al dashboard
    useEffect(() => {
        if (token) navigate('/', { replace: true })
    }, [token, navigate])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center
                    bg-surface px-6">

            {/* Logo / Título */}
            <div className="mb-12 text-center">
                <div className="w-20 h-20 bg-primary rounded-3xl mx-auto mb-4
                        flex items-center justify-center">
                    <span className="text-white text-3xl font-bold">LNB</span>
                </div>
                <h1 className="text-3xl font-bold text-textMain">Fantasy</h1>
                <p className="text-textMuted mt-2 text-sm">
                    La Liga Nacional de Básquet, a tu manera
                </p>
            </div>

            {/* Botones de login */}
            <div className="w-full max-w-sm space-y-3">

                <a
                    href={`${import.meta.env.VITE_API_URL}/oauth2/authorization/google`}
                    className="
                    flex items-center justify-center gap-3
                    w-full py-3 px-4 rounded-2xl
                    bg-white text-gray-800 font-semibold
                    hover:bg-gray-100 transition-colors
                    shadow-lg
                    "
                >
                    <GoogleIcon />
                    Continuar con Google
                </a>


                <a
                    href={`${import.meta.env.VITE_API_URL}/oauth2/authorization/microsoft`}
                    className="
                    flex items-center justify-center gap-3
                    w-full py-3 px-4 rounded-2xl
                    bg-[#2F2F2F] text-white font-semibold
                    hover:bg-[#404040] transition-colors
                    shadow-lg
                    "
                >
                    <MicrosoftIcon />
                    Continuar con Microsoft
                </a>
            </div>

            <p className="text-textMuted text-xs text-center mt-8 max-w-xs">
                Al iniciar sesión aceptás los términos de uso de LNB Fantasy.
                No guardamos contraseñas.
            </p>
        </div >
    )
}

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    )
}

function MicrosoftIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#F25022" d="M1 1h10v10H1z" />
            <path fill="#00A4EF" d="M13 1h10v10H13z" />
            <path fill="#7FBA00" d="M1 13h10v10H1z" />
            <path fill="#FFB900" d="M13 13h10v10H13z" />
        </svg>
    )
}