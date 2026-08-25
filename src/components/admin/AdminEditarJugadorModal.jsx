import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function AdminEditarJugadorModal({ isOpen, onClose, jugador, equipos, onSave }) {
    const [formData, setFormData] = useState({
        estado: "DISPONIBLE",
        posicion: "BASE",
        equipoRealId: "",
        valorMercadoActual: 0
    });

    useEffect(() => {
        if (jugador) {
            setFormData({
                estado: jugador.estado || "DISPONIBLE",
                posicion: jugador.posicion || "BASE",
                equipoRealId: jugador.equipoRealId || "",
                valorMercadoActual: jugador.valorMercadoActual || 0
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
            valorMercadoActual: Number(formData.valorMercadoActual)
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
                        <p className="text-sm text-textMuted">{jugador.equipoSigla} Â• {jugador.posicion.replace("_", " ")}</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Estado</label>
                            <select 
                                value={formData.estado}
                                onChange={(e) => setFormData({...formData, estado: e.target.value})}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors appearance-none"
                            >
                                <option className="bg-card text-textMain" value="DISPONIBLE">DISPONIBLE</option>
                                <option className="bg-card text-textMain" value="LESIONADO">LESIONADO</option>
                                <option className="bg-card text-textMain" value="SUSPENDIDO">SUSPENDIDO</option>
                                <option className="bg-card text-textMain" value="DUDA">DUDA</option>
                                <option className="bg-card text-textMain" value="BAJA">BAJA (No juega mÃ¡s)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">PosiciÃ³n</label>
                            <select 
                                value={formData.posicion}
                                onChange={(e) => setFormData({...formData, posicion: e.target.value})}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors appearance-none"
                            >
                                <option className="bg-card text-textMain" value="BASE">BASE</option>
                                <option className="bg-card text-textMain" value="ESCOLTA">ESCOLTA</option>
                                <option className="bg-card text-textMain" value="ALERO">ALERO</option>
                                <option className="bg-card text-textMain" value="ALA_PIVOT">ALA PIVOT</option>
                                <option className="bg-card text-textMain" value="PIVOT">PIVOT</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Club Actual</label>
                            <select 
                                value={formData.equipoRealId}
                                onChange={(e) => setFormData({...formData, equipoRealId: e.target.value})}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors appearance-none"
                            >
                                <option className="bg-card text-textMain" value="">Seleccionar Club...</option>
                                {equipos.map(eq => (
                                    <option key={eq.id} value={eq.id}>{eq.nombre} ({eq.sigla})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Precio (CrÃ©ditos)</label>
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
