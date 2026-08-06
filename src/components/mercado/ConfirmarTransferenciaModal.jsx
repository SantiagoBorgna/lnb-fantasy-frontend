import { createPortal } from 'react-dom'
import CamisetaSVG from '../jugador/CamisetaSVG'
import clsx from 'clsx'

export default function ConfirmarTransferenciaModal({ 
    torneoId, 
    jugadorSaliente, 
    jugadorEntrante, 
    plantelActivo,
    poderDeCompraActual,
    onConfirmar, 
    onCancelar,
    esFaseRestringida,
    loading
}) {
    const isDT = !jugadorEntrante.posicion || jugadorEntrante.posicion === 'DT';
    const esModoDraft = torneoId != null;

    // Calculos de transferencias
    const limiteTransferencias = esModoDraft ? 4 : 3;
    const transferenciasUsadas = plantelActivo?.transferenciasUsadas || 0;
    const transferenciasRestantes = limiteTransferencias - transferenciasUsadas;

    // Calculos de presupuesto (solo clásico)
    const precioCompra = jugadorEntrante.valorMercadoActual || 0;
    const precioVenta = jugadorSaliente.precioDeCompra || jugadorSaliente.valorMercadoActual || 0;
    const diferencia = precioVenta - precioCompra;
    const nuevoPresupuesto = poderDeCompraActual + diferencia;

    const renderJugador = (j, isSaliente) => {
        const esEstedDT = !j.posicion || j.posicion === 'DT';
        return (
        <div className="flex flex-col items-center flex-1">
            <p className="text-[10px] font-bold text-textMuted uppercase tracking-wider mb-2">
                {isSaliente ? 'Sale' : 'Entra'}
            </p>
            <CamisetaSVG 
                colorPrincipal={esEstedDT && isSaliente ? plantelActivo?.dt?.colorPrincipal : j.colorPrincipal}
                colorSecundario={esEstedDT && isSaliente ? plantelActivo?.dt?.colorSecundario : j.colorSecundario}
                numero={esEstedDT ? "DT" : j.numeroCamiseta}
                estado={esEstedDT ? "ACTIVO" : j.estado}
                modelo={esEstedDT ? 1 : j.modeloCamiseta}
                size={56}
            />
            <p className="font-bold text-sm text-textMain mt-3 text-center line-clamp-1">{esEstedDT && isSaliente ? plantelActivo?.dt?.nombreCompleto : (j.nombreCompleto || j.nombre)}</p>
            <p className="text-xs text-textMuted text-center">{isDT ? 'DT' : j.posicion} · {j.equipoSigla}</p>
            <p className="text-xs text-textMuted font-bold mt-1 text-center">
                Prom: {isDT ? (j.promedioFantasy || 0).toFixed(1) : (j.promedioPuntosUltimas3 || 0).toFixed(1)} pts
            </p>
            
            {!esModoDraft && !isDT && (
                <p className={clsx(
                    "text-xs font-bold mt-2",
                    isSaliente ? "text-green-400" : "text-red-400"
                )}>
                    {isSaliente ? '+' : '-'}{(isSaliente ? precioVenta : precioCompra).toFixed(1)} cr
                </p>
            )}
        </div>
        );
    };

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-[60]" onClick={!loading ? onCancelar : undefined} />
            <div className="fixed bottom-0 left-0 right-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto max-w-md mx-auto bg-card rounded-t-3xl md:rounded-3xl z-[60] flex flex-col overflow-hidden animate-slide-up md:animate-scale-up">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-surface/50">
                    <h2 className="text-xl font-bold text-textMain">{esFaseRestringida ? 'Confirmar Reclamo' : (isDT ? 'Cambio de DT' : 'Confirmar Transferencia')}</h2>
                    {!loading && <button onClick={onCancelar} className="text-textMuted text-2xl px-2">&times;</button>}
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-start justify-between bg-surface/30 p-4 rounded-2xl border border-border">
                        {renderJugador(jugadorSaliente, true)}
                        
                        <div className="flex flex-col items-center justify-center h-24 shrink-0 px-4">
                            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-1">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                </svg>
                            </div>
                        </div>

                        {renderJugador(jugadorEntrante, false)}
                    </div>

                    <div className="bg-surface/50 rounded-xl p-4 border border-border space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-textMuted">Transferencias restantes:</span>
                            <div className="flex items-center gap-2">
                                <span className="line-through opacity-50">{transferenciasRestantes}</span>
                                <span>→</span>
                                <span className={clsx("font-bold", transferenciasRestantes - 1 < 0 ? "text-red-400" : "text-textMain")}>
                                    {Math.max(0, transferenciasRestantes - 1)}
                                </span>
                            </div>
                        </div>
                        
                        {!esModoDraft && !isDT && (
                            <div className="flex justify-between items-center text-sm pt-3 border-t border-border/50">
                                <span className="text-textMuted">Presupuesto tras cambio:</span>
                                <div className="flex items-center gap-2">
                                    <span className={clsx("font-bold", nuevoPresupuesto < 0 ? "text-red-400" : "text-green-400")}>
                                        {nuevoPresupuesto.toFixed(1)} cr
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={onCancelar} 
                            disabled={loading}
                            className="flex-1 py-3 rounded-xl font-bold border border-border text-textMuted hover:bg-surface disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={onConfirmar}
                            disabled={loading || (!esModoDraft && nuevoPresupuesto < 0)}
                            className="flex-1 py-3 rounded-xl font-bold bg-accent text-white hover:bg-accent/90 disabled:opacity-50 disabled:bg-surface disabled:text-textMuted shadow-lg shadow-accent/20"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                            ) : (
                                esFaseRestringida ? 'Reclamar' : 'Confirmar'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    )
}
