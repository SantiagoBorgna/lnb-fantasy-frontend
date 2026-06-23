import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { getEquiposParaOnboarding, actualizarPerfil, logout } from '../../api/authApi'
import { useAuthStore } from '../../store/authStore'
import { useNavigate } from 'react-router-dom'
import CamisetaSVG from '../jugador/CamisetaSVG'

export default function PerfilModal({ isOpen, onClose }) {
    const { usuario, setAuth, setUsuario, setToken } = useAuthStore()
    const navigate = useNavigate()

    const [equipos, setEquipos] = useState([])
    const [cargandoEquipos, setCargandoEquipos] = useState(false)
    
    const [nombreDisplay, setNombreDisplay] = useState('')
    const [nombreEquipo, setNombreEquipo] = useState('')
    const [equipoFavoritoId, setEquipoFavoritoId] = useState('')
    
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')

    // Inicializar form
    useEffect(() => {
        if (isOpen && usuario) {
            setNombreDisplay(usuario.nombreDisplay || '')
            setNombreEquipo(usuario.nombreEquipoVirtual || '')
            setEquipoFavoritoId(usuario.equipoFavoritoId || '')
            setError('')
        }
    }, [isOpen, usuario])

    // Cargar equipos
    useEffect(() => {
        if (isOpen && equipos.length === 0) {
            setCargandoEquipos(true)
            getEquiposParaOnboarding()
                .then(setEquipos)
                .catch(() => setError('Error al cargar equipos'))
                .finally(() => setCargandoEquipos(false))
        }
    }, [isOpen, equipos.length])

    if (!isOpen || !usuario) return null

    const handleGuardar = async (e) => {
        e.preventDefault()
        setError('')
        
        if (!nombreDisplay.trim() || !nombreEquipo.trim() || !equipoFavoritoId) {
            setError('Completá todos los campos')
            return
        }

        setGuardando(true)
        try {
            const data = await actualizarPerfil({
                nombreDisplay: nombreDisplay.trim(),
                nombreEquipo: nombreEquipo.trim(),
                equipoFavoritoId: Number(equipoFavoritoId)
            })
            // Actualizar store con el nuevo usuario sin tocar el token
            setUsuario(data)
            onClose()
        } catch (err) {
            setError(err.response?.data?.mensaje || 'Error al actualizar perfil')
        } finally {
            setGuardando(false)
        }
    }

    const handleLogout = async () => {
        try {
            await logout()
        } catch (e) {
            console.error(e)
        }
        setAuth(null)
        setToken(null)
        navigate('/login')
        onClose()
    }

    const equipoSeleccionado = equipos.find(e => e.id === Number(equipoFavoritoId)) || {
        colorPrincipal: usuario.colorPrincipal,
        colorSecundario: usuario.colorSecundario,
        modeloCamiseta: usuario.modeloCamiseta
    }

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" onClick={onClose} />
            <div
                className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md mx-auto
                 bg-card border-t border-border rounded-t-3xl md:rounded-3xl
                 z-[70] p-6 space-y-5 animate-slide-up md:animate-none"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />

                {/* Header Perfil */}
                <div className="flex flex-col items-center text-center gap-2">
                    <div className="relative">
                        {usuario.avatarUrl ? (
                            <img src={usuario.avatarUrl} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-surface object-cover" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white font-bold text-3xl border-4 border-surface shadow-xl">
                                {usuario.nombreDisplay?.charAt(0).toUpperCase() ?? '?'}
                            </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-card rounded-full p-1 border-2 border-surface">
                            <CamisetaSVG
                                colorPrincipal={equipoSeleccionado?.colorPrincipal}
                                colorSecundario={equipoSeleccionado?.colorSecundario}
                                modelo={equipoSeleccionado?.modeloCamiseta}
                                numero=""
                                size={28}
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-textMain font-bold text-xl mt-2">{usuario.email}</h2>
                        <p className="text-textMuted text-sm">Tu cuenta de Fantasy</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/40 border border-red-700 text-red-400 rounded-xl px-4 py-3 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleGuardar} className="space-y-4">
                    <div>
                        <label className="block text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Nombre del Mánager</label>
                        <input
                            type="text"
                            value={nombreDisplay}
                            onChange={e => setNombreDisplay(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain placeholder-textMuted focus:outline-none focus:border-primary"
                            placeholder="Ej: Santi"
                            maxLength={25}
                        />
                    </div>

                    <div>
                        <label className="block text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Nombre del Equipo</label>
                        <input
                            type="text"
                            value={nombreEquipo}
                            onChange={e => setNombreEquipo(e.target.value)}
                            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain placeholder-textMuted focus:outline-none focus:border-primary"
                            placeholder="Ej: Los Pumas"
                            maxLength={30}
                        />
                    </div>

                    <div>
                        <label className="block text-textMuted text-xs font-bold uppercase tracking-wider mb-2">Club Favorito de la LNB</label>
                        <select
                            value={equipoFavoritoId}
                            onChange={e => setEquipoFavoritoId(e.target.value)}
                            disabled={cargandoEquipos}
                            className="w-full bg-surface border border-border text-textMain rounded-xl px-4 py-3 outline-none focus:border-primary appearance-none disabled:opacity-50"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23888\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                        >
                            <option value="">Seleccioná un club...</option>
                            {equipos.map(e => (
                                <option key={e.id} value={e.id}>{e.nombre}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={guardando}
                            className={clsx(
                                "w-full py-3.5 rounded-xl font-bold flex items-center justify-center transition-transform",
                                guardando ? "bg-primary/50 text-white cursor-wait" : "bg-primary text-white active:scale-95"
                            )}
                        >
                            {guardando ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                "Guardar Cambios"
                            )}
                        </button>
                    </div>
                </form>

                <div className="pt-2 border-t border-border">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full py-3 rounded-xl font-semibold text-red-400 border border-red-500/20 bg-red-950/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                        </svg>
                        Cerrar Sesión
                    </button>
                </div>
                
                <button
                    onClick={onClose}
                    className="w-full py-2 text-textMuted text-sm font-medium"
                >
                    Cancelar
                </button>
            </div>
        </>,
        document.body
    )
}
