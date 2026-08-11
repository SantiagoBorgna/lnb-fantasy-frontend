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
                
                <div className="flex bg-surface border border-border rounded-lg p-1 mx-4 mt-2 mb-2">
                    {[
                        { key: 'reglas', label: 'Reglas' },
                        { key: 'puntajes', label: 'Puntajes' },
                    ].map(({ key, label }) => (
                        <button 
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${tab === key ? 'bg-card shadow text-textMain' : 'text-textMuted hover:text-textMain'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar text-sm text-textMuted">
                    {tab === 'reglas' ? (
                        <div className="space-y-4">
                            <p>
                                <strong className="text-white">Armá tu quinteto ideal:</strong> Tenés un presupuesto de <span className="text-accent font-bold">50cr</span> para elegir 5 jugadores.
                            </p>
                            <p>
                                <strong className="text-white">Formación obligatoria:</strong> Tenés que elegir 1 Base, 1 Escolta, 1 Alero, 1 Ala Pivot y 1 Pivot.
                            </p>
                            <p>
                                <strong className="text-white">Elegí a tu Capitán:</strong> El jugador que elijas como capitán sumará <span className="text-yellow-500 font-bold text-base">1.5x</span> sus puntos. ¡Elegí bien!
                            </p>
                            <p>
                                <strong className="text-white">Competi en tiempo real:</strong> Los puntos se actualizan minutos después de terminado el partido. Si tu equipo es el mejor de la noche, ¡te llevás un premio!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4 pb-2">
                            <p className="mb-2 text-white font-semibold">Tus jugadores suman o restan puntos según estas estadísticas reales en la cancha:</p>
                            <ul className="space-y-2">
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Punto anotado</span><span className="text-accent font-bold">+1</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Rebote Defensivo</span><span className="text-accent font-bold">+1</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Rebote Ofensivo</span><span className="text-accent font-bold">+1.5</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Asistencia</span><span className="text-accent font-bold">+1.5</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Recuperación (robo)</span><span className="text-accent font-bold">+1.5</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Tapón realizado</span><span className="text-accent font-bold">+1.5</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Falta recibida</span><span className="text-accent font-bold">+1</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Fue titular</span><span className="text-accent font-bold">+1</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>El equipo ganó</span><span className="text-accent font-bold">+3</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Doble-Doble / Triple-Doble</span><span className="text-accent font-bold">+5 / +15</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>MVP del partido</span><span className="text-accent font-bold">+10</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Tapón recibido</span><span className="text-red-400 font-bold">-0.5</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Tiro de Campo o Libre fallado</span><span className="text-red-400 font-bold">-1</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Falta cometida</span><span className="text-red-400 font-bold">-1</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Pérdida de balón</span><span className="text-red-400 font-bold">-1.5</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Expulsión por 5 faltas</span><span className="text-red-400 font-bold">-3</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Falta Técnica / Antideportiva</span><span className="text-red-400 font-bold">-3</span></li>
                                <li className="flex justify-between border-b border-border/50 pb-1"><span>Descalificado</span><span className="text-red-400 font-bold">-5</span></li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
