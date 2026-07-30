import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getFixtureTorneo } from '../../api/torneoApi'
import { useAuthStore } from '../../store/authStore'
import MercadoWidget from './MercadoWidget'
import LoadingSpinner from '../ui/LoadingSpinner'
import clsx from 'clsx'

export default function DashboardDraftH2H({ rankingGlobal, contextoActual }) {
    const navigate = useNavigate()
    const usuario = useAuthStore(state => state.usuario)
    const [fixture, setFixture] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!contextoActual) return
        setLoading(true)
        getFixtureTorneo(contextoActual.id)
            .then(setFixture)
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [contextoActual])

    const miFila = useMemo(() => rankingGlobal.find(f => f.nombreUsuario === usuario?.nombreDisplay), [rankingGlobal, usuario]);
    const miEquipoId = miFila?.equipoVirtualId;

    const { proximoCruce, ultimoCruce } = useMemo(() => {
        let prox = null
        let ult = null

        if (fixture.length > 0 && miEquipoId) {
            // Filtrar solo los partidos de mi equipo
            const misPartidos = fixture.filter(
                p => p.equipoLocalId === miEquipoId || p.equipoVisitanteId === miEquipoId
            )
            // Último procesado
            ult = misPartidos.slice().reverse().find(p => p.procesado)
            // Próximo a jugar
            prox = misPartidos.find(p => !p.procesado)
        }
        return { proximoCruce: prox, ultimoCruce: ult }
    }, [fixture, miEquipoId])

    if (loading) {
        return <LoadingSpinner mensaje="Cargando tu cruce..." />
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* ── Columna 1: Mi Cruce ── */}
            <div className="h-full">
                <div className="card flex flex-col h-full">
                    <h3 className="text-textMain font-bold mb-4">
                        Resumen
                    </h3>

                    <div className="flex-1 flex flex-col gap-4">
                        {proximoCruce ? (() => {
                            const miLocalProx = proximoCruce.equipoLocalId === miEquipoId;
                            return (
                                <div className="bg-surface border border-border rounded-xl p-3 flex flex-col justify-center flex-1 gap-3">
                                <p className="text-textMuted text-xs uppercase font-bold text-center">Siguiente jornada</p>
                                {!proximoCruce.equipoVisitanteId ? (
                                    <div className="flex items-center justify-center py-1">
                                        <span className="text-textMain font-bold text-[15px]">Fecha libre</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className={clsx("flex-1 text-sm font-semibold text-right line-clamp-2 leading-tight", miLocalProx ? "text-primary" : "text-textMain")}>{proximoCruce.equipoLocalNombre}</span>
                                        <div className="w-24 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-1 mx-2">
                                            <span className="text-right text-sm font-black text-textMuted">-</span>
                                            <span className="text-center text-textMuted text-xs font-semibold mx-1">vs</span>
                                            <span className="text-left text-sm font-black text-textMuted">-</span>
                                        </div>
                                        <span className={clsx("flex-1 text-sm font-semibold text-left line-clamp-2 leading-tight", !miLocalProx ? "text-primary" : "text-textMain")}>{proximoCruce.equipoVisitanteNombre}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })() : (
                        <div className="bg-surface border border-border rounded-xl p-6 flex flex-col items-center justify-center flex-1 text-center">
                            <p className="text-textMuted text-sm">No hay próximos cruces programados.</p>
                        </div>
                    )}

                        {ultimoCruce && (() => {
                            const miLocalUlt = ultimoCruce.equipoLocalId === miEquipoId;
                            const ganaLocal = ultimoCruce.puntajeLocal > (ultimoCruce.equipoVisitanteId ? ultimoCruce.puntajeVisitante : 0);
                            const ganaVisita = ultimoCruce.equipoVisitanteId && ultimoCruce.puntajeVisitante > ultimoCruce.puntajeLocal;
                            return (
                                <div className="bg-surface border border-border rounded-xl p-3 flex flex-col justify-center flex-1 gap-3">
                                <p className="text-textMuted text-xs uppercase font-bold text-center">Última jornada</p>
                                {!ultimoCruce.equipoVisitanteId ? (
                                    <div className="flex items-center justify-center py-1">
                                        <span className="text-textMain font-bold text-[15px]">Fecha libre</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <span className={clsx("flex-1 text-sm font-semibold text-right line-clamp-2 leading-tight", miLocalUlt ? "text-primary" : "text-textMain")}>{ultimoCruce.equipoLocalNombre}</span>
                                        <div className="w-24 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-1 mx-2">
                                            <span className={clsx("text-right text-sm font-black", ganaLocal ? "text-accent" : "text-textMain")}>{Math.round(ultimoCruce.puntajeLocal)}</span>
                                            <span className="text-center text-textMuted text-xs font-semibold mx-1">-</span>
                                            <span className={clsx("text-left text-sm font-black", ganaVisita ? "text-accent" : "text-textMain")}>{Math.round(ultimoCruce.puntajeVisitante)}</span>
                                        </div>
                                        <span className={clsx("flex-1 text-sm font-semibold text-left line-clamp-2 leading-tight", !miLocalUlt ? "text-primary" : "text-textMain")}>{ultimoCruce.equipoVisitanteNombre}</span>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                    </div>
                    
                    <div className="mt-auto pt-4 shrink-0">
                        <button
                            onClick={() => navigate('/canchita')}
                            className="btn-primary w-full"
                        >
                            Ver equipo
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Columna 2: Tabla de Posiciones H2H ── */}
            <div className="h-full">
                <div className="card space-y-3 h-full flex flex-col">
                    <div className="flex items-center justify-between">
                        <h3 className="text-textMain font-bold">
                            Posiciones del Torneo
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {rankingGlobal.map(fila => (
                            <div key={`global-${fila.equipoVirtualId}`} className="flex items-center gap-3">
                                <span className={clsx(
                                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0',
                                    fila.posicion === 1 ? 'bg-yellow-500 text-white' : 
                                    fila.posicion === 2 ? 'bg-gray-400 text-white' : 
                                    fila.posicion === 3 ? 'bg-amber-700 text-white' : 
                                    'bg-border text-textMuted'
                                )}>
                                    {fila.posicion}
                                </span>
                                <p className="flex-1 text-textMain font-medium text-[15px] truncate">
                                    {fila.nombreEquipo}
                                </p>
                                <span className="text-accent font-bold text-[15px] tabular-nums shrink-0">
                                    {Math.round(fila.puntajeGlobal || 0)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Columna 3: Mercado ── */}
            <div className="h-full">
                <MercadoWidget torneoId={contextoActual.id} miEquipoId={miEquipoId} />
            </div>

        </div>
    )
}
