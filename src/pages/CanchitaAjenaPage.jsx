import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPlantelAjeno, getEstadisticasAjenas, getPlantelActualAjeno, getEstadisticasActualesAjenas } from '../api/plantelApi'
import { getTorneo } from '../api/torneoApi'
import { encodeId, decodeMultiple } from '../utils/urlParams'
import SlotJugador from '../components/plantel/SlotJugador'
import JugadorStatsModal from '../components/jugador/JugadorStatsModal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { esTitular, esBanco, zonasDeFormacion, esCompatible } from '../components/plantel/plantelUtils'
import ProponerTraspasoWizard from '../components/mercado/ProponerTraspasoWizard'
import { useAuthStore } from '../store/authStore'
import clsx from 'clsx'
import EmptyState from '../components/ui/EmptyState'

export default function CanchitaAjenaPage() {
    const { hashData } = useParams()
    const [torneoId, equipoVirtualId, decodedJornadaId] = decodeMultiple(hashData)
    const jornadaId = decodedJornadaId === 999999 ? 'actual' : decodedJornadaId;
    const navigate = useNavigate()

    const [plantel, setPlantel] = useState(null)
    const [torneo, setTorneo] = useState(null)
    const [estadisticas, setEstadisticas] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [jugadorStats, setJugadorStats] = useState(null)

    const usuario = useAuthStore(state => state.usuario)
    const [showWizard, setShowWizard] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    useEffect(() => {
        setLoading(true)
        const fetchPlantel = jornadaId === 'actual' 
            ? getPlantelActualAjeno(equipoVirtualId, torneoId)
            : getPlantelAjeno(equipoVirtualId, jornadaId, torneoId);
        const fetchEstadisticas = jornadaId === 'actual'
            ? getEstadisticasActualesAjenas(equipoVirtualId, torneoId)
            : getEstadisticasAjenas(equipoVirtualId, jornadaId, torneoId);

        Promise.all([
            fetchPlantel,
            fetchEstadisticas,
            torneoId ? getTorneo(torneoId) : Promise.resolve(null)
        ])
        .then(([plantelData, statsData, torneoData]) => {
            setPlantel(plantelData)
            const mapStats = {}
            statsData.forEach(s => mapStats[s.jugadorRealId] = s)
            setEstadisticas(mapStats)
            setTorneo(torneoData)
            setLoading(false)
        })
        .catch(err => {
            console.error(err)
            setError(err.response?.data?.mensaje || 'No se pudo cargar el equipo rival.')
            setLoading(false)
        })
    }, [equipoVirtualId, jornadaId])

    if (loading) return <LoadingSpinner mensaje="Cargando equipo rival..." />

    if (error || !plantel) return (
        <div className="pt-20 max-w-md mx-auto">
            <EmptyState
                titulo="No disponible"
                descripcion={error || 'El jugador no armó equipo en esta fecha.'}
                accion={{ label: 'Volver al torneo', onClick: () => navigate(`/t/${encodeId(torneoId)}`) }}
            />
        </div>
    )

    const getTitularesOrdenados = () => {
        const titularesSinOrdenar = plantel.jugadores.filter(j => esTitular(j.rol))
        const zonas = zonasDeFormacion(plantel.formacion) || []
        const ordenados = []
        const disponibles = [...titularesSinOrdenar]

        zonas.forEach(zona => {
            const index = disponibles.findIndex(j => esCompatible(j.posicion, zona))
            if (index !== -1) {
                ordenados.push(disponibles[index])
                disponibles.splice(index, 1)
            }
        })
        ordenados.push(...disponibles)
        return ordenados
    }

    const titulares = getTitularesOrdenados()
    const banco = plantel.jugadores.filter(j => esBanco(j.rol))
    const sexto = banco.find(j => j.rol === 'SEXTO_HOMBRE')
    const suplentes = banco.filter(j => j.rol === 'SUPLENTE')
    const bancoCompleto = [sexto, ...suplentes].filter(Boolean)

    const filas = []
    let cursor = 0
    plantel.formacion?.split('-').forEach(n => {
        filas.push(titulares.slice(cursor, cursor + Number(n)))
        cursor += Number(n)
    })

    let puntajeEnVivo = plantel.puntajeObtenidoFecha ?? 0
    if (Object.keys(estadisticas).length > 0) {
        let sum = 0
        plantel.jugadores.forEach(j => {
            const s = estadisticas[j.jugadorRealId]
            if (s && s.jugó) {
                sum += (s.puntajeFantasy * j.multiplicador)
            }
        })
        if (plantel.puntajeDt != null) {
            sum += plantel.puntajeDt
        }
        puntajeEnVivo = sum
    }

    return (
        <div className="max-w-md md:max-w-none mx-auto w-full px-2 lg:px-4 space-y-3 pb-[10px] min-h-[calc(100vh-80px)] pt-4 overflow-x-hidden">
            <div className="flex flex-col md:flex-row items-center md:items-stretch w-full">
                
                {/* COLUMNA IZQUIERDA: Header y Cancha */}
                <div className="w-full md:w-1/2 flex flex-col items-center pb-0">
                    {/* ── Header ─────────────────────────────────────────────── */}
                    <div className="flex items-center justify-between w-full max-w-[480px] pb-2">
                        <div className="text-left w-auto">
                            <button
                                onClick={() => navigate(`/t/${encodeId(torneoId)}`)}
                                className="text-textMuted text-xs mb-1 flex items-center justify-start gap-1 hover:text-textMain transition-colors w-full"
                            >
                                ← Volver al torneo
                            </button>
                            <h1 className="text-textMain font-bold text-lg md:text-xl truncate max-w-[180px] md:max-w-[220px]">
                                {plantel.nombreEquipo}
                            </h1>
                            <div className="flex items-center justify-start gap-2 mt-1">
                                <span className="text-textMuted text-[10px] md:text-xs">Jornada {plantel.jornadaNumero}</span>
                                <span className="text-textMuted text-[10px] md:text-xs">· Formación {plantel.formacion || 'ND'}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            {torneo?.modalidad !== 'DRAFT' && (
                                <p className="text-accent font-bold text-base md:text-lg">{puntajeEnVivo.toFixed(1)} pts</p>
                            )}
                        </div>
                    </div>

                    {/* Botón de Traspaso (Solo Mobile - Arriba de la Cancha) */}
                    {plantel.nombreUsuario !== usuario?.nombreDisplay && (
                        <div className="md:hidden w-full flex justify-center mb-4">
                            <button 
                                onClick={() => setShowWizard(true)}
                                className="bg-primary/20 text-primary border border-primary/40 px-6 py-3 rounded-xl font-bold hover:bg-primary/30 transition-colors w-full max-w-md"
                            >
                                Proponer Traspaso
                            </button>
                        </div>
                    )}

                    {/* ── Cancha (Titulares) ─────────────────────────────────── */}
                    <div className="relative rounded-3xl overflow-hidden shadow-inner border border-black/10 w-full max-w-[480px] mx-auto" style={{ backgroundColor: '#e29b5a', backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.06) 40px, rgba(0,0,0,0.06) 80px)' }}>

                        <div className="absolute inset-0 pointer-events-none border-2 border-black/50 m-2">
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[88%] max-w-[340px] h-[280px] border-x-2 border-t-2 border-black/50 rounded-t-[150px]" />
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[130px] h-[190px] border-x-2 border-t-2 border-black/50 bg-black/5" />
                            <div className="absolute bottom-[190px] left-1/2 -translate-x-1/2 translate-y-1/2 w-[120px] h-[120px] border-2 border-black/50 rounded-full" />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-1 bg-black/60" />
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-5 h-5 border-2 border-black/60 rounded-full" />
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-[70px] border-x-2 border-b-2 border-black/50 rounded-b-[70px]" />
                        </div>

                        <div className="relative z-10 py-6 md:py-8 px-1 flex flex-col justify-between h-[440px] md:h-[540px] xl:h-[600px]">
                            {filas.map((fila, filaIdx) => (
                                <div key={filaIdx} className="flex justify-center gap-x-2 md:gap-x-8 items-start">
                                    {fila.map((jugador) => {
                                        const stats = estadisticas[jugador.jugadorRealId]
                                        return (
                                            <SlotJugador
                                                key={jugador.jugadorRealId}
                                                jugador={jugador}
                                                puntosJornada={stats?.jugó ? (stats.puntajeFantasy * jugador.multiplicador) : null}
                                                onClick={() => setJugadorStats({ jugador, stats })}
                                                readonly={true}
                                            />
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* LINEA VERTICAL DESKTOP */}
                <div className="hidden md:block w-px bg-border self-stretch mx-4 lg:mx-8"></div>

                {/* COLUMNA DERECHA: Traspaso, DT, Suplentes */}
                <div className="w-full md:w-1/2 flex flex-col items-center gap-6 md:gap-10 pt-8 md:pt-20 pb-0">
                    
                    {/* Botón de Traspaso (Solo Desktop) */}
                    {plantel.nombreUsuario !== usuario?.nombreDisplay && (
                        <div className="hidden md:flex w-full justify-center mt-4 md:mt-0">
                            <button 
                                onClick={() => setShowWizard(true)}
                                className="bg-primary/20 text-primary border border-primary/40 px-6 py-3 rounded-xl font-bold hover:bg-primary/30 transition-colors w-full max-w-md"
                            >
                                Proponer Traspaso
                            </button>
                        </div>
                    )}

                    {/* ── DT ─────────────────────────────────────────────────── */}
                    {plantel.dt && (
                        <div className="card flex items-center gap-3 py-2 px-4 cursor-pointer transition-transform hover:border-primary w-full max-w-md">
                            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">DT</div>
                            <div className="flex-1 min-w-0 text-left">
                                <p className="text-textMain font-semibold text-sm truncate">{plantel.dt.nombreCompleto}</p>
                                <p className="text-textMuted text-xs">{plantel.dt.equipoSigla}</p>
                            </div>
                            {plantel.dt.promedioFantasy != null && (
                                <div className="flex flex-col items-end shrink-0">
                                    <span className={`font-black text-lg tabular-nums ${plantel.dt.promedioFantasy >= 0 ? 'text-accent' : 'text-red-400'}`}>
                                        {plantel.dt.promedioFantasy?.toFixed(1)}
                                    </span>
                                    <span className="text-textMuted text-[10px] uppercase font-bold tracking-wider">Promedio</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Suplentes ──────────────────────────────────────────── */}
                    <div className="w-full mt-2 md:mt-0">
                        <h2 className="text-textMuted text-xs font-semibold uppercase tracking-wider mb-4 text-center">Banco de Suplentes</h2>
                        <div className="space-y-4">
                            {(() => {
                                const renderSlot = (jugador) => {
                                    const stats = estadisticas[jugador.jugadorRealId]
                                    return (
                                        <SlotJugador
                                            key={jugador.jugadorRealId}
                                            jugador={jugador}
                                            esSexto={jugador.rol === 'SEXTO_HOMBRE'}
                                            puntosJornada={stats?.jugó ? (stats.puntajeFantasy * jugador.multiplicador) : null}
                                            onClick={() => setJugadorStats({ jugador, stats })}
                                            readonly={true}
                                        />
                                    )
                                }

                                return (
                                    <>
                                        {/* VISTA 2 FILAS */}
                                        <div className="flex flex-col gap-6 md:gap-8">
                                            <div className="flex justify-center gap-x-4 md:gap-x-6 w-full">
                                                {bancoCompleto.slice(0, 3).map(renderSlot)}
                                            </div>
                                            <div className="flex justify-center gap-x-4 md:gap-x-6 w-full">
                                                {bancoCompleto.slice(3, 5).map(renderSlot)}
                                            </div>
                                        </div>
                                    </>
                                )
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal de Estadísticas */}
            {jugadorStats && (
                <JugadorStatsModal 
                    jugador={jugadorStats.jugador} 
                    stats={null} 
                    onCerrar={() => setJugadorStats(null)} 
                    esDraft={torneo?.modalidad === 'DRAFT'}
                    mostrarPromedios={true}
                />
            )}

            {/* Wizard de Traspasos */}
            {showWizard && (
                <ProponerTraspasoWizard 
                    torneoId={torneoId}
                    equipoVirtualId={equipoVirtualId}
                    jornadaId={jornadaId}
                    equipoReceptorNombre={plantel.nombreEquipo}
                    onClose={() => setShowWizard(false)}
                    onSuccess={() => {
                        setShowWizard(false)
                        setShowSuccessModal(true)
                    }}
                />
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                    <div className="bg-surface rounded-2xl w-full max-w-sm shadow-lg border border-green-500/20 p-6 flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-textMain font-bold text-xl mb-2">¡Propuesta Enviada!</h2>
                        <p className="text-textMuted text-sm mb-6">El otro mánager será notificado para que revise tu propuesta de traspaso.</p>
                        <button 
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full px-4 py-2 text-sm text-black bg-primary hover:bg-primary/90 rounded-xl font-bold transition-colors"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
