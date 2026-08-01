import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getEstadoDraft, iniciarDraft, elegirJugadorDraft } from '../api/draftApi'
import { getMercadoJugadores } from '../api/mercadoApi'
import { encodeId, decodeId } from '../utils/urlParams'
import { useUiStore } from '../store/uiStore'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import CamisetaSVG from '../components/jugador/CamisetaSVG'
import { useCountdown } from '../hooks/useCountdown'

function TurnoCountdown({ limiteTiempo, esMiTurno }) {
    const countdown = useCountdown(limiteTiempo)
    if (!countdown) return <span>Calculando...</span>
    return <span>{esMiTurno ? "Te quedan" : "Le quedan"} {String(countdown.minutos).padStart(2, '0')}:{String(countdown.segundos).padStart(2, '0')}</span>
}

import api from '../api/axiosClient'
import { getPlantel, guardarPlantel } from '../api/plantelApi'

async function getDirectoresTecnicos() {
    const res = await api.get('/dt')
    return res.data
}

export default function SalaDraftPage() {
    const { torneoId: rawTorneoId } = useParams()
    const torneoId = decodeId(rawTorneoId)
    const navigate = useNavigate()
    const { usuario } = useAuthStore()
    const { showToast } = useUiStore()

    const [draftState, setDraftState] = useState(null)
    const [loading, setLoading] = useState(true)
    const [jugadoresDisponibles, setJugadoresDisponibles] = useState([])
    const [jugadoresTodos, setJugadoresTodos] = useState([])
    const [dtsDisponibles, setDtsDisponibles] = useState([])
    const [dtsTodos, setDtsTodos] = useState([])
    const [busqueda, setBusqueda] = useState('')
    const [filtroPosicion, setFiltroPosicion] = useState(null)
    const [procesando, setProcesando] = useState(false)
    const [error, setError] = useState('')

    // Selección de roles post-draft
    const [miPlantel, setMiPlantel] = useState(null)
    const [capitanId, setCapitanId] = useState('')
    const [sextoHombreId, setSextoHombreId] = useState('')
    const [procesandoRoles, setProcesandoRoles] = useState(false)

    // Modal state
    const [confirmModal, setConfirmModal] = useState({ open: false, action: null, message: '', title: '' })

    const cargarDatos = (showLoader = true) => {
        if (showLoader) setLoading(true)
        setError('')
        Promise.all([
            getEstadoDraft(torneoId),
            getMercadoJugadores(),
            getDirectoresTecnicos()
        ])
        .then(([estado, jugadores, dts]) => {
            setDraftState(estado)
            setJugadoresTodos(jugadores)
            setDtsTodos(dts)
            // Filtramos los jugadores que ya fueron elegidos
            const elegidosIds = estado.turnos
                .filter(t => t.completado && t.jugadorRealIdElegido)
                .map(t => t.jugadorRealIdElegido)
            
            const disponibles = jugadores.filter(j => !elegidosIds.includes(j.id))
            setJugadoresDisponibles(disponibles)

            // Filtramos los DTs que ya fueron elegidos
            const dtsElegidosIds = estado.turnos
                .filter(t => t.completado && t.dtIdElegido)
                .map(t => t.dtIdElegido)
            
            const dtsDisp = dts.filter(dt => !dtsElegidosIds.includes(dt.id))
            setDtsDisponibles(dtsDisp)
        })
        .catch(e => {
            setError('No se pudo cargar la sala de draft')
        })
        .finally(() => {
            if (showLoader) setLoading(false)
        })
    }

    useEffect(() => {
        cargarDatos()
        
        if (draftState?.estado === 'FINALIZADO' && !miPlantel && usuario?.id) {
            getPlantel(torneoId, usuario.id).then(plantel => {
                setMiPlantel(plantel)
                setCapitanId('')
                setSextoHombreId('')
            }).catch(console.error)
        }

        // Polling cada 5 segundos si el draft está en curso
        const interval = setInterval(() => {
            if (draftState?.estado === 'EN_CURSO') {
                getEstadoDraft(torneoId).then(estado => {
                    setDraftState(estado)
                    if (estado.estado === 'FINALIZADO') {
                        import('../api/authApi').then(({ getPerfil }) => {
                            getPerfil().then(perfil => {
                                useAuthStore.getState().setUsuario(perfil)
                            })
                        })
                        import('../api/torneoApi').then(({ getMisTorneos }) => {
                            getMisTorneos().then(torneos => {
                                const ligasDraft = torneos.filter(t => t.modalidad === 'DRAFT' && t.estadoDraft === 'FINALIZADO')
                                import('../store/gameStore').then(({ useGameStore }) => {
                                    useGameStore.getState().setMisLigasDraft(ligasDraft)
                                    useGameStore.getState().setContextoActual(Number(torneoId))
                                })
                            })
                        })
                    }
                    const elegidosIds = estado.turnos
                        .filter(t => t.completado)
                        .map(t => t.jugadorRealIdElegido)
                    setJugadoresDisponibles(prev => prev.filter(j => !elegidosIds.includes(j.id)))
                })
            }
        }, 5000)
        return () => clearInterval(interval)
    }, [torneoId, draftState?.estado, usuario?.id, miPlantel])

    const handleContinuarTorneo = async () => {
        if (!miPlantel || !capitanId || !sextoHombreId) {
            showToast("Debes elegir Capitán y Sexto Hombre")
            return
        }
        setProcesandoRoles(true)
        try {
            const dto = {
                formacion: miPlantel.formacion || '1-2-2',
                capitanId: Number(capitanId),
                sextoHombreId: Number(sextoHombreId),
                posiciones: miPlantel.jugadores.map(j => ({
                    jugadorRealId: j.jugadorRealId || j.id,
                    posicionPlantel: j.posicionPlantel
                }))
            }
            await guardarPlantel(torneoId, dto)
            navigate(`/t/${encodeId(torneoId)}`)
        } catch (e) {
            setError(e.response?.data?.mensaje || "Error al guardar los roles")
        } finally {
            setProcesandoRoles(false)
        }
    }

    const handleIniciarDraft = async () => {
        setConfirmModal({
            open: true,
            title: "Confirmar inicio",
            message: "¿Seguro que querés iniciar el draft ahora?",
            action: async () => {
                setProcesando(true)
                try {
                    await iniciarDraft(torneoId)
                    showToast("Draft iniciado con éxito")
                    cargarDatos()
                } catch (e) {
                    const errorMsg = typeof e.response?.data === 'string' ? e.response.data : (e.response?.data?.message || e.response?.data?.mensaje || e.response?.data?.error || "Error al iniciar")
                    setError(errorMsg)
                } finally {
                    setProcesando(false)
                    setConfirmModal({ open: false, action: null, message: '', title: '' })
                }
            }
        })
    }

    const handlePick = async (item, isDt = false) => {
        setConfirmModal({
            open: true,
            title: isDt ? "Elegir Director Técnico" : "Elegir jugador",
            message: `¿Estás seguro de elegir a ${item.nombreCompleto}?`,
            action: async () => {
                setProcesando(true)
                try {
                    if (isDt) {
                        await api.post(`/torneos/${torneoId}/draft/pick-dt/${item.id}`)
                    } else {
                        await elegirJugadorDraft(torneoId, item.id || item.jugadorRealId)
                    }
                    showToast("Pick registrado")
                    setBusqueda('')
                    cargarDatos(false)
                } catch (e) {
                    const errorMsg = typeof e.response?.data === 'string' ? e.response.data : (e.response?.data?.message || e.response?.data?.mensaje || e.response?.data?.error || "Error al elegir")
                    setError(errorMsg)
                } finally {
                    setProcesando(false)
                    setConfirmModal({ open: false, action: null, message: '', title: '' })
                }
            }
        })
    }

    if (loading) return <LoadingSpinner className="mt-20" />
    if (!draftState && error) return <EmptyState icon="⚠️" title="Error" description={error} />
    if (!draftState) return null

    const esAdmin = usuario?.id === draftState.adminId
    const turnoActual = draftState?.turnos?.find(t => t.id === draftState.turnoActualId)
    const esMiTurno = turnoActual?.usuarioId === usuario?.id

    const esFinalizado = draftState?.estado === 'FINALIZADO';
    const misPicks = draftState?.turnos ? draftState.turnos.filter(t => t.usuarioId === usuario?.id && t.completado) : [];
    const misJugadoresIds = misPicks.filter(t => t.jugadorRealIdElegido).map(t => t.jugadorRealIdElegido);
    const miDtId = misPicks.find(t => t.dtIdElegido)?.dtIdElegido;

    const misJugadores = misJugadoresIds.map(id => jugadoresTodos.find(j => j.id === id)).filter(Boolean);
    const miDt = dtsTodos.find(dt => dt.id === miDtId);

    const basesEscoltas = misJugadores.filter(j => j.posicion === 'BASE' || j.posicion === 'ESCOLTA');
    const alerosAlapivots = misJugadores.filter(j => j.posicion === 'ALERO' || j.posicion === 'ALA_PIVOT');
    const pivots = misJugadores.filter(j => j.posicion === 'PIVOT');

    const formatNombre = (nombreCompleto) => {
        if (!nombreCompleto) return '';
        const partes = nombreCompleto.split(',');
        if (partes.length === 2) {
            const apellido = partes[0].trim().toUpperCase();
            const nombres = partes[1].trim().toLowerCase().replace(/(^\w|\s\w|á|é|í|ó|ú|ñ)/g, m => m.toUpperCase());
            return `${apellido}, ${nombres}`;
        }
        return nombreCompleto;
    };

    return (
        <div className="space-y-6">
            <header className="flex flex-col gap-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-center md:text-left flex-1 flex flex-col md:block">
                        {draftState?.estado !== 'FINALIZADO' && (
                            <button
                                onClick={() => navigate(`/t/${encodeId(torneoId)}`)}
                                className="text-textMuted text-sm mb-2 flex items-center justify-start gap-1 hover:text-textMain transition-colors w-full md:w-auto self-start"
                            >
                                ← Volver al torneo
                            </button>
                        )}
                        <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3 mt-1">
                            <h1 className="text-2xl font-black text-textMain tracking-tight w-full md:w-auto text-center md:text-left">Sala de Draft</h1>
                        </div>
                        <div className="text-textMuted text-sm mt-1">
                            {draftState.estado === 'PENDIENTE' && 'Esperando que el administrador inicie el draft...'}
                            {draftState.estado === 'EN_CURSO' && 'Draft en progreso. Elegí sabiamente.'}
                            {draftState.estado === 'FINALIZADO' && 'El draft ha finalizado.'}
                        </div>
                    </div>
                    {draftState.estado === 'PENDIENTE' && (
                        <div className="flex justify-center md:justify-end shrink-0">
                            <button
                                onClick={handleIniciarDraft}
                                disabled={procesando || !esAdmin}
                                className={clsx(
                                    "font-bold py-2.5 px-6 rounded-xl transition-colors w-full md:w-auto",
                                    (procesando || !esAdmin) ? "bg-surface text-textMuted opacity-50 cursor-not-allowed" : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
                                )}
                            >
                                {procesando ? 'Iniciando...' : 'Iniciar Draft'}
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {draftState.estado === 'EN_CURSO' && turnoActual && (
                <div className={clsx("p-4 rounded-xl border", esMiTurno ? "bg-accent/10 border-accent text-accent" : "bg-card border-border")}>
                    <h2 className="font-bold text-lg mb-1">
                        {esMiTurno ? "¡ES TU TURNO!" : `Turno de: ${turnoActual.nombreEquipo}`}
                    </h2>
                    <p className="text-sm opacity-80">
                        Ronda {turnoActual.ronda} - Pick #{turnoActual.numeroTurnoGlobal}
                    </p>
                    <p className="text-xs mt-2 opacity-60">
                        <TurnoCountdown limiteTiempo={turnoActual.limiteTiempo} esMiTurno={esMiTurno} />
                    </p>
                </div>
            )}

            {draftState.estado === 'EN_CURSO' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Lista de Jugadores Disponibles */}
                    <div className="bg-card rounded-2xl border border-border flex flex-col h-[600px]">
                        <div className="p-4 border-b border-border space-y-4">
                            <div>
                                <h3 className="font-bold text-textMain mb-2">Jugadores Disponibles</h3>
                                <input 
                                    type="text"
                                    placeholder="Buscar jugador..."
                                    value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-xl px-4 py-2 text-sm text-textMain focus:outline-none focus:border-accent transition-colors"
                                />
                                {turnoActual?.ronda !== 11 && (
                                    <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
                                        {[
                                            { label: 'Todos', valor: null },
                                            { label: 'BAS/ESC', valor: 'GUARD' },
                                            { label: 'ALE/ALA', valor: 'FORWARD' },
                                            { label: 'PIVOT', valor: 'CENTER' }
                                        ].map(f => (
                                            <button
                                                key={f.label}
                                                onClick={() => setFiltroPosicion(f.valor)}
                                                className={clsx(
                                                    "px-3 py-1 text-[11px] font-bold rounded-full whitespace-nowrap transition-colors",
                                                    filtroPosicion === f.valor 
                                                        ? "bg-primary text-white" 
                                                        : "bg-surface border border-border text-textMuted hover:text-textMain"
                                                )}
                                            >
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Resumen del Plantel del Usuario */}
                            <div className="bg-surface rounded-xl p-3 border border-border">
                                <h4 className="text-xs font-bold text-textMain mb-2 uppercase tracking-wider">Tu Plantel (Mín 2, Máx 4 por grupo)</h4>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="bg-card border border-border rounded p-1.5">
                                        <div className="text-textMuted font-medium text-[10px]">BASE/ESC</div>
                                        <div className="font-black text-textMain">
                                            {draftState.turnos.filter(t => t.usuarioId === usuario?.id && t.completado).map(t => jugadoresTodos.find(j => j.id === t.jugadorRealIdElegido)).filter(j => j && (j.posicion === 'BASE' || j.posicion === 'ESCOLTA')).length}/4
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded p-1.5">
                                        <div className="text-textMuted font-medium text-[10px]">ALE/ALA-PIV</div>
                                        <div className="font-black text-textMain">
                                            {draftState.turnos.filter(t => t.usuarioId === usuario?.id && t.completado).map(t => jugadoresTodos.find(j => j.id === t.jugadorRealIdElegido)).filter(j => j && (j.posicion === 'ALERO' || j.posicion === 'ALA_PIVOT')).length}/4
                                        </div>
                                    </div>
                                    <div className="bg-card border border-border rounded p-1.5">
                                        <div className="text-textMuted font-medium text-[10px]">PIVOT</div>
                                        <div className="font-black text-textMain">
                                            {draftState.turnos.filter(t => t.usuarioId === usuario?.id && t.completado).map(t => jugadoresTodos.find(j => j.id === t.jugadorRealIdElegido)).filter(j => j && j.posicion === 'PIVOT').length}/4
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {turnoActual?.ronda === 11 && (
                                <div className="bg-accent/10 border-l-4 border-accent p-3 mb-4 rounded-r-xl">
                                    <p className="text-sm text-accent font-bold">¡Ronda 11! Es hora de elegir tu Director Técnico.</p>
                                </div>
                            )}

                            {turnoActual?.ronda === 11 ? (
                                dtsDisponibles
                                    .filter(dt => dt.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()))
                                    .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto))
                                    .map(dt => (
                                    <div key={dt.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
                                        <div className="shrink-0 w-10 h-10 bg-card rounded-lg flex items-center justify-center">
                                            <span className="text-lg">👔</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-textMain truncate">{dt.nombreCompleto}</p>
                                            <p className="text-xs text-textMuted truncate">DT · {dt.equipoSigla || dt.equipoNombre}</p>
                                        </div>
                                        <button
                                            onClick={() => handlePick(dt, true)}
                                            disabled={!esMiTurno || procesando}
                                            className="px-3 py-1 bg-accent text-white rounded-lg text-xs font-bold disabled:opacity-50 shrink-0"
                                        >
                                            Elegir
                                        </button>
                                    </div>
                                ))
                            ) : (
                                jugadoresDisponibles
                                    .filter(j => j.nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()))
                                    .filter(j => {
                                        if (filtroPosicion === 'GUARD' && j.posicion !== 'BASE' && j.posicion !== 'ESCOLTA') return false;
                                        if (filtroPosicion === 'FORWARD' && j.posicion !== 'ALERO' && j.posicion !== 'ALA_PIVOT') return false;
                                        if (filtroPosicion === 'CENTER' && j.posicion !== 'PIVOT') return false;

                                        const countTeam = misJugadores.filter(mj => mj.equipoNombre === j.equipoNombre).length;
                                        if (countTeam >= 2) return false;
                                        if (j.posicion === 'BASE' || j.posicion === 'ESCOLTA') return basesEscoltas.length < 4;
                                        if (j.posicion === 'ALERO' || j.posicion === 'ALA_PIVOT') return alerosAlapivots.length < 4;
                                        if (j.posicion === 'PIVOT') return pivots.length < 4;
                                        return true;
                                    })
                                    .sort((a, b) => (b.valorMercadoActual || 0) - (a.valorMercadoActual || 0) || a.nombreCompleto.localeCompare(b.nombreCompleto))
                                    .map(j => (
                                    <div key={j.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border">
                                        <div className="shrink-0 w-10 h-10 bg-card rounded-lg flex items-center justify-center">
                                            <CamisetaSVG 
                                                colorPrincipal={j.colorPrincipal} 
                                                colorSecundario={j.colorSecundario} 
                                                modelo={j.modeloCamiseta} 
                                                size={28} 
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-sm text-textMain truncate">{j.nombreCompleto}</p>
                                            <p className="text-xs text-textMuted truncate">{j.posicion} {j.equipoNombre}</p>
                                        </div>
                                        <button
                                            onClick={() => handlePick(j, false)}
                                            disabled={!esMiTurno || procesando}
                                            className="px-3 py-1 bg-accent text-white rounded-lg text-xs font-bold disabled:opacity-50 shrink-0"
                                        >
                                            Elegir
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Board / Historial de Picks */}
                    <div className="bg-card rounded-2xl border border-border flex flex-col h-[600px]">
                        <div className="p-4 border-b border-border">
                            <h3 className="font-bold text-textMain">Historial de Picks</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {draftState.turnos.map(t => (
                                <div key={t.id} className={clsx(
                                    "p-3 rounded-xl border flex flex-col gap-1",
                                    t.id === draftState.turnoActualId ? "border-accent bg-accent/5" : "border-border bg-surface",
                                    !t.completado && t.id !== draftState.turnoActualId && "opacity-50"
                                )}>
                                    <div className="flex justify-between items-center text-xs text-textMuted">
                                        <span>Ronda {t.ronda} • Pick #{t.numeroTurnoGlobal}</span>
                                        <span className="font-semibold">{t.nombreEquipo}</span>
                                    </div>
                                    {t.completado ? (
                                        <p className="font-bold text-sm text-textMain">
                                            {t.ronda === 11 
                                                ? (t.nombreDtElegido || `DT ID ${t.dtIdElegido}`)
                                                : (t.nombreJugadorElegido || `Jugador ID ${t.jugadorRealIdElegido}`)} 
                                            {t.fueAutoPick && <span className="text-red-400 ml-2 text-xs">(Auto-Pick)</span>}
                                        </p>
                                    ) : (
                                        <p className="text-sm italic text-textMuted">
                                            {t.id === draftState.turnoActualId ? "Eligiendo..." : "Pendiente"}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {esFinalizado && (
                <div className="animate-fade-in space-y-4">
                    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                        <h2 className="text-xl font-black text-textMain mb-4 flex items-center gap-2">
                            <span>Resumen de tu Draft</span>
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
                                <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider border-b border-border pb-2">Bases / Escoltas</h3>
                                {basesEscoltas.length > 0 ? basesEscoltas.map(j => (
                                    <div key={j.id} className="flex flex-col">
                                        <span className="text-sm font-bold text-textMain">{formatNombre(j.nombreCompleto)}</span>
                                        <span className="text-xs text-accent font-semibold">{j.posicion}</span>
                                    </div>
                                )) : <span className="text-xs text-textMuted italic">Ninguno</span>}
                            </div>
                            
                            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
                                <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider border-b border-border pb-2">Aleros / Ala-Pivots</h3>
                                {alerosAlapivots.length > 0 ? alerosAlapivots.map(j => (
                                    <div key={j.id} className="flex flex-col">
                                        <span className="text-sm font-bold text-textMain">{formatNombre(j.nombreCompleto)}</span>
                                        <span className="text-xs text-accent font-semibold">{j.posicion}</span>
                                    </div>
                                )) : <span className="text-xs text-textMuted italic">Ninguno</span>}
                            </div>
                            
                            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
                                <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider border-b border-border pb-2">Pivots</h3>
                                {pivots.length > 0 ? pivots.map(j => (
                                    <div key={j.id} className="flex flex-col">
                                        <span className="text-sm font-bold text-textMain">{formatNombre(j.nombreCompleto)}</span>
                                        <span className="text-xs text-accent font-semibold">{j.posicion}</span>
                                    </div>
                                )) : <span className="text-xs text-textMuted italic">Ninguno</span>}
                            </div>
                            
                            <div className="bg-surface border border-border rounded-xl p-4 flex flex-col gap-3">
                                <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider border-b border-border pb-2">Director Técnico</h3>
                                {miDt ? (
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-textMain">{formatNombre(miDt.nombreCompleto)}</span>
                                        <span className="text-xs text-accent font-semibold">DT</span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-textMuted italic">No seleccionado</span>
                                )}
                            </div>
                        </div>

                        {miPlantel && (
                            <div className="mt-8 bg-surface border border-border rounded-xl p-6">
                                <h3 className="text-lg font-black text-textMain mb-4">Roles de tu equipo</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2 min-w-0">
                                        <label className="text-sm font-bold text-textMain">Capitán</label>
                                        <select 
                                            value={capitanId} 
                                            onChange={e => setCapitanId(e.target.value)}
                                            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-textMain focus:outline-none focus:border-accent truncate"
                                        >
                                            <option value="">Seleccionar Capitán</option>
                                            {miPlantel.jugadores.map(j => (
                                                <option key={j.jugadorRealId} value={j.jugadorRealId} disabled={String(j.jugadorRealId) === sextoHombreId}>
                                                    {j.jugador?.nombreCompleto || j.nombreCompleto || 'Jugador'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-0">
                                        <label className="text-sm font-bold text-textMain">Sexto Hombre</label>
                                        <select 
                                            value={sextoHombreId} 
                                            onChange={e => setSextoHombreId(e.target.value)}
                                            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-textMain focus:outline-none focus:border-accent truncate"
                                        >
                                            <option value="">Seleccionar Sexto Hombre</option>
                                            {miPlantel.jugadores.map(j => (
                                                <option key={j.jugadorRealId} value={j.jugadorRealId} disabled={String(j.jugadorRealId) === capitanId}>
                                                    {j.jugador?.nombreCompleto || j.nombreCompleto || 'Jugador'}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        onClick={handleContinuarTorneo}
                                        disabled={procesandoRoles || !capitanId || !sextoHombreId || capitanId === sextoHombreId}
                                        className="bg-accent text-white font-bold py-3 px-8 rounded-xl disabled:opacity-50 hover:bg-accent/80 transition-colors shadow-lg shadow-accent/20"
                                    >
                                        {procesandoRoles ? 'Guardando...' : 'Guardar y Continuar al Torneo'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 🔮 Modal Confirmación 🔮 */}
            {confirmModal.open && createPortal(
                <>
                    <div className="fixed inset-0 bg-black/70 z-[60]" onClick={() => setConfirmModal({ open: false, action: null, message: '', title: '' })} />
                    <div className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-sm mx-auto
                          bg-card border-t border-border rounded-t-3xl md:rounded-3xl
                          z-[70] p-6 space-y-4 animate-slide-up md:animate-none">
                        <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />
                        <h3 className="text-textMain font-bold text-lg">{confirmModal.title || 'Confirmar acción'}</h3>
                        <p className="text-textMuted text-sm">{confirmModal.message}</p>
                        <div className="space-y-2 mt-4">
                            <button
                                onClick={confirmModal.action}
                                disabled={procesando}
                                className="w-full py-3 rounded-xl font-semibold bg-accent border border-accent text-white active:scale-95 transition-transform disabled:opacity-50"
                            >
                                {procesando ? 'Procesando...' : 'Sí, confirmar'}
                            </button>
                            <button
                                onClick={() => !procesando && setConfirmModal({ open: false, action: null, message: '', title: '' })}
                                disabled={procesando}
                                className="w-full py-2 text-textMuted text-sm font-medium disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* 🚨 Modal Error 🚨 */}
            {error && createPortal(
                <>
                    <div className="fixed inset-0 bg-black/70 z-[80]" onClick={() => setError('')} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm mx-auto
                          bg-card border border-red-500/30 rounded-3xl
                          z-[90] p-6 space-y-4 animate-scale-in text-center shadow-2xl shadow-red-500/10">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500 mb-2">
                            <span className="text-3xl">⚠️</span>
                        </div>
                        <h3 className="text-textMain font-black text-xl">Acción Inválida</h3>
                        <p className="text-textMuted text-sm font-medium leading-relaxed">{error}</p>
                        <div className="mt-6 pt-2">
                            <button
                                onClick={() => setError('')}
                                className="w-full py-3 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white active:scale-95 transition-all shadow-lg shadow-red-500/20"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}
        </div>
    )
}
