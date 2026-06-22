import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPlantelAjeno, getEstadisticasAjenas } from '../api/plantelApi'
import SlotJugador from '../components/plantel/SlotJugador'
import JugadorStatsModal from '../components/jugador/JugadorStatsModal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { esTitular, esBanco, zonasDeFormacion, esCompatible } from '../components/plantel/plantelUtils'
import clsx from 'clsx'

export default function CanchitaAjenaPage() {
    const { torneoId, equipoVirtualId, jornadaId } = useParams()
    const navigate = useNavigate()

    const [plantel, setPlantel] = useState(null)
    const [estadisticas, setEstadisticas] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [jugadorStats, setJugadorStats] = useState(null)

    useEffect(() => {
        setLoading(true)
        Promise.all([
            getPlantelAjeno(equipoVirtualId, jornadaId),
            getEstadisticasAjenas(equipoVirtualId, jornadaId)
        ])
        .then(([plantelData, statsData]) => {
            setPlantel(plantelData)
            const mapStats = {}
            statsData.forEach(s => mapStats[s.jugadorRealId] = s)
            setEstadisticas(mapStats)
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
        <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
            <p className="text-textMuted text-center">{error || 'El jugador no armó equipo en esta fecha.'}</p>
            <button 
                onClick={() => navigate(`/torneos/${torneoId}`)}
                className="py-2 px-6 rounded-full font-bold bg-surface border border-border text-textMain"
            >
                Volver al torneo
            </button>
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
    const bancofila1 = [sexto, ...suplentes.slice(0, 2)].filter(Boolean)
    const bancofila2 = suplentes.slice(2, 4)

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
        <div className="max-w-md mx-auto w-full px-4 space-y-3 pb-6 min-h-screen pt-4">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between pb-2">
                <div>
                    <button
                        onClick={() => navigate(`/torneos/${torneoId}`)}
                        className="text-textMuted text-xs mb-1 flex items-center gap-1 hover:text-textMain transition-colors"
                    >
                        ← Volver al torneo
                    </button>
                    <h1 className="text-textMain font-bold text-xl truncate max-w-[180px]">
                        {plantel.nombreEquipo}
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-textMuted text-xs">Jornada {plantel.jornadaNumero}</span>
                        <span className="text-textMuted text-xs">· Formación {plantel.formacion || 'ND'}</span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-accent font-bold text-lg">{puntajeEnVivo.toFixed(1)} pts</p>
                </div>
            </div>

            {/* ── Cancha (Titulares) ─────────────────────────────────── */}
            <div className="relative rounded-3xl overflow-hidden shadow-inner border border-black/10" style={{ backgroundColor: '#e29b5a', backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.06) 40px, rgba(0,0,0,0.06) 80px)' }}>

                <div className="absolute inset-0 pointer-events-none border-2 border-black/50 m-2">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[88%] max-w-[340px] h-[280px] border-x-2 border-t-2 border-black/50 rounded-t-[150px]" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[130px] h-[190px] border-x-2 border-t-2 border-black/50 bg-black/5" />
                    <div className="absolute bottom-[190px] left-1/2 -translate-x-1/2 translate-y-1/2 w-[120px] h-[120px] border-2 border-black/50 rounded-full" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-1 bg-black/60" />
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-5 h-5 border-2 border-black/60 rounded-full" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-[70px] border-x-2 border-b-2 border-black/50 rounded-b-[70px]" />
                </div>

                <div className="relative z-10 py-6 px-1 flex flex-col justify-between h-[500px]">
                    {filas.map((fila, filaIdx) => (
                        <div key={filaIdx} className="flex justify-center gap-x-8 items-start">
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

            {/* ── DT ─────────────────────────────────────────────────── */}
            {plantel.dt && (
                <div
                    className="card flex items-center gap-3 py-2 cursor-pointer transition-transform hover:border-primary mt-4"
                >
                    <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">DT</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-textMain font-semibold text-sm truncate">{plantel.dt.nombreCompleto}</p>
                        <p className="text-textMuted text-xs">{plantel.dt.equipoSigla}</p>
                    </div>
                    {plantel.puntajeDt != null && (
                        <div className="flex flex-col items-end shrink-0">
                            <span className={`font-black text-lg tabular-nums ${plantel.puntajeDt >= 0 ? 'text-accent' : 'text-red-400'}`}>
                                {plantel.puntajeDt > 0 ? '+' : ''}
                                {plantel.puntajeDt?.toFixed(1)}
                            </span>
                            <span className="text-textMuted text-xs">pts DT</span>
                        </div>
                    )}
                </div>
            )}

            {/* ── Suplentes ──────────────────────────────────────────── */}
            <div className="mt-6">
                <h2 className="text-textMuted text-xs font-semibold uppercase tracking-wider mb-4 pl-2 text-center">Banco de Suplentes</h2>
                <div className="space-y-6">
                    <div className="flex justify-center gap-x-8">
                        {bancofila1.map((jugador) => {
                            const stats = estadisticas[jugador.jugadorRealId]
                            return (
                                <SlotJugador
                                    key={jugador.jugadorRealId}
                                    jugador={jugador}
                                    esSexto={jugador.rol === 'SEXTO_HOMBRE'}
                                    puntosJornada={stats?.jugó ? (stats.puntajeFantasy * jugador.multiplicador) : null}
                                    onClick={() => setJugadorStats({ jugador, stats })}
                                    readonly={true}
                                />)
                        })}
                    </div>
                    {bancofila2.length > 0 && (
                        <div className="flex justify-center gap-x-8">
                            {bancofila2.map((jugador) => {
                                const stats = estadisticas[jugador.jugadorRealId]
                                return (
                                    <SlotJugador
                                        key={jugador.jugadorRealId}
                                        jugador={jugador}
                                        esSexto={jugador.rol === 'SEXTO_HOMBRE'}
                                        puntosJornada={stats?.jugó ? (stats.puntajeFantasy * jugador.multiplicador) : null}
                                        onClick={() => setJugadorStats({ jugador, stats })}
                                        readonly={true}
                                    />)
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Estadísticas */}
            {jugadorStats && (
                <JugadorStatsModal 
                    jugador={jugadorStats.jugador} 
                    stats={jugadorStats.stats} 
                    onCerrar={() => setJugadorStats(null)} 
                />
            )}
        </div>
    )
}
