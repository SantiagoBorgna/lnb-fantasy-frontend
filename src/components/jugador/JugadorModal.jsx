import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { getJugadorStats } from '../../api/mercadoApi'
import clsx from 'clsx'
import CamisetaSVG from './CamisetaSVG'

export default function JugadorModal({
    jugador,
    esTitularActual,
    onCerrar,
    onHacerCapitan,
    onCambiar,
    onTransferir,
    onHacerSexto,
    esDraft,
}) {
    if (!jugador) return null

    const isDT = !jugador.posicion || jugador.posicion === 'DT';
    
    const { data: statsPromedio, isLoading } = useQuery({
        queryKey: ['jugadorStats', jugador.jugadorRealId || jugador.id],
        queryFn: () => getJugadorStats(jugador.jugadorRealId || jugador.id),
        enabled: !isDT
    })

    const handleAccion = (accion, e) => {
        e.stopPropagation()
        accion(jugador)
        if (accion !== onCambiar) onCerrar()
    }

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onCerrar} />
            <div className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md mx-auto bg-card border-t border-border rounded-t-3xl md:rounded-3xl z-50 p-6 space-y-5 animate-slide-up md:animate-none max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden shrink-0" />
                <div className="flex items-center gap-4">
                    <CamisetaSVG colorPrincipal={jugador.colorPrincipal} colorSecundario={jugador.colorSecundario} numero={jugador.posicion === 'DT' ? 'DT' : jugador.numeroCamiseta} estado={jugador.estado} modelo={jugador.modeloCamiseta} size={64} />
                    <div>
                        <h3 className="text-textMain font-bold text-lg leading-tight">{jugador.nombreCompleto}</h3>
                        <p className="text-textMuted text-sm">{jugador.equipoSigla} {jugador.posicion}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                            {!esDraft && (
                                <p className="text-accent font-semibold text-sm">{jugador.valorMercadoActual?.toFixed(1)} cr</p>
                            )}
                            {jugador.estado && (
                                <span className={clsx(
                                    "text-sm font-semibold capitalize",
                                    jugador.estado === 'DISPONIBLE' ? 'text-green-400' :
                                    jugador.estado === 'LESIONADO' ? 'text-red-400' :
                                    jugador.estado === 'BAJA' ? 'text-gray-400' :
                                    'text-yellow-400'
                                )}>
                                    {jugador.estado === 'BAJA' ? 'Cortado' : jugador.estado.toLowerCase()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {isDT && jugador.promedioPuntosUltimas3 > 0 && (
                    <div className="bg-surface rounded-2xl p-3 text-center border border-border">
                        <p className="text-textMuted text-xs mb-1">Promedio Fantasy (últ. 3 partidos)</p>
                        <p className="text-accent font-bold text-2xl">{jugador.promedioPuntosUltimas3?.toFixed(1)}</p>
                        <p className="text-textMuted text-xs">puntos</p>
                    </div>
                )}

                {!isDT && (
                    <div className="bg-surface rounded-2xl p-4 border border-border">
                        {isLoading ? (
                            <div className="py-4 flex justify-center">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (!statsPromedio || statsPromedio.partidosJugados === 0) ? (
                            <div className="text-center text-textMuted flex flex-col items-center gap-1">
                                <p className="font-medium text-xs">Todavía no tiene estadísticas.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-[13px]">
                                <div className="col-span-2 text-center pb-2 border-b border-border mb-1">
                                    <p className="text-textMuted text-[10px] uppercase font-bold tracking-wider">
                                        Promedios ({statsPromedio.partidosJugados} {statsPromedio.partidosJugados === 1 ? 'partido' : 'partidos'})
                                    </p>
                                </div>
                                <StatRow label="Puntos" value={statsPromedio.promedioPuntos?.toFixed(1)} />
                                <StatRow label="Asistencias" value={statsPromedio.promedioAsistencias?.toFixed(1)} />
                                <StatRow label="Reb. Def." value={statsPromedio.promedioRebotesDefensivos?.toFixed(1)} />
                                <StatRow label="Reb. Of." value={statsPromedio.promedioRebotesOfensivos?.toFixed(1)} />
                                <StatRow label="Recuperos" value={statsPromedio.promedioRobos?.toFixed(1)} />
                                <StatRow label="Tapones" value={statsPromedio.promedioTaponesRealizados?.toFixed(1)} />
                                <StatRow label="Faltas Recib." value={statsPromedio.promedioFaltasRecibidas?.toFixed(1)} />
                                <StatRow label="Pérdidas" value={statsPromedio.promedioPerdidas?.toFixed(1)} warning />
                                <StatRow label="Tap. Recib." value={statsPromedio.promedioTaponesRecibidos?.toFixed(1)} warning />
                                <StatRow label="Faltas Com." value={statsPromedio.promedioFaltasCometidas?.toFixed(1)} warning />
                                <StatRow label="TC Fallados" value={statsPromedio.promedioTirosCampoFallados?.toFixed(1)} warning />
                                <StatRow label="TL Fallados" value={statsPromedio.promedioTirosLibresFallados?.toFixed(1)} warning />
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-3">
                    {onHacerCapitan && (
                        <button onClick={(e) => handleAccion(onHacerCapitan, e)} className="w-full py-3 px-4 rounded-xl font-bold bg-transparent border-2 border-yellow-400 text-yellow-400 active:scale-95 transition-transform">
                            Hacer Capitán
                        </button>
                    )}

                    {onHacerSexto && (
                        <button onClick={(e) => handleAccion(onHacerSexto, e)} className="w-full py-3 px-4 rounded-xl font-bold bg-transparent border-2 border-primary text-primary active:scale-95 transition-transform">
                            Asignar Sexto Hombre
                        </button>
                    )}

                    {onCambiar && (
                        <button onClick={(e) => handleAccion(onCambiar, e)} className="w-full py-3 px-4 rounded-xl font-bold bg-transparent border-2 border-white text-white active:scale-95 transition-transform">
                            {esTitularActual ? 'Cambiar por suplente' : 'Cambiar a titular'}
                        </button>
                    )}

                    {onTransferir && (
                        <button onClick={(e) => handleAccion(onTransferir, e)} className="w-full py-2 px-4 rounded-xl font-semibold border border-accent text-accent active:scale-95 transition-transform">
                            Transferir jugador
                        </button>
                    )}
                    <button onClick={onCerrar} className="w-full py-2 text-textMuted text-sm font-medium">Cancelar</button>
                </div>
            </div>
        </>,
        document.body
    )
}

function StatRow({ label, value, warning = false }) {
    const esValorNegativo = warning && typeof value !== 'boolean' && value !== 'Sí' && value !== 'No' && Number(value) > 0;
    return (
        <div className="flex justify-between items-center border-b border-border/50 pb-1">
            <span className="text-textMuted">{label}</span>
            <span className={clsx("font-bold tabular-nums", esValorNegativo ? "text-red-400" : "text-textMain")}>
                {value ?? '0.0'}
            </span>
        </div>
    );
}