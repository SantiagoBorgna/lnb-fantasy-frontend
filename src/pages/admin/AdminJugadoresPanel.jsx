import { useState, useEffect, useMemo } from "react";
import { getTodosLosJugadoresAdmin, updateJugadorAdmin, getTodosLosEquiposAdmin } from "../../api/adminApi";
import { Search, Edit2, Loader2, Filter, ChevronUp, ChevronDown } from "lucide-react";
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
    const [filtroPosicion, setFiltroPosicion] = useState("");

    const [editingJugador, setEditingJugador] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'nombreCompleto', direction: 'asc' });

    const handleSort = (key) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

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
        let filtered = jugadores.filter(j => {
            const matchSearch = j.nombreCompleto.toLowerCase().includes(search.toLowerCase());
            const matchEquipo = filtroEquipo ? j.equipoRealId?.toString() === filtroEquipo : true;
            const matchEstado = filtroEstado ? j.estado === filtroEstado : true;
            const matchPosicion = filtroPosicion ? j.posicion === filtroPosicion : true;
            return matchSearch && matchEquipo && matchEstado && matchPosicion;
        });

        filtered.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            
            // Handle nulls safely for the new properties
            if (sortConfig.key === 'cantidadPlanteles' || sortConfig.key === 'cantidadCapitan' || sortConfig.key === 'promedioFantasy') {
                valA = valA ?? 0;
                valB = valB ?? 0;
            }

            // String comparison vs Number comparison
            if (typeof valA === 'string' && typeof valB === 'string') {
                const comparison = valA.localeCompare(valB);
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [jugadores, search, filtroEquipo, filtroEstado, filtroPosicion, sortConfig]);

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

    const renderSortableHeader = (label, key, className) => {
        const isActive = sortConfig.key === key;
        return (
            <th 
                className={`${className} cursor-pointer hover:bg-white/5 transition-colors group select-none`}
                onClick={() => handleSort(key)}
            >
                <div className={`flex items-center gap-1 ${className.includes('text-center') ? 'justify-center' : ''} ${className.includes('text-right') ? 'justify-end' : ''}`}>
                    {label}
                    <div className="flex flex-col opacity-50 group-hover:opacity-100 transition-opacity">
                        <ChevronUp className={`w-3 h-3 -mb-1 ${isActive && sortConfig.direction === 'asc' ? 'text-primary' : ''}`} />
                        <ChevronDown className={`w-3 h-3 ${isActive && sortConfig.direction === 'desc' ? 'text-primary' : ''}`} />
                    </div>
                </div>
            </th>
        );
    };

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
                        className="w-full bg-bg border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-black focus:outline-none focus:border-primary transition-colors"
                    />
                </div>
                <div className="flex flex-wrap w-full md:w-auto gap-4">
                    <select
                        value={filtroEquipo}
                        onChange={e => setFiltroEquipo(e.target.value)}
                        className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-primary flex-1 md:w-48 appearance-none"
                    >
                        <option value="" className="bg-card text-textMain">Todos los Clubes</option>
                        {equipos.map(eq => (
                            <option key={eq.id} value={eq.id} className="bg-card text-textMain">{eq.sigla}</option>
                        ))}
                    </select>
                    <select
                        value={filtroPosicion}
                        onChange={e => setFiltroPosicion(e.target.value)}
                        className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-primary flex-1 md:w-40 appearance-none"
                    >
                        <option value="" className="bg-card text-textMain">Todas las Posiciones</option>
                        <option value="BASE" className="bg-card text-textMain">Base</option>
                        <option value="ESCOLTA" className="bg-card text-textMain">Escolta</option>
                        <option value="ALERO" className="bg-card text-textMain">Alero</option>
                        <option value="ALA_PIVOT" className="bg-card text-textMain">Ala-Pivot</option>
                        <option value="PIVOT" className="bg-card text-textMain">Pivot</option>
                    </select>
                    <select
                        value={filtroEstado}
                        onChange={e => setFiltroEstado(e.target.value)}
                        className="bg-bg border border-border rounded-lg px-4 py-2.5 text-sm text-black focus:outline-none focus:border-primary flex-1 md:w-40 appearance-none"
                    >
                        <option value="" className="bg-card text-textMain">Todos los Estados</option>
                        <option value="DISPONIBLE" className="bg-card text-textMain">Disponible</option>
                        <option value="LESIONADO" className="bg-card text-textMain">Lesionado</option>
                        <option value="SUSPENDIDO" className="bg-card text-textMain">Suspendido</option>
                        <option value="DUDA" className="bg-card text-textMain">Duda</option>
                        <option value="BAJA" className="bg-card text-textMain">Baja</option>
                    </select>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="bg-card border-b border-border">
                                {renderSortableHeader("Nombre", "nombreCompleto", "p-4 text-xs font-bold text-textMuted uppercase tracking-wider w-[20%]")}
                                {renderSortableHeader("Club", "equipoSigla", "p-4 text-xs font-bold text-textMuted uppercase tracking-wider w-[10%]")}
                                {renderSortableHeader("Posición", "posicion", "p-4 text-xs font-bold text-textMuted uppercase tracking-wider w-[11%]")}
                                {renderSortableHeader("Precio", "valorMercadoActual", "p-4 text-xs font-bold text-textMuted uppercase tracking-wider w-[10%]")}
                                {renderSortableHeader("Promedio", "promedioFantasy", "p-4 text-xs font-bold text-textMuted uppercase tracking-wider w-[10%]")}
                                {renderSortableHeader("En Planteles", "cantidadPlanteles", "p-4 text-xs font-bold text-textMuted uppercase tracking-wider text-center w-[11%]")}
                                {renderSortableHeader("Capitán", "cantidadCapitan", "p-4 text-xs font-bold text-textMuted uppercase tracking-wider text-center w-[9%]")}
                                <th className="p-4 text-xs font-bold text-textMuted uppercase tracking-wider w-[10%]">Estado</th>
                                <th className="p-4 text-xs font-bold text-textMuted uppercase tracking-wider text-right w-[9%]">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {jugadoresFiltrados.map(j => (
                                <tr key={j.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 truncate">
                                        <div className="font-bold text-textMain text-sm truncate" title={j.nombreCompleto}>{j.nombreCompleto}</div>
                                    </td>
                                    <td className="p-4 text-sm text-textMuted font-medium truncate">{j.equipoSigla}</td>
                                    <td className="p-4 text-sm text-textMuted truncate">{j.posicion.replace("_", " ")}</td>
                                    <td className="p-4 font-bold text-accent truncate">${j.valorMercadoActual.toFixed(1)}m</td>
                                    <td className="p-4 font-bold text-blue-400 truncate">{j.promedioFantasy?.toFixed(1) ?? "0.0"} pts</td>
                                    <td className="p-4 text-center font-bold text-white">{j.cantidadPlanteles ?? 0}</td>
                                    <td className="p-4 text-center text-yellow-500 font-bold">{j.cantidadCapitan ?? 0}</td>
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
                                    <td colSpan="9" className="p-8 text-center text-textMuted text-sm">
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

