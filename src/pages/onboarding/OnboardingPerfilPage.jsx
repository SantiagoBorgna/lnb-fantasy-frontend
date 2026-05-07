import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { getEquiposParaOnboarding, completarPerfil } from '../../api/authApi'
import { getMe } from '../../api/authApi'

export default function OnboardingPerfilPage() {
    const navigate = useNavigate()
    const { token, setAuth, usuario } = useAuthStore()

    const [equipos, setEquipos] = useState([])
    const [equipoElegido, setEquipoElegido] = useState(null)
    const [nombreEquipo, setNombreEquipo] = useState('')
    const [loading, setLoading] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        getEquiposParaOnboarding()
            .then(setEquipos)
            .finally(() => setLoading(false))
    }, [])

    const handleGuardar = async () => {
        if (!equipoElegido) { setError('Elegí tu equipo favorito.'); return }
        if (nombreEquipo.trim().length < 3) {
            setError('El nombre debe tener al menos 3 caracteres.')
            return
        }

        setGuardando(true)
        setError('')

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
            setError(e.response?.data?.mensaje ?? 'Error al guardar el perfil.')
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
        <div className="min-h-screen bg-surface px-6 py-10 flex flex-col max-w-md mx-auto">

            {/* Progreso */}
            <div className="flex gap-2 mb-8">
                {[1, 2, 3].map(n => (
                    <div key={n} className={`h-1 flex-1 rounded-full ${n === 1 ? 'bg-accent' : 'bg-border'
                        }`} />
                ))}
            </div>

            <h1 className="text-textMain font-black text-2xl mb-1">
                ¡Bienvenido, {usuario?.nombreDisplay?.split(' ')[0]}! 👋
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
            <div className="space-y-2 mb-8">
                <label className="text-textMain text-sm font-semibold">
                    Tu equipo favorito de la LNB
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
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
                            {/* Rectángulo de color del equipo */}
                            <div
                                className="w-6 h-6 rounded-md shrink-0"
                                style={{ background: equipo.colorPrincipal }}
                            />
                            <div className="min-w-0">
                                <p className="text-textMain text-xs font-semibold truncate">
                                    {equipo.sigla}
                                </p>
                                <p className="text-textMuted text-xs truncate">
                                    {equipo.nombre}
                                </p>
                            </div>
                            {equipoElegido === equipo.id && (
                                <span className="ml-auto text-accent text-sm">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <p className="text-red-400 text-sm text-center mb-4">{error}</p>
            )}

            <button
                onClick={handleGuardar}
                disabled={guardando}
                className="btn-primary w-full mt-auto disabled:opacity-50"
            >
                {guardando ? 'Guardando...' : 'Continuar →'}
            </button>
        </div>
    )
}