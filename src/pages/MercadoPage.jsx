import { useEffect, useState, useCallback, useMemo } from 'react'
import { getJugadores, getJugadorStats } from '../api/mercadoApi'
import { getPlantel, realizarTransferencia } from '../api/plantelApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import CamisetaSVG from '../components/jugador/CamisetaSVG'
import { useDraftStore } from '../store/draftStore'
import { useTransferenciaStore } from '../store/transferenciaStore'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import { useAyuda } from '../hooks/useAyuda'
import ModalAyuda from '../components/ui/ModalAyuda'
import BotonAyuda from '../components/ui/BotonAyuda'
import { AYUDA } from '../components/ui/ayudaContenido'

const ZONA_LABEL = {
    GUARD: 'Base / Escolta',
    FORWARD: 'Alero / Ala-Pívot',
    CENTER: 'Pívot',
    BASE: 'Base',
    ESCOLTA: 'Escolta',
    ALERO: 'Alero',
    ALA_PIVOT: 'Ala-Pívot',
    PIVOT: 'Pívot'
}

const POSICIONES = [
    { label: 'Todos', valor: null },
    { label: 'Bases', valor: 'BASE' },
    { label: 'Escoltas', valor: 'ESCOLTA' },
    { label: 'Aleros', valor: 'ALERO' },
    { label: 'Ala-Pivot', valor: 'ALA_PIVOT' },
    { label: 'Pivots', valor: 'PIVOT' },
]

const ESTADO_CONFIG = {
    DISPONIBLE: { label: 'Disponible', color: 'text-green-400' },
    DUDA: { label: 'Duda', color: 'text-yellow-400' },
    LESIONADO: { label: 'Lesionado', color: 'text-red-400' },
    SUSPENDIDO: { label: 'Suspendido', color: 'text-purple-400' },
}

