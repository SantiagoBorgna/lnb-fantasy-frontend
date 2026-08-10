import { createPortal } from 'react-dom';
import CamisetaSVG from '../jugador/CamisetaSVG';
import clsx from 'clsx';

export default function ShowdownStatsModal({ isOpen, onClose, jugador }) {
    if (!isOpen || !jugador) return null;
    
    const colorPrincipal = jugador.equipoColorPrincipal || jugador.equipoReal?.colorPrincipal;
    const colorSecundario = jugador.equipoColorSecundario || jugador.equipoReal?.colorSecundario;
    const modelo = jugador.equipoModeloCamiseta || jugador.equipoReal?.modeloCamiseta;
    
    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
            <div className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md mx-auto bg-card border-t border-border rounded-t-3xl md:rounded-3xl z-50 p-6 md:p-8 space-y-5 md:space-y-6 animate-slide-up md:animate-none max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />
                
                {/* Cabecera */}
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="md:scale-125 md:origin-left transition-transform">
                        <CamisetaSVG
                            colorPrincipal={colorPrincipal}
                            colorSecundario={colorSecundario}
                            modelo={modelo}
                            numero={jugador.numeroCamiseta}
                            estado={jugador.estado}
                            size={64}
                        />
                    </div>
                    <div className="flex-1">
                        {(() => {
                            const partes = jugador.nombreCompleto ? jugador.nombreCompleto.split(',') : (jugador.apellido ? [jugador.apellido, jugador.nombre] : ['']);
                            const apellido = partes[0]?.trim();
                            const nombre = partes[1]?.trim();
                            return <h3 className="text-textMain font-bold text-lg md:text-xl leading-tight">{nombre ? `${nombre} ${apellido}` : apellido}</h3>;
                        })()}
                        <p className="text-textMuted text-sm md:text-base">{jugador.equipoSigla} • {jugador.posicion.replace('_', ' ')}</p>
                    </div>
                    
                    {/* Puntaje Principal */}
                    <div className="text-right">
                        <p className={clsx("font-black text-3xl md:text-4xl", "text-accent")}>
                            {jugador.puntosAportados?.toFixed(1) ?? '0.0'}
                        </p>
                        <p className="text-textMuted text-[10px] uppercase font-bold tracking-wider">
                            Puntos Fantasy
                        </p>
                        {jugador.esCapitan && (
                            <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-textMuted mt-1 inline-block">
                                Capitán (x1.5)
                            </span>
                        )}
                    </div>
                </div>
                
                {/* Estadísticas Detalladas */}
                <div className="bg-surface rounded-2xl p-4 md:p-6 border border-border">
                    <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm md:text-base pr-1">
                        <StatRow label="Titular" value={jugador.fueTitular ? 'Sí' : 'No'} />
                        <StatRow label="Victoria" value={jugador.gano ? 'Sí' : 'No'} />
                        <StatRow label="Puntos" value={jugador.puntos} />
                        <StatRow label="Asistencias" value={jugador.asistencias} />
                        <StatRow label="Reb. Def." value={jugador.rebotesDefensivos} />
                        <StatRow label="Reb. Of." value={jugador.rebotesOfensivos} />
                        <StatRow label="Recuperos" value={jugador.recuperaciones} />
                        <StatRow label="Tapones" value={jugador.taponesRealizados} />
                        <StatRow label="Faltas Recibidas" value={jugador.faltasRecibidas} />
                        <StatRow label="Pérdidas" value={jugador.perdidas} warning />
                        <StatRow label="Tap. Recibidos" value={jugador.taponesRecibidos} warning />
                        <StatRow label="Faltas Cometidas" value={jugador.faltasCometidas} warning />
                        <StatRow label="TC Fallados" value={jugador.tirosDeCampoFallados} warning />
                        <StatRow label="TL Fallados" value={jugador.tirosLibresFallados} warning />
                    </div>
                </div>
                
                <div className="space-y-3 pt-2">
                    <button onClick={onClose} className="w-full py-3 bg-surface border border-border text-textMain rounded-xl font-bold active:scale-95 transition-transform">
                        Cerrar
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
}

function StatRow({ label, value, warning = false }) {
    const esValorNegativo = warning && Number(value) > 0;

    return (
        <div className="flex justify-between items-center border-b border-white/5 pb-1">
            <span className="text-textMuted">{label}</span>
            <span className={clsx("font-bold tabular-nums", esValorNegativo ? "text-red-400" : "text-textMain")}>
                {value ?? '0'}
            </span>
        </div>
    )
}
