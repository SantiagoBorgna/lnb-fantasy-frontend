import { createPortal } from 'react-dom'
import CamisetaSVG from './CamisetaSVG'
import clsx from 'clsx'
import { useQuery } from '@tanstack/react-query'
import { getJugadorStats } from '../../api/mercadoApi'

export default function JugadorStatsModal({ jugador, stats, onCerrar, esDraft, mostrarPromedios }) {
    if (!jugador) return null

    const isDT = !jugador.posicion;
    const jugoHoy = !mostrarPromedios && stats?.jugó

    const { data: statsPromedio, isLoading } = useQuery({
        queryKey: ['jugadorStats', jugador.jugadorRealId || jugador.id],
        queryFn: () => getJugadorStats(jugador.jugadorRealId || jugador.id),
        enabled: !!mostrarPromedios && !isDT
    })

    const renderPromedios = () => {
        if (isDT) return null;
        
        if (isLoading) {
            return (
                <div className="py-6 flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            )
        }
        if (!statsPromedio || statsPromedio.partidosJugados === 0) {
            return (
                <div className="py-6 text-center text-textMuted flex flex-col items-center gap-2">
                    <span className="text-3xl">🏜️</span>
                    <p className="font-medium text-sm">Todavía no tiene estadísticas.</p>
                </div>
            )
        }
        return (
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm md:text-base pr-1">
                <div className="col-span-2 text-center pb-2 border-b border-border mb-2">
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
                <StatRow label="Faltas Recibidas" value={statsPromedio.promedioFaltasRecibidas?.toFixed(1)} />
                <StatRow label="Pérdidas" value={statsPromedio.promedioPerdidas?.toFixed(1)} warning />
                <StatRow label="Tap. Recibidos" value={statsPromedio.promedioTaponesRecibidos?.toFixed(1)} warning />
                <StatRow label="Faltas Cometidas" value={statsPromedio.promedioFaltasCometidas?.toFixed(1)} warning />
                <StatRow label="TC Fallados" value={statsPromedio.promedioTirosCampoFallados?.toFixed(1)} warning />
                <StatRow label="TL Fallados" value={statsPromedio.promedioTirosLibresFallados?.toFixed(1)} warning />
            </div>
        )
    }

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onCerrar} />
            <div className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md md:max-w-lg mx-auto bg-card border-t border-border rounded-t-3xl md:rounded-3xl z-50 p-6 md:p-8 space-y-5 md:space-y-6 animate-slide-up md:animate-none max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />

                {/* Cabecera */}
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="md:scale-125 md:origin-left transition-transform">
                        <CamisetaSVG colorPrincipal={jugador.colorPrincipal} colorSecundario={jugador.colorSecundario} numero={jugador.posicion ? jugador.numeroCamiseta : 'DT'} estado={jugador.estado} modelo={jugador.modeloCamiseta} size={64} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-textMain font-bold text-lg md:text-xl leading-tight">{jugador.nombreCompleto}</h3>
                        <p className="text-textMuted text-sm md:text-base">{jugador.equipoSigla} • {jugador.posicion || 'DT'}</p>
                        {!esDraft && !isDT && <p className="text-textMuted text-xs md:text-sm mt-0.5">{jugador.valorMercadoActual?.toFixed(1)} cr</p>}
                    </div>
                    {/* Puntaje Principal */}
                    <div className="text-right">
                        {jugoHoy && <SellosBonos stats={stats} />}
                        <p className={clsx("font-black text-3xl md:text-4xl", (jugoHoy || (mostrarPromedios && (statsPromedio || isDT))) ? "text-accent" : "text-textMuted")}>
                            {mostrarPromedios ? (isDT ? (jugador.promedioFantasy?.toFixed(1) ?? '--') : (statsPromedio?.promedioFantasy?.toFixed(1) ?? '--')) : (jugoHoy ? stats.puntajeFantasy?.toFixed(1) : '--')}
                        </p>
                        <p className="text-textMuted text-[10px] uppercase font-bold tracking-wider">
                            Puntos Fantasy
                        </p>
                        {/* Etiqueta de aclaración para suplentes/capitanes */}
                        {jugoHoy && jugador.multiplicador !== 1 && (
                            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-textMuted mt-1 inline-block">
                                (x{jugador.multiplicador})
                            </span>
                        )}
                    </div>
                </div>

                {/* Estadísticas Detalladas */}
                {!isDT && (
                    <div className="bg-surface rounded-2xl p-4 md:p-6 border border-border">
                        {mostrarPromedios ? renderPromedios() : (
                        jugoHoy ? (
                            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm md:text-base pr-1">
                                <StatRow label="Titular" value={stats.fueTitular ? 'Sí' : 'No'} />
                                <StatRow label="Victoria" value={stats.gano ? 'Sí' : 'No'} />
                                <StatRow label="Puntos" value={stats.puntos} />
                                <StatRow label="Asistencias" value={stats.asistencias} />
                                <StatRow label="Reb. Def." value={stats.rebotesDefensivos} />
                                <StatRow label="Reb. Of." value={stats.rebotesOfensivos} />
                                <StatRow label="Recuperos" value={stats.recuperaciones} />
                                <StatRow label="Tapones" value={stats.taponesRealizados} />
                                <StatRow label="Faltas Recibidas" value={stats.faltasRecibidas} />
                                <StatRow label="Pérdidas" value={stats.perdidas} warning />
                                <StatRow label="Tap. Recibidos" value={stats.taponesRecibidos} warning />
                                <StatRow label="Faltas Cometidas" value={stats.faltasCometidas} warning />
                                <StatRow label="TC Fallados" value={stats.tirosDeCampoFallados} warning />
                                <StatRow label="TL Fallados" value={stats.tirosLibresFallados} warning />
                            </div>
                        ) : (
                            <div className="py-6 text-center text-textMuted flex flex-col items-center gap-2">
                                <span className="text-3xl">⏳</span>
                                <p className="font-medium text-sm">Todavía no jugó en esta jornada.</p>
                            </div>
                        )
                    )}
                    </div>
                )}

                <div className="space-y-3 pt-2">
                    <button onClick={onCerrar} className="w-full py-3 bg-surface border border-border text-textMain rounded-xl font-bold active:scale-95 transition-transform">
                        Cerrar
                    </button>
                </div>
            </div>
        </>,
        document.body
    )
}

