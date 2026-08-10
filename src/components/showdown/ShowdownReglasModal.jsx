import { X } from 'lucide-react'
import { useState } from 'react'

export default function ShowdownReglasModal({ isOpen, onClose }) {
    const [tab, setTab] = useState('reglas')

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="bg-surface border border-border rounded-3xl w-full max-w-sm overflow-hidden z-10 animate-in zoom-in-95">
                <div className="p-4 border-b border-border flex justify-between items-center bg-surface-lighter">
                    <h3 className="font-bold text-lg text-textMain">Cómo Jugar</h3>
                    <button onClick={onClose} className="p-2 text-textMuted hover:text-white bg-bg/50 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex border-b border-border bg-bg/50">
                    <button 
                        onClick={() => setTab('reglas')}
                        className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${tab === 'reglas' ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-textMuted hover:text-white'}`}
                    >
                        Reglas
                    </button>
                    <button 
                        onClick={() => setTab('puntajes')}
                        className={`flex-1 py-3 text-sm font-bold text-center border-b-2 transition-colors ${tab === 'puntajes' ? 'border-primary text-primary bg-primary/10' : 'border-transparent text-textMuted hover:text-white'}`}
                    >
                        Puntajes
                    </button>
                </div>

                <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar text-sm text-textMuted">
                    {tab === 'reglas' ? (
                        <div className="space-y-4">
                            <p>
                                <strong className="text-white">Armá tu quinteto ideal:</strong> Tenés un presupuesto de <span className="text-accent font-bold">$50m</span> para elegir 5 jugadores.
                            </p>
                            <p>
                                <strong className="text-white">Formación obligatoria:</strong> Tenés que elegir 1 Base, 1 Escolta, 1 Alero, 1 AlaPivot y 1 Pivot.
                            </p>
                            <p>
                                <strong className="text-white">Elegí a tu Capitán:</strong> El jugador que elijas como capitán sumará <span className="text-yellow-500 font-bold text-base">1.5x</span> sus puntos en la vida real. ¡Elegí bien!
                            </p>
                            <p>
                                <strong className="text-white">Compite en tiempo real:</strong> Los puntos se actualizan minutos después de terminado el partido. Si tu quinteto es el mejor de la noche, ¡te llevás un premio!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="mb-2 text-white font-semibold">Tus jugadores suman o restan puntos según estas estadísticas reales en la cancha:</p>
                            <ul className="space-y-2">
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Punto anotado</span><span className="text-accent font-bold">+1</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Rebote</span><span className="text-accent font-bold">+1.2</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Asistencia</span><span className="text-accent font-bold">+1.5</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Robo</span><span className="text-accent font-bold">+3</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Tapón</span><span className="text-accent font-bold">+3</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Pérdida</span><span className="text-red-400 font-bold">-1</span></li>
                            </ul>
                            <p className="mt-4 text-xs italic opacity-80 text-center">
                                Tip: Un capitán de 20 puntos, aportará 30 puntos a tu equipo.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
