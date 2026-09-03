import { useState, useEffect, useMemo } from 'react';
import { getDtsAdmin, updateDtAdmin, getTodosLosEquiposAdmin } from '../../api/adminApi';
import { Search, Edit2, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import AdminEditarDtModal from './AdminEditarDtModal';

export default function AdminDtsPanel() {
    const showToast = useUiStore(state => state.showToast);
    const [dts, setDts] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filtros
    const [search, setSearch] = useState('');
    const [filtroEquipo, setFiltroEquipo] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('');

    // Edición
    const [editingDt, setEditingDt] = useState(null);
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
            const [dtsData, equiposData] = await Promise.all([
                getDtsAdmin(),
                getTodosLosEquiposAdmin()
            ]);
            setDts(dtsData);
            setEquipos(equiposData);
        } catch (error) {
            console.error(error);
            showToast("Error al cargar datos", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const dtsFiltrados = useMemo(() => {
        let filtered = dts.filter(dt => {
            const matchSearch = dt.nombreCompleto.toLowerCase().includes(search.toLowerCase());
            const matchEquipo = filtroEquipo ? dt.equipoId?.toString() === filtroEquipo : true;
            const matchEstado = filtroEstado ? dt.estado === filtroEstado : true;
            return matchSearch && matchEquipo && matchEstado;
        });

        filtered.sort((a, b) => {
            let valA = a[sortConfig.key];
            let valB = b[sortConfig.key];
            
            if (sortConfig.key === 'cantidadPlanteles' || sortConfig.key === 'promedioFantasy') {
                valA = valA ?? 0;
                valB = valB ?? 0;
            }

            if (typeof valA === 'string' && typeof valB === 'string') {
                const comparison = valA.localeCompare(valB);
                return sortConfig.direction === 'asc' ? comparison : -comparison;
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

        return filtered;
    }, [dts, search, filtroEquipo, filtroEstado, sortConfig]);

    const handleSaveDt = async (id, payload) => {
        try {
            await updateDtAdmin(id, payload);
            showToast("DT actualizado", "success");
            setEditingDt(null);
            cargarDatos();
        } catch (error) {
            console.error(error);
            showToast("Error al actualizar DT", "error");
        }
    };

    if (loading && dts.length === 0) {
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
                <div className="flex w-full md:w-auto gap-4">
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
                                {renderSortableHeader("Nombre", "nombreCompleto", "p-4 text-xs font-bold text-textMuted uppercase tracking-wider w-1/3")}
                                {renderSortableHeader("Club", "equipoSigla", "p-4 text-xs font-bold text-textMuted uppercase tracking-wider w-[20%]")}
                                {renderSortableHeader("Promedio", "promedioFantasy", "p-4 text-xs font-bold text-textMuted uppercase tracking-wider w-[15%]")}
                                {renderSortableHeader("En Planteles", "cantidadPlanteles", "p-4 text-xs font-bold text-textMuted uppercase tracking-wider text-center w-[12%]")}
                                <th className="p-4 text-xs font-bold text-textMuted uppercase tracking-wider w-[10%]">Estado</th>
                                <th className="p-4 text-xs font-bold text-textMuted uppercase tracking-wider text-right w-[10%]">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {dtsFiltrados.map(dt => (
                                <tr key={dt.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 truncate">
                                        <div className="font-bold text-textMain text-sm truncate" title={dt.nombreCompleto}>{dt.nombreCompleto}</div>
                                    </td>
                                    <td className="p-4 text-sm text-textMuted font-medium truncate">{dt.equipoSigla}</td>
                                    <td className="p-4 font-bold text-accent truncate">{dt.promedioFantasy.toFixed(1)} pts</td>
                                    <td className="p-4 text-center font-bold text-white">{dt.cantidadPlanteles ?? 0}</td>
                                    <td className="p-4">
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded ${
                                            dt.estado === 'DISPONIBLE' ? 'bg-green-500/10 text-green-500' :
                                            dt.estado === 'LESIONADO' ? 'bg-red-500/10 text-red-500' :
                                            dt.estado === 'BAJA' ? 'bg-gray-500/10 text-gray-400' :
                                            'bg-warning/10 text-warning'
                                        }`}>
                                            {dt.estado}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => setEditingDt(dt)}
                                            className="p-2 rounded-lg text-textMuted hover:text-primary hover:bg-primary/10 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {dtsFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-textMuted text-sm">
                                        No se encontraron DTs que coincidan con la búsqueda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdminEditarDtModal 
                isOpen={!!editingDt}
                onClose={() => setEditingDt(null)}
                dt={editingDt}
                equipos={equipos}
                onSave={handleSaveDt}
            />
        </div>
    );
}
