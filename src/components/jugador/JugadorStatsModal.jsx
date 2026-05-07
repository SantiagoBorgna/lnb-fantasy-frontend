import { createPortal } from 'react-dom'
import CamisetaSVG from './CamisetaSVG'
import clsx from 'clsx'

export default function JugadorStatsModal({ jugador, stats, onCerrar }) {
    if (!jugador) return null

    const jugoHoy = stats?.jugó

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onCerrar} />
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border rounded-t-3xl z-50 p-6 space-y-5 animate-slide-up" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-border rounded-full mx-auto" />

                {/* Cabecera */}
                <div className="flex items-center gap-4">
                    <CamisetaSVG colorPrincipal={jugador.colorPrincipal} colorSecundario={jugador.colorSecundario} numero={jugador.numeroCamiseta} estado={jugador.estado} modelo={jugador.modeloCamiseta} size={64} />
                    <div className="flex-1">
                        <h3 className="text-textMain font-bold text-lg leading-tight">{jugador.nombreCompleto}</h3>
                        <p className="text-textMuted text-sm">{jugador.equipoSigla} · {jugador.posicion}</p>
                        <p className="text-textMuted text-xs mt-0.5">{jugador.valorMercadoActual?.toFixed(1)} cr</p>
                    </div>
                    {/* Puntaje Principal */}
                    <div className="text-right">
                        <p className={clsx("font-black text-3xl", jugoHoy ? "text-accent" : "text-textMuted")}>
                            {jugoHoy ? stats.puntajeFantasy?.toFixed(1) : '--'}
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
                <div className="bg-surface rounded-2xl p-4 border border-border">
                    {jugoHoy ? (
                        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm max-h-64 overflow-y-auto pr-1">
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
                    )}
                </div>

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

function StatRow({ label, value, warning = false }) {
    // Para valores booleanos ("Sí"/"No"), evitamos pintar de rojo los "Sí" por error.
    const esValorNegativo = warning && typeof value === 'number' && value > 0

    return (
        <div className="flex justify-between items-center border-b border-white/5 pb-1">
            <span className="text-textMuted">{label}</span>
            <span className={clsx("font-bold tabular-nums", esValorNegativo ? "text-red-400" : "text-textMain")}>
                {value}
            </span>
        </div>
    )
}