// Sellos de los bonos que sumó en la jornada. El triple-doble reemplaza al doble-doble,
// así que como mucho se ven dos (TD/DD + MVP). Si no sumó ningún bono no se muestra nada.
function SellosBonos({ stats }) {
    const { dobleDoble, tripleDoble, fueMvp } = stats
    if (!dobleDoble && !tripleDoble && !fueMvp) return null

    return (
        <div className="flex justify-end items-center gap-1.5 mb-1">
            {tripleDoble && <SelloRedondo texto="TD" titulo="Triple-doble: +15" className="border-violet-300 bg-violet-500" />}
            {dobleDoble && <SelloRedondo texto="DD" titulo="Doble-doble: +5" className="border-sky-300 bg-sky-500" />}
            {fueMvp && (
                <span title="MVP del partido: +10" className="relative inline-flex w-10 h-10 md:w-11 md:h-11">
                    <svg viewBox="0 0 24 24" className="absolute inset-0 w-full h-full text-yellow-400 drop-shadow" aria-hidden="true">
                        <path fill="currentColor" d="M12 1.5l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.6l-6.4 3.5 1.4-7.1-5.3-5 7.2-.9z" />
                    </svg>
                    {/* El centro visual de la estrella queda un poco más abajo que el centro de la caja */}
                    <span className="absolute inset-0 flex items-center justify-center pt-[3px] text-[9px] md:text-[10px] leading-none font-bold tracking-tighter text-surface">
                        MVP
                    </span>
                </span>
            )}
        </div>
    )
}

function SelloRedondo({ texto, titulo, className }) {
    return (
        <span title={titulo} className={clsx("inline-flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full border-2 text-xs md:text-[13px] leading-none font-bold tracking-tight text-white", className)}>
            {texto}
        </span>
    )
}

function StatRow({ label, value, warning = false }) {
    // Para valores booleanos ("Sí"/"No"), evitamos pintar de rojo los "Sí" por error.
    const esValorNegativo = warning && typeof value !== 'boolean' && value !== 'Sí' && value !== 'No' && Number(value) > 0

    return (
        <div className="flex justify-between items-center border-b border-white/5 pb-1">
            <span className="text-textMuted">{label}</span>
            <span className={clsx("font-bold tabular-nums", esValorNegativo ? "text-red-400" : "text-textMain")}>
                {value ?? '0.0'}
            </span>
        </div>
    )
}