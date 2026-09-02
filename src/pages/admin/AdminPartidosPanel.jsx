import { useState } from 'react'
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

    const scrapeMutation = useMutation({
        mutationFn: scrapePartido,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminPartidos'])
            alert('Estadísticas recolectadas exitosamente')
        },
        onError: (err) => {
            alert('Error al recolectar estadísticas: ' + err.message)
        },
        onSettled: () => {
            setScrapingId(null)
        }
    })

    const handleScrape = (partido) => {
        if (window.confirm(`¿Estás seguro de recalcular las estadísticas del partido ${partido.equipoLocal.nombre} vs ${partido.equipoVisitante.nombre}? Se borrarán las estadísticas previas y se descargarán nuevamente de GES Deportiva.`)) {
            setScrapingId(partido.id)
            scrapeMutation.mutate(partido.id)
        }
    }

    if (isLoading) return <div className="text-white">Cargando...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Gestión de Partidos</h2>
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
                            {partidos?.sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora)).map((partido) => (
                                <tr key={partido.id} className="border-b border-border hover:bg-card/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">
                                        J{partido.jornada.numero}
                                    </td>
                                    <td className="px-6 py-4 text-white">
                                        <div className="flex items-center gap-2">
                                            <img src={partido.equipoLocal.logoUrl} alt="" className="w-6 h-6 object-contain" />
                                            <span className="font-bold">{partido.equipoLocal.sigla}</span>
                                            <span className="text-textMuted mx-1">vs</span>
                                            <span className="font-bold">{partido.equipoVisitante.sigla}</span>
                                            <img src={partido.equipoVisitante.logoUrl} alt="" className="w-6 h-6 object-contain" />
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
                                                onClick={() => handleScrape(partido)}
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
                            {partidos?.length === 0 && (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center">
                                        No hay partidos cargados.
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
        </div>
    )
}