export default function MercadoPage() {
    const [jugadores, setJugadores] = useState([])
    const [loading, setLoading] = useState(true)
    const [busqueda, setBusqueda] = useState('')
    const [buscando, setBuscando] = useState(false)

    const [plantelActivo, setPlantelActivo] = useState(null)
    const [idsPlantelActivo, setIdsPlantelActivo] = useState([])

    const [ejecutandoTransferencia, setEjecutandoTransferencia] = useState(false)
    const [errorTransferencia, setErrorTransferencia] = useState('')

    const store = useDraftStore()
    const { slotPendiente, asignarJugador } = store
    const navigate = useNavigate()

    const [modalJugador, setModalJugador] = useState(null)  // jugadorMercadoDto
    const [statsModal, setStatsModal] = useState(null)  // JugadorStatsResumenDto
    const [loadingStatsModal, setLoadingStatsModal] = useState(false)

    const { iniciarDesdeEntrada } = useTransferenciaStore()

    const iniciarTransferenciaDesdeEntrada = (jugador) => {
        iniciarDesdeEntrada(jugador)
        navigate('/canchita')
    }

    const {
        pendiente: transferenciaPendiente,
        cancelarTransferencia,
    } = useTransferenciaStore()

    const modoAsignacion = !!slotPendiente
    const modoTransferencia = !!transferenciaPendiente

    const { abierto, abrir, cerrar } = useAyuda('mercado')

    // Cargar datos del plantel para obtener los IDs (ocultar) y el Presupuesto (validar compra)
    useEffect(() => {
        // Ahora lo cargamos SIEMPRE, no solo en modo transferencia
        getPlantel().then(data => {
            if (data && data.jugadores) {
                setPlantelActivo(data)
                const ids = data.jugadores.map(j => String(j.jugadorRealId || j.id))
                setIdsPlantelActivo(ids)
            }
        }).catch(console.error)
    }, [])

    // Extraemos los jugadores del draft (onboarding)
    const jugadoresDraft = store.jugadores || store.plantel?.jugadores || store.slots || []

    // Calculamos cuánto gastó el usuario hasta ahora en el Onboarding
    const presupuestoGastadoDraft = jugadoresDraft.reduce((acc, j) => {
        if (!j) return acc;
        // Dependiendo de cómo lo guarde tu store, buscamos el valor
        const valor = j.jugador?.valorMercadoActual || j.valorMercadoActual || 0;
        return acc + valor;
    }, 0);

    // Cálculo dinámico del poder de compra unificado
    const poderDeCompra = modoTransferencia
        ? (plantelActivo?.presupuestoRestante || 0) + (transferenciaPendiente?.valorSale || 0)
        : (100.0 - presupuestoGastadoDraft); // 100 cr iniciales para el Onboarding

    const idsElegidosDraft = jugadoresDraft
        .map(j => {
            if (!j) return null
            if (j.jugador) return String(j.jugador.id || j.jugador.jugadorRealId)
            return String(j.id || j.jugadorRealId)
        })
        .filter(id => id && id !== 'undefined')

    const fetchYFiltrar = (params) => {
        return getJugadores(params).then(data => {
            return data.filter(j => !idsElegidosDraft.includes(String(j.id || j.jugadorRealId)))
        })
    }

    const posicionInicialPorZona = {
        GUARD: 'BASE',
        FORWARD: 'ALERO',
        CENTER: 'PIVOT',
    }

    const posicionInicialTransferencia = useMemo(() => {
        if (!transferenciaPendiente) return null

        // Si tenemos la zona del slot, usarla para pre-filtrar
        // por las posiciones válidas para esa zona
        if (transferenciaPendiente.zona) {
            const primeraPosPorZona = {
                GUARD: 'BASE',     // Muestra bases, el usuario puede cambiar a ESCOLTA
                FORWARD: 'ALERO',   // Muestra aleros, puede cambiar a ALA_PIVOT
                CENTER: 'PIVOT',
            }
            return primeraPosPorZona[transferenciaPendiente.zona] ?? null
        }

        // Fallback: filtrar por la posición exacta del jugador
        const mapaPos = {
            BASE: 'BASE',
            ESCOLTA: 'ESCOLTA',
            ALERO: 'ALERO',
            ALA_PIVOT: 'ALA_PIVOT',
            PIVOT: 'PIVOT',
        }
        return mapaPos[transferenciaPendiente.posicion] ?? null
    }, [transferenciaPendiente])

    const [posicion, setPosicion] = useState(
        modoAsignacion
            ? posicionInicialPorZona[slotPendiente?.zona] ?? null
            : modoTransferencia
                ? posicionInicialTransferencia
                : null
    )

    useEffect(() => {
        setLoading(true)
        fetchYFiltrar({ posicion: posicion ?? undefined })
            .then(setJugadores)
            .catch(console.error)
            .finally(() => setLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [posicion])

    useEffect(() => {
        if (busqueda.trim() === '') {
            setLoading(true)
            fetchYFiltrar({ posicion: posicion ?? undefined })
                .then(setJugadores)
                .catch(console.error)
                .finally(() => setLoading(false))
            return
        }
        if (busqueda.trim().length < 1) return

        const timer = setTimeout(() => {
            setBuscando(true)
            fetchYFiltrar({
                nombre: busqueda.trim(),
                posicion: posicion ?? undefined
            })
                .then(setJugadores)
                .catch(console.error)
                .finally(() => setBuscando(false))
        }, 400)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [busqueda, posicion])

    const limpiarBusqueda = useCallback(() => {
        setBusqueda('')
        setLoading(true)
        fetchYFiltrar({ posicion: posicion ?? undefined })
            .then(setJugadores)
            .finally(() => setLoading(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [posicion])

    const handleElegirReemplazo = async (jugadorEntra) => {
        setEjecutandoTransferencia(true)
        setErrorTransferencia('')

        try {
            await realizarTransferencia({
                jugadorSaleId: transferenciaPendiente.jugadorSaleId,
                jugadorEntraId: jugadorEntra.id || jugadorEntra.jugadorRealId,
                rolEntrante: transferenciaPendiente.rolSaliente,
            })

            cancelarTransferencia()
            navigate('/canchita')

        } catch (e) {
            setErrorTransferencia(
                e.response?.data?.mensaje ?? 'Error al realizar la transferencia.'
            )
            setEjecutandoTransferencia(false)
        }
    }

    const jugadoresVisibles = useMemo(() => {
        return jugadores.filter(j => {
            const jId = String(j.id || j.jugadorRealId)
            if (idsPlantelActivo.includes(jId)) {
                return false
            }
            return true
        })
    }, [jugadores, idsPlantelActivo])

    const abrirModalJugador = async (jugador) => {
        // En modo asignación o transferencia, el tap ya tiene otra función
        // Solo abrir el modal en modo browsing normal
        if (modoAsignacion || modoTransferencia) return

        setModalJugador(jugador)
        setLoadingStatsModal(true)
        try {
            const stats = await getJugadorStats(jugador.id)
            setStatsModal(stats)
        } catch {
            setStatsModal(null)
        } finally {
            setLoadingStatsModal(false)
        }
    }

    return (
        <div className="max-w-md mx-auto w-full px-4 space-y-4 pb-6 min-h-screen">
            <div className="flex items-center justify-between">
                <h1 className="text-textMain font-bold text-2xl pt-2">Mercado</h1>
                <BotonAyuda onClick={abrir} />
            </div>

            {/* BANNER ONBOARDING*/}
            {modoAsignacion && (
                <div className="bg-primary/20 border border-primary rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">👆</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-primary font-semibold text-sm">Elegí un jugador</p>
                        <p className="text-textMuted text-xs">Posición: {ZONA_LABEL[slotPendiente.zona] || slotPendiente.zona}</p>
                    </div>
                    <div className="text-right border-l border-primary/30 pl-3">
                        <p className="text-primary font-bold text-sm">{poderDeCompra.toFixed(1)}</p>
                        <p className="text-textMuted text-[10px] leading-tight">Presupuesto<br />Max</p>
                    </div>
                    <button
                        onClick={() => { store.setSlotPendiente(null); navigate(-1) }}
                        className="text-textMuted text-sm shrink-0 ml-2"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* BANNER TRANSFERENCIA */}
            {modoTransferencia && !modoAsignacion && (
                <div className="bg-accent/15 border border-accent rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">🔄</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-accent font-semibold text-sm">Elegí el reemplazo</p>
                        <p className="text-textMuted text-xs truncate">
                            Sale: {transferenciaPendiente.nombreSale.split(',')[0]}
                            {transferenciaPendiente.zona && (
                                <span className="ml-1">
                                    · {
                                        { GUARD: 'Base/Escolta', FORWARD: 'Alero/Ala-Pivot', CENTER: 'Pivot' }
                                        [transferenciaPendiente.zona]
                                    }
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="text-right border-l border-accent/30 pl-3">
                        <p className="text-accent font-bold text-sm">{poderDeCompra.toFixed(1)}</p>
                        <p className="text-textMuted text-[10px] leading-tight">Presupuesto<br />Max</p>
                    </div>
                    <button
                        onClick={() => { cancelarTransferencia(); navigate('/canchita') }}
                        className="text-textMuted text-sm shrink-0 ml-2"
                    >
                        ✕
                    </button>
                </div>
            )}

            {ejecutandoTransferencia && (
                <div className="flex items-center justify-center gap-2 py-2">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <p className="text-textMuted text-sm">Realizando transferencia...</p>
                </div>
            )}
            {errorTransferencia && (
                <div className="bg-red-900/40 border border-red-700 text-red-400 rounded-2xl px-4 py-3 text-sm text-center">
                    {errorTransferencia}
                </div>
            )}

            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar jugador o equipo..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 pr-10 text-textMain placeholder-textMuted text-sm focus:outline-none focus:border-primary"
                />
                {busqueda && (
                    <button onClick={limpiarBusqueda} className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain">✕</button>
                )}
            </div>

            {!busqueda && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full">
                    {POSICIONES.map(({ label, valor }) => (
                        <button
                            key={label}
                            onClick={() => setPosicion(valor)}
                            className={clsx('pill shrink-0 whitespace-nowrap', posicion === valor && 'pill-active')}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {loading || buscando ? (
                <LoadingSpinner mensaje="Buscando jugadores..." />
            ) : jugadoresVisibles.length === 0 ? (
                <EmptyState
                    titulo="Sin resultados"
                    descripcion="No encontramos jugadores con ese criterio (o ya los elegiste a todos)."
                />
            ) : (
                <div className="space-y-2 pb-4">
                    {jugadoresVisibles.map(jugador => (
                        <TarjetaJugador
                            key={jugador.id || jugador.jugadorRealId}
                            jugador={jugador}
                            presupuestoMaximo={poderDeCompra}
                            modoTransferencia={modoTransferencia}
                            modoAsignacion={modoAsignacion}
                            onElegir={
                                modoAsignacion
                                    ? (j) => {
                                        asignarJugador({ ...j, jugadorRealId: j.id || j.jugadorRealId })
                                        navigate('/onboarding/canchita', { replace: true })
                                    }
                                    : modoTransferencia
                                        ? (j) => handleElegirReemplazo(j)
                                        // FIX: Le pasamos la función al prop en modo browsing
                                        : abrirModalJugador
                            }
                        />
                    ))}
                </div>
            )}

            {modalJugador && createPortal(
                <>
                    <div className="fixed inset-0 bg-black/60 z-40"
                        onClick={() => { setModalJugador(null); setStatsModal(null) }} />
                    <div
                        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto
                 bg-card border-t border-border rounded-t-3xl
                 z-50 p-6 space-y-4 animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 bg-border rounded-full mx-auto" />

                        {/* Header jugador */}
                        <div className="flex items-center gap-4">
                            <CamisetaSVG
                                colorPrincipal={modalJugador.colorPrincipal}
                                colorSecundario={modalJugador.colorSecundario}
                                numero={modalJugador.numeroCamiseta}
                                estado={modalJugador.estado}
                                modelo={modalJugador.modeloCamiseta}
                                size={56}
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-textMain font-bold text-base leading-tight truncate">
                                    {modalJugador.nombreCompleto}
                                </p>
                                <p className="text-textMuted text-sm">
                                    {modalJugador.equipoNombre} · {modalJugador.posicion}
                                </p>
                                <p className="text-accent font-black text-xl mt-1">
                                    {modalJugador.valorMercadoActual?.toFixed(1)}
                                    <span className="text-sm font-normal text-textMuted ml-1">cr</span>
                                </p>
                            </div>
                        </div>

                        {/* Stats - Diseño estilo Canchita */}
                        {loadingStatsModal ? (
                            <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : statsModal && statsModal.partidosJugados > 0 ? (
                            <div className="bg-surface/50 rounded-2xl p-4 mt-2 border border-white/5">
                                <p className="text-textMuted text-[10px] font-bold uppercase tracking-wider mb-4 text-center">
                                    Promedios ({statsModal.partidosJugados} {statsModal.partidosJugados === 1 ? 'partido' : 'partidos'})
                                </p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                    {[
                                        { label: 'Puntos', valor: statsModal.promedioPuntos },
                                        { label: 'Asistencias', valor: statsModal.promedioAsistencias },
                                        { label: 'Reb. Def.', valor: statsModal.promedioRebotesDefensivos },
                                        { label: 'Reb. Of.', valor: statsModal.promedioRebotesOfensivos },
                                        { label: 'Recuperos', valor: statsModal.promedioRobos },
                                        { label: 'Tapones', valor: statsModal.promedioTaponesRealizados },
                                        { label: 'Faltas Recibidas', valor: statsModal.promedioFaltasRecibidas },
                                        { label: 'Pérdidas', valor: statsModal.promedioPerdidas, negativo: true },
                                        { label: 'Tap. Recibidos', valor: statsModal.promedioTaponesRecibidos, negativo: true },
                                        { label: 'Faltas Cometidas', valor: statsModal.promedioFaltasCometidas, negativo: true },
                                        { label: 'TC Fallados', valor: statsModal.promedioTirosCampoFallados, negativo: true },
                                        { label: 'TL Fallados', valor: statsModal.promedioTirosLibresFallados, negativo: true },
                                    ].map(({ label, valor, negativo }) => (
                                        <div key={label} className="flex justify-between items-center border-b border-white/5 pb-1">
                                            <span className="text-textMuted text-xs">{label}</span>
                                            <span className={clsx("font-bold text-sm tabular-nums", negativo ? "text-red-400" : "text-textMain")}>
                                                {valor !== undefined && valor !== null ? valor.toFixed(1) : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-surface rounded-2xl p-4 text-center border border-border mt-2">
                                <p className="text-textMuted text-sm">
                                    Sin estadísticas disponibles.
                                </p>
                            </div>
                        )}

                        {/* Botón transferir */}
                        <button
                            onClick={() => {
                                setModalJugador(null)
                                setStatsModal(null)
                                // Iniciar flujo de transferencia inverso
                                iniciarTransferenciaDesdeEntrada(modalJugador)
                            }}
                            className="w-full py-3 rounded-xl font-semibold
                           border border-primary text-primary
                           active:scale-95 transition-transform"
                        >
                            Transferir al equipo
                        </button>

                        <button
                            onClick={() => { setModalJugador(null); setStatsModal(null) }}
                            className="w-full py-2 text-textMuted text-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </>,
                document.body
            )}
            <ModalAyuda
                pagina="mercado"
                contenido={AYUDA.mercado}
                onCerrar={cerrar}
                abierto={abierto}  // el modal lo usás condicionalmente:
            />
        </div>
    )
}

function TarjetaJugador({ jugador, onElegir, presupuestoMaximo, modoTransferencia, modoAsignacion }) {
    const estado = ESTADO_CONFIG[jugador.estado] ?? ESTADO_CONFIG.DISPONIBLE

    // Bloqueamos si supera el presupuesto tanto armando el equipo como haciendo un cambio
    const superaPresupuesto = (modoTransferencia || modoAsignacion) && (jugador.valorMercadoActual > presupuestoMaximo);

    return (
        <div
            className={clsx(
                "card flex items-center gap-3 transition-transform",
                superaPresupuesto ? "opacity-50 grayscale" : "cursor-pointer active:scale-95 hover:border-primary/50"
            )}
            onClick={() => !superaPresupuesto && onElegir ? onElegir(jugador) : null}
        >
            <div className="shrink-0">
                <CamisetaSVG
                    colorPrincipal={jugador.colorPrincipal}
                    colorSecundario={jugador.colorSecundario}
                    numero={jugador.numeroCamiseta}
                    estado={jugador.estado}
                    modelo={jugador.modeloCamiseta}
                    size={52}
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-textMain font-semibold text-sm truncate">
                    {jugador.nombreCompleto}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-textMuted text-xs">{jugador.equipoSigla}</span>
                    <span className="text-border">·</span>
                    <span className="text-textMuted text-xs">{jugador.posicion}</span>
                    <span className="text-border">·</span>
                    <span className={`text-xs font-medium ${estado.color}`}>
                        {estado.label}
                    </span>
                </div>
                {jugador.promedioPuntosUltimas3 > 0 && (
                    <p className="text-textMuted text-xs mt-0.5">
                        Prom. Fantasy: <span className="text-accent font-semibold">{jugador.promedioPuntosUltimas3.toFixed(1)}</span> pts
                    </p>
                )}
            </div>
            <div className="shrink-0 text-right flex flex-col items-end">
                <p className={clsx("font-bold text-base", superaPresupuesto ? "text-red-400 line-through" : "text-textMain")}>
                    {jugador.valorMercadoActual?.toFixed(1)}
                </p>
                <p className="text-textMuted text-xs">créditos</p>
                {superaPresupuesto && (
                    <span className="text-[10px] text-red-400 font-bold mt-1 bg-red-950/50 px-2 py-0.5 rounded">Muy caro</span>
                )}
            </div>
        </div>
    )
}