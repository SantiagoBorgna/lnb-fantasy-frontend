import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import {
    getTorneosPublicos, getMisTorneos,
    crearTorneo, unirseTorneo, getTablaTorneo
} from '../api/torneoApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useAyuda } from '../hooks/useAyuda'
import ModalAyuda from '../components/ui/ModalAyuda'
import BotonAyuda from '../components/ui/BotonAyuda'
import { AYUDA } from '../components/ui/ayudaContenido'

const TABS = ['Mis Torneos', 'Explorar']

export default function TorneosPage() {
    const navigate = useNavigate() // <-- 3. Faltaba inicializar navigate
    const [tab, setTab] = useState('Mis Torneos')
    const [misTorneos, setMisTorneos] = useState([])
    const [publicos, setPublicos] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [loading, setLoading] = useState(true)
    const [modalCrear, setModalCrear] = useState(false)
    const [tablaModal, setTablaModal] = useState(null)   // { torneo, filas }
    const [codigoUnirse, setCodigoUnirse] = useState('')

    const { abierto, abrir, cerrar } = useAyuda('torneos')

    useEffect(() => {
        cargarDatos()
    }, [])

    const cargarDatos = async () => {
        setLoading(true)
        try {
            const [mis, pub] = await Promise.all([
                getMisTorneos(),
                getTorneosPublicos(),
            ])
            setMisTorneos(mis)
            setPublicos(pub)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    // Búsqueda en torneos públicos con debounce
    useEffect(() => {
        if (tab !== 'Explorar') return
        const timer = setTimeout(() => {
            getTorneosPublicos(busqueda || undefined).then(resultado => {
                // Filtrar torneos en los que el usuario ya participa
                const idsEnMisTorneos = new Set(misTorneos.map(t => t.id))
                setPublicos(resultado.filter(t => !idsEnMisTorneos.has(t.id)))
            })
        }, 400)
        return () => clearTimeout(timer)
    }, [busqueda, tab, misTorneos])

    const handleUnirse = async (codigo) => {
        try {
            await unirseTorneo(codigo)
            await cargarDatos()
            setCodigoUnirse('')
        } catch (e) {
            console.error(e)
        }
    }

    const abrirTabla = async (torneo) => {
        const filas = await getTablaTorneo(torneo.id)
        setTablaModal({ torneo, filas })
    }

    if (loading) return <LoadingSpinner mensaje="Cargando torneos..." />

    return (
        <div className="space-y-4 pb-6">
            <div className="flex items-center justify-between">
                <h1 className="text-textMain font-bold text-2xl pt-2">Torneos</h1>
                <BotonAyuda onClick={abrir} />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-card rounded-2xl p-1">
                {TABS.map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors
              ${tab === t
                                ? 'bg-primary text-white'
                                : 'text-textMuted hover:text-textMain'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {/* ── Mis Torneos ──────────────────────────────────────────── */}
            {tab === 'Mis Torneos' && (
                <div className="space-y-3">

                    {/* Unirse por código */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Código de invitación..."
                            value={codigoUnirse}
                            onChange={e => setCodigoUnirse(e.target.value)}
                            className="flex-1 bg-card border border-border rounded-xl
                         px-3 py-2 text-textMain text-sm
                         placeholder-textMuted focus:outline-none focus:border-primary"
                        />
                        <button
                            onClick={() => codigoUnirse && handleUnirse(codigoUnirse)}
                            className="btn-primary px-4 text-sm"
                        >
                            Unirse
                        </button>
                    </div>

                    {misTorneos.length === 0 ? (
                        <EmptyState
                            titulo="Sin torneos"
                            descripcion="Creá uno nuevo o unite con un código de invitación."
                        />
                    ) : (

                        misTorneos.map(t => (
                            <button
                                key={t.id}
                                onClick={() => navigate(`/torneos/${t.id}`)}
                                className="card w-full text-left space-y-1 active:scale-95
               transition-transform hover:border-primary"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-textMain font-bold text-sm truncate flex-1">
                                        {t.nombre}
                                    </p>
                                    <span className={clsx(
                                        'text-xs font-semibold shrink-0',
                                        t.tipo === 'PRIVADO' ? 'text-accent' : 'text-green-400'
                                    )}>
                                        {t.tipo === 'PRIVADO' ? '🔒' : '🌐'}
                                    </span>
                                </div>
                                <p className="text-textMuted text-xs">
                                    {t.cantidadParticipantes} participante{t.cantidadParticipantes !== 1 ? 's' : ''}
                                </p>
                                {t.descripcion && (
                                    <p className="text-textMuted text-xs line-clamp-1">{t.descripcion}</p>
                                )}
                            </button>
                        ))

                    )}

                    <button
                        onClick={() => setModalCrear(true)}
                        className="btn-accent w-full"
                    >
                        + Crear torneo
                    </button>
                </div>
            )}

            {/* ── Explorar ─────────────────────────────────────────────── */}
            {tab === 'Explorar' && (
                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Buscar torneos públicos..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl
                       px-4 py-2.5 text-textMain text-sm
                       placeholder-textMuted focus:outline-none focus:border-primary"
                    />
                    {publicos.length === 0 ? (
                        <EmptyState titulo="Sin resultados" />
                    ) : (
                        publicos.map(t => (
                            <button
                                key={t.id}
                                onClick={() => navigate(`/torneos/${t.id}`)}
                                className="card w-full text-left space-y-1 active:scale-95
               transition-transform hover:border-primary"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-textMain font-bold text-sm truncate flex-1">
                                        {t.nombre}
                                    </p>
                                    <span className="text-green-400 text-xs font-semibold shrink-0">
                                        🌐 Público
                                    </span>
                                </div>
                                <p className="text-textMuted text-xs">
                                    {t.cantidadParticipantes} participante{t.cantidadParticipantes !== 1 ? 's' : ''}
                                </p>
                                {t.descripcion && (
                                    <p className="text-textMuted text-xs line-clamp-1">{t.descripcion}</p>
                                )}
                            </button>
                        ))

                    )}
                </div>
            )}

            {/* ── Modal crear torneo ────────────────────────────────────── */}
            {modalCrear && (
                <ModalCrearTorneo
                    onCreado={async (body) => {
                        await crearTorneo(body)
                        await cargarDatos()
                        setModalCrear(false)
                    }}
                    onCerrar={() => setModalCrear(false)}
                />
            )}

            {/* ── Modal tabla de posiciones ─────────────────────────────── */}
            {tablaModal && createPortal(
                <>
                    <div
                        className="fixed inset-0 bg-black/60 z-40"
                        onClick={() => setTablaModal(null)}
                    />
                    <div
                        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto
                       bg-card border-t border-border rounded-t-3xl
                       z-50 p-6 space-y-4 animate-slide-up max-h-[80vh]
                       overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                        <h3 className="text-textMain font-bold text-lg">
                            {tablaModal.torneo.nombre}
                        </h3>

                        <div className="space-y-2">
                            {tablaModal.filas.map((fila) => (
                                <div
                                    key={fila.equipoVirtualId}
                                    className="flex items-center gap-3 p-3 rounded-2xl
                             bg-surface border border-border"
                                >
                                    <span className={`
                    w-7 h-7 rounded-full flex items-center justify-center
                    text-sm font-black shrink-0
                    ${fila.posicion === 1 ? 'bg-yellow-500 text-white' : ''}
                    ${fila.posicion === 2 ? 'bg-gray-400 text-white' : ''}
                    ${fila.posicion === 3 ? 'bg-amber-700 text-white' : ''}
                    ${fila.posicion >= 4 ? 'bg-border text-textMuted' : ''}
                  `}>
                                        {fila.posicion}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-textMain font-semibold text-sm truncate">
                                            {fila.nombreEquipo}
                                        </p>
                                        <p className="text-textMuted text-xs">{fila.nombreUsuario}</p>
                                    </div>
                                    <span className="text-accent font-black text-lg tabular-nums">
                                        {fila.puntajeGlobal?.toFixed(1)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setTablaModal(null)}
                            className="w-full py-2 text-textMuted text-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </>,
                document.body
            )}

            <ModalAyuda
                pagina="torneos"
                contenido={AYUDA.torneos}
                onCerrar={cerrar}
                abierto={abierto}  // el modal lo usás condicionalmente:
            />
        </div>
    )
}

// ── Tarjeta de torneo ────────────────────────────────────────────────────────
function TarjetaTorneo({ torneo, onVerTabla, onUnirse }) {
    const [copiado, setCopiado] = useState(false)

    const copiarLink = () => {
        navigator.clipboard.writeText(torneo.urlInvitacion ?? '')
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2000)
    }

    return (
        <div className="card space-y-2">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="text-textMain font-bold text-sm truncate">
                        {torneo.nombre}
                    </p>
                    <p className="text-textMuted text-xs">
                        {torneo.cantidadParticipantes} participantes ·{' '}
                        <span className={torneo.tipo === 'PRIVADO'
                            ? 'text-accent' : 'text-green-400'}>
                            {torneo.tipo === 'PRIVADO' ? 'Privado' : 'Público'}
                        </span>
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    {torneo.tipo === 'PRIVADO' && (
                        <button
                            onClick={copiarLink}
                            className="text-xs text-textMuted border border-border
                         rounded-lg px-2 py-1 hover:text-textMain
                         transition-colors"
                        >
                            {copiado ? '✓ Copiado' : '🔗 Link'}
                        </button>
                    )}
                    {onUnirse && (
                        <button onClick={onUnirse} className="btn-primary text-xs px-3 py-1">
                            Unirse
                        </button>
                    )}
                    <button
                        onClick={onVerTabla}
                        className="text-xs text-primary border border-primary
                        rounded-lg px-2 py-1 hover:bg-primary/10
                        transition-colors"
                    >
                        Tabla
                    </button>
                </div>
            </div>
            {torneo.descripcion && (
                <p className="text-textMuted text-xs line-clamp-2">
                    {torneo.descripcion}
                </p>
            )}
        </div>
    )
}

// ── Modal crear torneo ───────────────────────────────────────────────────────
function ModalCrearTorneo({ onCreado, onCerrar }) {
    const [nombre, setNombre] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [tipo, setTipo] = useState('PUBLICO')
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')

    const handleCrear = async () => {
        if (!nombre.trim()) { setError('El nombre es obligatorio.'); return }
        setGuardando(true)
        try {
            await onCreado({ nombre: nombre.trim(), descripcion, tipo })
        } catch (e) {
            setError(e.response?.data?.mensaje ?? 'Error al crear el torneo.')
        } finally {
            setGuardando(false)
        }
    }

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onCerrar} />
            <div
                className="fixed bottom-0 left-0 right-0 max-w-md mx-auto
                   bg-card border-t border-border rounded-t-3xl
                   z-50 p-6 space-y-4 animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                <h3 className="text-textMain font-bold text-lg">Nuevo Torneo</h3>

                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="Nombre del torneo *"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl
                       px-4 py-2.5 text-textMain text-sm
                       placeholder-textMuted focus:outline-none focus:border-primary"
                    />
                    <input
                        type="text"
                        placeholder="Descripción (opcional)"
                        value={descripcion}
                        onChange={e => setDescripcion(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl
                       px-4 py-2.5 text-textMain text-sm
                       placeholder-textMuted focus:outline-none focus:border-primary"
                    />

                    {/* Selector de tipo */}
                    <div className="flex gap-2">
                        {['PUBLICO', 'PRIVADO'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTipo(t)}
                                className={`flex-1 py-2 rounded-xl text-sm font-semibold
                  border transition-colors
                  ${tipo === t
                                        ? 'bg-primary border-primary text-white'
                                        : 'border-border text-textMuted hover:text-textMain'}`}
                            >
                                {t === 'PUBLICO' ? '🌐 Público' : '🔒 Privado'}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <p className="text-red-400 text-xs text-center">{error}</p>
                    )}
                </div>

                <button
                    onClick={handleCrear}
                    disabled={guardando}
                    className="btn-primary w-full disabled:opacity-50"
                >
                    {guardando ? 'Creando...' : 'Crear Torneo'}
                </button>
                <button onClick={onCerrar} className="w-full py-2 text-textMuted text-sm">
                    Cancelar
                </button>
            </div>
        </>,
        document.body
    )
}