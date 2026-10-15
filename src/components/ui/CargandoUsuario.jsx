import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getMe } from '../../api/authApi'

// Pide el perfil al backend de la liga actual (la primera vez que entra a una liga, se crea ahí)
export default function CargandoUsuario() {
    const setUsuario = useAuthStore(state => state.setUsuario)
    const logoutStore = useAuthStore(state => state.logout)
    const navigate = useNavigate()

    useEffect(() => {
        let descartado = false
        getMe()
            .then(usuario => { if (!descartado) setUsuario(usuario) })
            .catch(() => {
                if (descartado) return
                logoutStore()
                navigate('/login', { replace: true })
            })
        return () => { descartado = true }
    }, [setUsuario, logoutStore, navigate])

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
    )
}
