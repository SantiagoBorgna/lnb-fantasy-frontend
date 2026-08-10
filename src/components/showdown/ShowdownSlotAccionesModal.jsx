import { X, Star, Trash2 } from 'lucide-react'

export default function ShowdownSlotAccionesModal({ isOpen, onClose, posicion, jugador, esCapitan, onElegirCapitan, onQuitar }) {
    if (!isOpen || !jugador) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="bg-surface border border-border rounded-3xl w-full max-w-sm overflow-hidden z-10 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
                <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter">
                    <div>
                        <h3 className="font-bold text-lg text-textMain">{jugador.nombreCompleto}</h3>
                        <p className="text-sm text-textMuted uppercase tracking-wider">{posicion}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-textMuted hover:text-white bg-bg/50 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-2">
                    <button
                        onClick={() => {
                            onElegirCapitan();
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left text-textMain font-medium"
                    >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${esCapitan ? 'bg-yellow-500/20 text-yellow-500' : 'bg-white/10 text-white/70'}`}>
                            <Star className="w-5 h-5" />
                        </div>
                        <div>
                            <p className={esCapitan ? 'text-yellow-500 font-bold' : ''}>Elegir Capitán</p>
                            <p className="text-xs text-textMuted">Puntúa 1.5x en el partido</p>
                        </div>
                    </button>
                    
                    <button
                        onClick={() => {
                            onQuitar();
                            onClose();
                        }}
                        className="w-full flex items-center gap-3 p-4 hover:bg-danger/10 transition-colors text-left text-danger font-medium rounded-b-2xl"
                    >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-danger/20">
                            <Trash2 className="w-5 h-5" />
                        </div>
                        Quitar del equipo
                    </button>
                </div>
            </div>
        </div>
    )
}
