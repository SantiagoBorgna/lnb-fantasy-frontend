import { useState, useEffect, useMemo } from "react";
import { getTodosLosJugadoresAdmin, updateJugadorAdmin, getTodosLosEquiposAdmin } from "../../api/adminApi";
import { Search, Edit2, Loader2, Filter } from "lucide-react";
import { useUiStore } from "../../store/uiStore";
import AdminEditarJugadorModal from "../../components/admin/AdminEditarJugadorModal";

export default function AdminJugadoresPanel() {
    const showToast = useUiStore(state => state.showToast);
    
    const [jugadores, setJugadores] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [search, setSearch] = useState("");
    const [filtroEquipo, setFiltroEquipo] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("");

    const [editingJugador, setEditingJugador] = useState(null);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [jData, eData] = await Promise.all([
                getTodosLosJugadoresAdmin(),
                getTodosLosEquiposAdmin()
            ]);
            setJugadores(jData);
            setEquipos(eData);
        } catch (error) {
            console.error(error);
            showToast("Error al cargar jugadores", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const jugadoresFiltrados = useMemo(() => {
        return jugadores.filter(j => {
            const matchSearch = j.nombreCompleto.toLowerCase().includes(search.toLowerCase());
            const matchEquipo = filtroEquipo ? j.equipoRealId?.toString() === filtroEquipo : true;
            const matchEstado = filtroEstado ? j.estado === filtroEstado : true;
            return matchSearch && matchEquipo && matchEstado;
        }).sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
    }, [jugadores, search, filtroEquipo, filtroEstado]);

    const handleSaveJugador = async (id, payload) => {
        try {
            await updateJugadorAdmin(id, payload);
            showToast("Jugador actualizado", "success");
            setEditingJugador(null);
            cargarDatos();
        } catch (error) {
            console.error(error);
            showToast("Error al actualizar jugador", "error");
        }
    };

    if (loading && jugadores.length === 0) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 pt-2">
            {/* Filtros */}
            <div className="bg-surface border border-border p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
                    <input 
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-bg border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary transition-colors"
                    />
                </div>
                <div className="flex w-full md:w-auto gap-4">
                    <select 
                        value={filtroEquipo}
                        onChange={e => setFiltroEquipo(e.target.value)}
                        className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary flex-1 md:w-48 appearance-none"
                    >
                        <option value="">Todos los Clubes</option>
                        {equipos.map(eq => (
                            <option key={eq.id} value={eq.id}>{eq.sigla}</option>
                        ))}
                    </select>
                    <select 
                        value={filtroEstado}
                        onChange={e => setFiltroEstado(e.target.value)}
                        className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-textMain focus:outline-none focus:border-primary flex-1 md:w-40 appearance-none"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="DISPONIBLE">Disponible</option>
                        <option value="LESIONADO">Lesionado</option>
                        <option value="SUSPENDIDO">Suspendido</option>
                        <option value="DUDA">Duda</option>
                        <option value="BAJA">Baja</option>
                    </select>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-card border-b border-border">
                                <th className="p-4 text-xs font-bold text-textMuted uppercase tracking-wider">Nombre</th>
                                <th className="p-4 text-xs font-bold text-textMuted uppercase tracking-wider">Club</th>
                                <th className="p-4 text-xs font-bold text-textMuted uppercase tracking-wider">Posición</th>
                                <th className="p-4 text-xs font-bold text-textMuted uppercase tracking-wider">Precio</th>
                                <th className="p-4 text-xs font-bold text-textMuted uppercase tracking-wider">Estado</th>
                                <th className="p-4 text-xs font-bold text-textMuted uppercase tracking-wider text-right">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {jugadoresFiltrados.map(j => (
                                <tr key={j.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-bold text-textMain text-sm">{j.nombreCompleto}</div>
                                    </td>
                                    <td className="p-4 text-sm text-textMuted font-medium">{j.equipoSigla}</td>
                                    <td className="p-4 text-sm text-textMuted">{j.posicion.replace("_", " ")}</td>
                                    <td className="p-4 font-bold text-accent">${j.valorMercadoActual.toFixed(1)}m</td>
                                    <td className="p-4">
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${
                                            j.estado === "DISPONIBLE" ? "bg-green-500/10 text-green-500" :
                                            j.estado === "LESIONADO" ? "bg-red-500/10 text-red-500" :
                                            j.estado === "BAJA" ? "bg-gray-500/10 text-gray-400" :
                                            "bg-warning/10 text-warning"
                                        }`}>
                                            {j.estado}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => setEditingJugador(j)}
                                            className="p-2 rounded-lg text-textMuted hover:text-primary hover:bg-primary/10 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {jugadoresFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-textMuted text-sm">
                                        No se encontraron jugadores que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdminEditarJugadorModal 
                isOpen={!!editingJugador}
                onClose={() => setEditingJugador(null)}
                jugador={editingJugador}
                equipos={equipos}
                onSave={handleSaveJugador}
            />
        </div>
    );
}

