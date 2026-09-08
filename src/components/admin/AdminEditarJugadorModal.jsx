import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function AdminEditarJugadorModal({ isOpen, onClose, jugador, equipos, onSave }) {
    const [formData, setFormData] = useState({
        estado: "DISPONIBLE",
        posicion: "BASE",
        equipoRealId: "",
        valorMercadoActual: 0,
        numeroCamiseta: ""
    });

    useEffect(() => {
        if (jugador) {
            setFormData({
                estado: jugador.estado || "DISPONIBLE",
                posicion: jugador.posicion || "BASE",
                equipoRealId: jugador.equipoRealId || "",
                valorMercadoActual: jugador.valorMercadoActual || 0,
                numeroCamiseta: jugador.numeroCamiseta ?? ""
            });
        }
    }, [jugador]);

    if (!isOpen || !jugador) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(jugador.id, {
            estado: formData.estado,
            posicion: formData.posicion,
            equipoRealId: formData.equipoRealId ? Number(formData.equipoRealId) : null,
            valorMercadoActual: Number(formData.valorMercadoActual),
            numeroCamiseta: formData.numeroCamiseta !== "" ? Number(formData.numeroCamiseta) : null
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-bg border border-border w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                
                <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
                    <h3 className="font-bold text-textMain text-lg">Editar Jugador</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-textMuted hover:text-textMain hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <p className="font-bold text-lg text-textMain">{jugador.nombreCompleto}</p>
                        <p className="text-sm text-textMuted">{jugador.equipoSigla}  {jugador.posicion.replace("_", " ")}</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Estado</label>
                            <select 
                                value={formData.estado}
                                onChange={(e) => setFormData({...formData, estado: e.target.value})}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors appearance-none"
                            >
                                <option value="DISPONIBLE" className="bg-card text-textMain">DISPONIBLE</option>
                                <option value="LESIONADO" className="bg-card text-textMain">LESIONADO</option>
                                <option value="SUSPENDIDO" className="bg-card text-textMain">SUSPENDIDO</option>
                                <option value="DUDA" className="bg-card text-textMain">DUDA</option>
                                <option value="BAJA" className="bg-card text-textMain">BAJA (No juega más)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Posición</label>
                            <select 
                                value={formData.posicion}
                                onChange={(e) => setFormData({...formData, posicion: e.target.value})}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors appearance-none"
                            >
                                <option value="BASE" className="bg-card text-textMain">BASE</option>
                                <option value="ESCOLTA" className="bg-card text-textMain">ESCOLTA</option>
                                <option value="ALERO" className="bg-card text-textMain">ALERO</option>
                                <option value="ALA_PIVOT" className="bg-card text-textMain">ALA PIVOT</option>
                                <option value="PIVOT" className="bg-card text-textMain">PIVOT</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Número de Camiseta</label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={formData.numeroCamiseta}
                                onChange={(e) => setFormData({...formData, numeroCamiseta: e.target.value})}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Club Actual</label>
                            <select 
                                value={formData.equipoRealId}
                                onChange={(e) => setFormData({...formData, equipoRealId: e.target.value})}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors appearance-none"
                            >
                                <option value="" className="bg-card text-textMain">Seleccionar Club...</option>
                                {equipos.map(eq => (
                                    <option key={eq.id} value={eq.id} className="bg-card text-textMain">{eq.nombre} ({eq.sigla})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Precio (Créditos)</label>
                            <input 
                                type="number"
                                step="0.1"
                                value={formData.valorMercadoActual}
                                onChange={(e) => setFormData({...formData, valorMercadoActual: e.target.value})}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="flex-1 py-3 font-semibold text-textMuted bg-transparent hover:bg-surface border border-border rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 py-3 font-bold text-bg bg-primary rounded-xl hover:bg-primary/90 transition-colors shadow-md"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
