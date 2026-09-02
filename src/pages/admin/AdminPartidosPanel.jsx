import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, RotateCw } from 'lucide-react'
import AdminPartidoModal from './AdminPartidoModal'
import { getPartidos, scrapePartido } from '../../api/adminApi'

export default function AdminPartidosPanel() {
    const queryClient = useQueryClient()
    const { data: partidos, isLoading } = useQuery({
        queryKey: ['adminPartidos'],
        queryFn: () => getPartidos()
    })

    const [modalOpen, setModalOpen] = useState(false)
    const [partidoToEdit, setPartidoToEdit] = useState(null)
    const [scrapingId, setScrapingId] = useState(null)

    // Filters state
    const [filtroJornada, setFiltroJornada] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')
    const [filtroFecha, setFiltroFecha] = useState('')
    const [filtroEquipo, setFiltroEquipo] = useState('')

    const [partidoToScrape, setPartidoToScrape] = useState(null)

    const scrapeMutation = useMutation({
        mutationFn: scrapePartido,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminPartidos'])
            alert('Estadísticas recolectadas exitosamente')
            setPartidoToScrape(null)
        },
        onError: (err) => {
            alert('Error al recolectar estadísticas: ' + err.message)
            setPartidoToScrape(null)
        },
        onSettled: () => {
            setScrapingId(null)
        }
    })

    const handleScrapeClick = (partido) => {
        setPartidoToScrape(partido)
    }

    const confirmScrape = () => {
        setScrapingId(partidoToScrape.id)
        scrapeMutation.mutate(partidoToScrape.id)
    }

    // Apply filters
    const partidosFiltrados = useMemo(() => {
        if (!partidos) return []
        return partidos.filter(p => {
            let match = true
            
            if (filtroJornada && p.jornada.numero.toString() !== filtroJornada) {
                match = false
            }
            if (filtroEstado && p.estado !== filtroEstado) {
                match = false
            }
            if (filtroFecha) {
                const pFecha = new Date(p.fechaHora).toISOString().split('T')[0]
                if (pFecha !== filtroFecha) match = false
            }
            if (filtroEquipo) {
                const search = filtroEquipo.toLowerCase()
                if (!p.equipoLocal.nombre.toLowerCase().includes(search) &&
                    !p.equipoVisitante.nombre.toLowerCase().includes(search)) {
                    match = false
                }
            }
            return match
        }).sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
    }, [partidos, filtroJornada, filtroEstado, filtroFecha, filtroEquipo])

    // Get unique jornadas for the select
    const jornadasDisponibles = useMemo(() => {
        if (!partidos) return []
        const nums = partidos.map(p => p.jornada.numero)
        return [...new Set(nums)].sort((a, b) => a - b)
    }, [partidos])

    if (isLoading) return <div className="text-white">Cargando...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Gestión de Partidos</h2>
            </div>

            {/* Filtros */}
            <div className="bg-surface rounded-xl border border-border p-4 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-textMuted uppercase mb-1">Jornada</label>
                    <select
                        value={filtroJornada}
                        onChange={(e) => setFiltroJornada(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors text-sm"
                    >
                        <option value="">Todas</option>
                        {jornadasDisponibles.map(num => (
                            <option key={num} value={num}>Jornada {num}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-textMuted uppercase mb-1">Estado</label>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors text-sm"
                    >
                        <option value="">Todos</option>
                        <option value="PROGRAMADO">Programado</option>
                        <option value="FINALIZADO">Finalizado</option>
                        <option value="PROCESADO">Procesado</option>
                    </select>
                </div>

                <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-bold text-textMuted uppercase mb-1">Fecha</label>
                    <input
                        type="date"
                        value={filtroFecha}
                        onChange={(e) => setFiltroFecha(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors text-sm"
                        style={{ colorScheme: 'dark' }}
                    />
                </div>

                <div className="flex-[2] min-w-[200px]">
                    <label className="block text-xs font-bold text-textMuted uppercase mb-1">Equipo (Buscar por nombre)</label>
                    <input
                        type="text"
                        placeholder="Ej: Boca Juniors, Quimsa..."
                        value={filtroEquipo}
                        onChange={(e) => setFiltroEquipo(e.target.value)}
                        className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors text-sm"
                    />
                </div>
                
                {/* Botón para limpiar filtros */}
                <div className="flex items-end">
                    <button
                        onClick={() => {
                            setFiltroJornada('')
                            setFiltroEstado('')
                            setFiltroFecha('')
                            setFiltroEquipo('')
                        }}
                        className="px-4 py-2 bg-card border border-border text-textMuted font-bold rounded-lg hover:text-white transition-colors text-sm"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-textMuted">
                        <thead className="text-xs text-textMain uppercase bg-card border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Jornada</th>
                                <th className="px-6 py-4">Equipos</th>
                                <th className="px-6 py-4">Resultado</th>
                                <th className="px-6 py-4">Fecha</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Stats</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {partidosFiltrados.map((partido) => (
                                <tr key={partido.id} className="border-b border-border hover:bg-card/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">
                                        J{partido.jornada.numero}
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold">{partido.equipoLocal.nombre}</span>
                                            <span className="text-textMuted mx-1">vs</span>
                                            <span className="font-bold">{partido.equipoVisitante.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-white font-bold">
                                        {partido.puntosLocal !== null ? `${partido.puntosLocal} - ${partido.puntosVisitante}` : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(partido.fechaHora).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            partido.estado === 'PROGRAMADO' ? 'bg-blue-500/20 text-blue-500' :
                                            partido.estado === 'FINALIZADO' ? 'bg-amber-500/20 text-amber-500' :
                                            'bg-green-500/20 text-green-500'
                                        }`}>
                                            {partido.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {partido.estadisticasProcesadas ? (
                                            <span className="text-green-500 font-bold">Sí</span>
                                        ) : (
                                            <span className="text-textMuted">No</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleScrapeClick(partido)}
                                                className="p-2 text-textMuted hover:text-green-500 transition-colors bg-background rounded-lg"
                                                title="Recolectar Estadísticas"
                                                disabled={scrapingId === partido.id}
                                            >
                                                <RotateCw size={16} className={scrapingId === partido.id ? "animate-spin" : ""} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPartidoToEdit(partido)
                                                    setModalOpen(true)
                                                }}
                                                className="p-2 text-textMuted hover:text-white transition-colors bg-background rounded-lg"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {partidosFiltrados.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center">
                                        No se encontraron partidos con esos filtros.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <AdminPartidoModal
                    partido={partidoToEdit}
                    onClose={() => setModalOpen(false)}
                />
            )}

            {partidoToScrape && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-surface border border-border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4 text-amber-500">
                            <RotateCw size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Recalcular Estadísticas</h3>
                        <p className="text-textMuted mb-2">
                            {partidoToScrape.equipoLocal.nombre} vs {partidoToScrape.equipoVisitante.nombre}
                        </p>
                        <p className="text-textMuted text-sm mb-6">
                            ¿Estás seguro de querer recalcular? Se borrarán las estadísticas previas y se descargarán nuevamente de GES Deportiva.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setPartidoToScrape(null)}
                                className="flex-1 py-2 rounded-lg font-bold text-textMuted hover:text-white transition-colors bg-card border border-border"
                                disabled={scrapeMutation.isPending}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmScrape}
                                disabled={scrapeMutation.isPending}
                                className="flex-1 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                            >
                                {scrapeMutation.isPending ? 'Recolectando...' : 'Sí, recalcular'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
