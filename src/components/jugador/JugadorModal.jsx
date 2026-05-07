import { createPortal } from 'react-dom'
import CamisetaSVG from './CamisetaSVG'

export default function JugadorModal({
    jugador,
    esTitularActual,
    onCerrar,
    onHacerCapitan,
    onCambiar,
    onTransferir,
}) {
    if (!jugador) return null

    const handleAccion = (accion, e) => {
        e.stopPropagation()
        accion(jugador)
        if (accion !== onCambiar) onCerrar()
    }

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onCerrar} />
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border rounded-t-3xl z-50 p-6 space-y-5 animate-slide-up" onClick={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                <div className="flex items-center gap-4">
                    <CamisetaSVG colorPrincipal={jugador.colorPrincipal} colorSecundario={jugador.colorSecundario} numero={jugador.numeroCamiseta} estado={jugador.estado} modelo={jugador.modeloCamiseta} size={64} />
                    <div>
                        <h3 className="text-textMain font-bold text-lg leading-tight">{jugador.nombreCompleto}</h3>
                        <p className="text-textMuted text-sm">{jugador.equipoSigla} · {jugador.posicion}</p>
                        <p className="text-accent font-semibold text-sm mt-0.5">{jugador.valorMercadoActual?.toFixed(1)} cr</p>
                    </div>
                </div>

                {jugador.promedioPuntosUltimas3 > 0 && (
                    <div className="bg-surface rounded-2xl p-3 text-center border border-border">
                        <p className="text-textMuted text-xs mb-1">Promedio Fantasy (últ. 3 partidos)</p>
                        <p className="text-accent font-bold text-2xl">{jugador.promedioPuntosUltimas3?.toFixed(1)}</p>
                        <p className="text-textMuted text-xs">puntos</p>
                    </div>
                )}

                <div className="space-y-3">
                    {onHacerCapitan && (
                        <button onClick={(e) => handleAccion(onHacerCapitan, e)} className="w-full py-3 px-4 rounded-xl font-bold bg-transparent border-2 border-yellow-400 text-yellow-400 active:scale-95 transition-transform">
                            Hacer Capitán
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