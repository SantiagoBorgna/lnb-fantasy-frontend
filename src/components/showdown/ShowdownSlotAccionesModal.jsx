import { createPortal } from 'react-dom'
import CamisetaSVG from '../jugador/CamisetaSVG'

export default function ShowdownSlotAccionesModal({ isOpen, onClose, posicion, jugador, esCapitan, onElegirCapitan, onQuitar }) {
    if (!isOpen || !jugador) return null;

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
            <div className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md mx-auto bg-card border-t border-border rounded-t-3xl md:rounded-3xl z-50 p-6 space-y-4 animate-slide-up md:animate-none" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />
                
                <div className="flex items-center gap-4">
                    <CamisetaSVG
                        colorPrincipal={jugador.colorPrincipal}
                        colorSecundario={jugador.colorSecundario}
                        modelo={jugador.modeloCamiseta}
                        numero={jugador.numeroCamiseta}
                        estado={jugador.estado}
                        size={56}
                    />
                    <div>
                        <p className="text-textMain font-bold">{jugador.nombreCompleto}</p>
                        <p className="text-textMuted text-sm">{jugador.equipoSigla} · {jugador.posicion}</p>
                    </div>
                </div>
                
                <div className="space-y-3">
                    {!esCapitan && (
                        <button
                            onClick={() => {
                                onElegirCapitan();
                                onClose();
                            }}
                            className="w-full py-3 px-4 rounded-xl font-bold bg-transparent border-2 border-yellow-400 text-yellow-400 active:scale-95 transition-transform"
                        >
                            Hacer Capitán
                        </button>
                    )}
                    
                    <button
                        onClick={() => {
                            onQuitar();
                            onClose();
                        }}
                        className="w-full py-3 px-4 rounded-xl font-bold bg-transparent border-2 border-accent text-accent active:scale-95 transition-transform"
                    >
                        Quitar del equipo
                    </button>
                    
                    <button onClick={onClose} className="w-full py-2 text-textMuted text-sm font-medium">
                        Cancelar
                    </button>
                </div>
            </div>
        </>,
        document.body
    )
}
