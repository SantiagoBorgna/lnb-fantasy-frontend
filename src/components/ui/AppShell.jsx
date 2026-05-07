import { useEffect, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import BottomNav from './BottomNav'
import { useAuthStore } from '../../store/authStore'
import { getMe, logout } from '../../api/authApi'
import { createPortal } from 'react-dom'

export default function AppShell() {
    const { token, setAuth, logout: logoutStore } = useAuthStore()
    const [modalLogout, setModalLogout] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (!token) return
        getMe()
            .then(usuarioActualizado => setAuth(token, usuarioActualizado))
            .catch(() => { })
    }, [])

    const handleLogout = async () => {
        try {
            await logout()       // Revoca el token en el backend
        } catch { }
        logoutStore()          // Limpia el store local
        navigate('/login', { replace: true })
    }

    return (
        <div className="flex flex-col h-full max-w-md mx-auto relative">
            <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
                <Outlet />
            </main>
            <BottomNav onLogout={() => setModalLogout(true)} />
            {modalLogout && createPortal(
                <>
                    <div
                        className="fixed inset-0 bg-black/60 z-40"
                        onClick={() => setModalLogout(false)}
                    />
                    <div
                        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto
                 bg-card border-t border-border rounded-t-3xl
                 z-50 p-6 space-y-4 animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                        <h3 className="text-textMain font-bold text-lg">¿Cerrar sesión?</h3>
                        <p className="text-textMuted text-sm">
                            Vas a tener que volver a iniciar sesión con Google para entrar.
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 rounded-xl font-semibold
                     bg-red-500/20 border border-red-500 text-red-400"
                            >
                                Sí, cerrar sesión
                            </button>
                            <button
                                onClick={() => setModalLogout(false)}
                                className="w-full py-2 text-textMuted text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    )
}