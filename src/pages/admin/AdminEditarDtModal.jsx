import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function AdminEditarDtModal({ isOpen, onClose, dt, equipos, onSave }) {
    const [formData, setFormData] = useState({
        nombreCompleto: "",
        estado: "DISPONIBLE",
        equipoRealId: "",
        promedioFantasy: 0
    });

    useEffect(() => {
        if (dt) {
            setFormData({
                nombreCompleto: dt.nombreCompleto || "",
                estado: dt.estado || "DISPONIBLE",
                equipoRealId: dt.equipoId || "",
                promedioFantasy: dt.promedioFantasy || 0
            });
        }
    }, [dt]);

    if (!isOpen || !dt) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(dt.id, {
            nombreCompleto: formData.nombreCompleto,
            estado: formData.estado,
            equipoId: formData.equipoRealId ? Number(formData.equipoRealId) : null,
            promedioFantasy: Number(formData.promedioFantasy)
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-bg border border-border w-full max-w-md rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
                
                <div className="flex items-center justify-between p-4 border-b border-border bg-surface">
                    <h3 className="font-bold text-textMain text-lg">Editar DT</h3>
                    <button onClick={onClose} className="p-1 rounded-full text-textMuted hover:text-textMain hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Nombre Completo</label>
                            <input 
                                type="text"
                                value={formData.nombreCompleto}
                                onChange={(e) => setFormData({...formData, nombreCompleto: e.target.value})}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors text-black"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Estado</label>
                            <select 
                                value={formData.estado}
                                onChange={(e) => setFormData({...formData, estado: e.target.value})}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors appearance-none text-black"
                            >
                                <option value="DISPONIBLE" className="bg-card text-textMain">DISPONIBLE</option>
                                <option value="LESIONADO" className="bg-card text-textMain">LESIONADO</option>
                                <option value="SUSPENDIDO" className="bg-card text-textMain">SUSPENDIDO</option>
                                <option value="DUDA" className="bg-card text-textMain">DUDA</option>
                                <option value="BAJA" className="bg-card text-textMain">BAJA (No dirige más)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Club Actual</label>
                            <select 
                                value={formData.equipoRealId}
                                onChange={(e) => setFormData({...formData, equipoRealId: e.target.value})}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors appearance-none text-black"
                            >
                                <option value="" className="bg-card text-textMain">Seleccionar Club...</option>
                                {equipos.map(eq => (
                                    <option key={eq.id} value={eq.id} className="bg-card text-textMain">{eq.nombre} ({eq.sigla})</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Promedio Fantasy (Pts)</label>
                            <input 
                                type="number"
                                step="0.1"
                                value={formData.promedioFantasy}
                                onChange={(e) => setFormData({...formData, promedioFantasy: e.target.value})}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors text-black"
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
