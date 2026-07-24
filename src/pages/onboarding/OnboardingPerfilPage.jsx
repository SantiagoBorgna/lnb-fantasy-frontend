import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getEquiposParaOnboarding, completarPerfil } from '../../api/authApi'
import { getMe } from '../../api/authApi'
import { useUiStore } from '../../store/uiStore'
import PatronEquipo from '../../components/ui/PatronEquipo'

export default function OnboardingPerfilPage() {
    const navigate = useNavigate()
    const { token, setAuth, usuario } = useAuthStore()
    const { showToast } = useUiStore()

    const [equipos, setEquipos] = useState([])
    const [equipoElegido, setEquipoElegido] = useState(usuario?.equipoFavoritoId || null)
    const [nombreEquipo, setNombreEquipo] = useState(usuario?.nombreEquipoVirtual || '')
    const [loading, setLoading] = useState(true)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        getEquiposParaOnboarding()
            .then(setEquipos)
            .finally(() => setLoading(false))
    }, [])

    const handleGuardar = async () => {
        if (!equipoElegido) { showToast('Elegí tu equipo favorito.', 'error'); return }
        if (nombreEquipo.trim().length < 3) {
            showToast('El nombre debe tener al menos 3 caracteres.', 'error')
            return
        }

        setGuardando(true)

        try {
            await completarPerfil({
                equipoFavoritoId: equipoElegido,
                nombreEquipoVirtual: nombreEquipo.trim(),
            })

            // Refrescar usuario en el store con el nuevo estadoOnboarding
            const usuarioActualizado = await getMe()
            setAuth(token, usuarioActualizado)

            navigate('/onboarding/reglas', { replace: true })
        } catch (e) {
            showToast(e.response?.data?.mensaje ?? 'Error al guardar el perfil.', 'error')
        } finally {
            setGuardando(false)
        }
    }

    if (loading) return (
        <div className="min-h-screen bg-surface flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent
                      rounded-full animate-spin" />
        </div>
    )

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-0 md:p-8">
            <div className="w-full max-w-2xl bg-surface md:bg-card border-none md:border md:border-border rounded-none md:rounded-3xl p-6 py-8 md:p-10 flex flex-col shadow-none md:shadow-xl h-[100dvh] md:h-auto md:min-h-[600px]">

            {/* Progreso */}
            <div className="flex gap-2 mb-8">
                {[1, 2, 3].map(n => (
                    <div key={n} className={`h-1 flex-1 rounded-full ${n === 1 ? 'bg-accent' : 'bg-border'
                        }`} />
                ))}
            </div>

            <h1 className="text-textMain font-black text-2xl mb-1">
                ¡Bienvenido/a, {usuario?.nombreDisplay?.split(' ')[0]}!
            </h1>
            <p className="text-textMuted text-sm mb-8">
                Configurá tu perfil para arrancar.
            </p>

            {/* Nombre del equipo */}
            <div className="space-y-2 mb-6">
                <label className="text-textMain text-sm font-semibold">
                    Nombre de tu equipo
                </label>
                <input
                    type="text"
                    placeholder="Ej: Los Invencibles"
                    maxLength={30}
                    value={nombreEquipo}
                    onChange={e => setNombreEquipo(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl
                     px-4 py-3 text-textMain placeholder-textMuted text-sm
                     focus:outline-none focus:border-primary"
                />
                <p className="text-textMuted text-xs text-right">
                    {nombreEquipo.length}/30
                </p>
            </div>

            {/* Selector de equipo favorito */}
            <div className="space-y-2 mb-6 flex-1 flex flex-col min-h-0">
                <label className="text-textMain text-sm font-semibold shrink-0">
                    Tu equipo favorito de la LNB
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 flex-1 md:max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {equipos.map(equipo => (
                        <button
                            key={equipo.id}
                            onClick={() => setEquipoElegido(equipo.id)}
                            className={`
                flex items-center gap-2 p-3 rounded-2xl border text-left
                transition-all
                ${equipoElegido === equipo.id
                                    ? 'border-accent bg-accent/10'
                                    : 'border-border bg-card hover:border-primary'}
              `}
                        >
                            {/* Rectángulo con el patrón de la camiseta */}
                            <div className="w-6 h-6 rounded-md shrink-0 relative overflow-hidden shadow-[inset_0_1px_3px_rgba(255,255,255,0.3)] border border-white/10">
                                <PatronEquipo 
                                    colorPrincipal={equipo.colorPrincipal} 
                                    colorSecundario={equipo.colorSecundario} 
                                    modelo={equipo.modeloCamiseta} 
                                    className="w-full h-full absolute inset-0 z-0" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent mix-blend-overlay z-10"></div>
                            </div>
                            <div className="min-w-0">
                                <p className="text-textMain text-xs font-semibold truncate">
                                    {equipo.sigla}
                                </p>
                                <p className="text-textMuted text-xs truncate">
                                    {equipo.nombre}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleGuardar}
                disabled={guardando}
                className="btn-primary w-full mt-auto disabled:opacity-50"
            >
                {guardando ? 'Guardando...' : 'Continuar'}
            </button>
        </div>
        </div>
    )
}