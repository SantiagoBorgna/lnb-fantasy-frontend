import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import AdminJornadaModal from './AdminJornadaModal'
import api from '../../api/axiosClient'

const fetchJornadas = async () => {
    const res = await api.get('/admin/jornadas')
    return res.data
}

const deleteJornada = async (id) => {
    await api.delete(`/admin/jornadas/${id}`)
}

export default function AdminJornadasPanel() {
    const queryClient = useQueryClient()
    const { data: jornadas, isLoading } = useQuery({
        queryKey: ['adminJornadas'],
        queryFn: fetchJornadas
    })

    const [modalOpen, setModalOpen] = useState(false)
    const [jornadaToEdit, setJornadaToEdit] = useState(null)
    const [jornadaToDelete, setJornadaToDelete] = useState(null)

    const deleteMutation = useMutation({
        mutationFn: deleteJornada,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminJornadas'])
            setJornadaToDelete(null)
        }
    })

    if (isLoading) return <div className="text-white">Cargando...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Gestión de Jornadas</h2>
                <button
                    onClick={() => {
                        setJornadaToEdit(null)
                        setModalOpen(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <Plus size={18} />
                    Nueva Jornada
                </button>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-textMuted">
                        <thead className="text-xs text-textMain uppercase bg-card border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Número</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Inicio</th>
                                <th className="px-6 py-4">Fin</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jornadas?.sort((a, b) => a.numero - b.numero).map((jornada) => (
                                <tr key={jornada.id} className="border-b border-border hover:bg-card/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-white">
                                        Jornada {jornada.numero}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                            jornada.estado === 'ABIERTA_A_CAMBIOS' ? 'bg-green-500/20 text-green-500' :
                                            jornada.estado === 'EN_JUEGO' ? 'bg-amber-500/20 text-amber-500' :
                                            'bg-red-500/20 text-red-500'
                                        }`}>
                                            {jornada.estado === 'ABIERTA_A_CAMBIOS' ? 'ABIERTA' : jornada.estado}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(jornada.fechaInicio).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(jornada.fechaFin).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => {
                                                    setJornadaToEdit(jornada)
                                                    setModalOpen(true)
                                                }}
                                                className="p-2 text-textMuted hover:text-white transition-colors bg-background rounded-lg"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setJornadaToDelete(jornada)}
                                                className="p-2 text-textMuted hover:text-red-500 transition-colors bg-background rounded-lg"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {jornadas?.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center">
                                        No hay jornadas creadas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modalOpen && (
                <AdminJornadaModal
                    jornada={jornadaToEdit}
                    onClose={() => setModalOpen(false)}
                />
            )}

            {jornadaToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-surface border border-border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 text-red-500">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Eliminar Jornada {jornadaToDelete.numero}</h3>
                        <p className="text-textMuted mb-6">
                            ¿Estás seguro de que querés eliminar esta jornada? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setJornadaToDelete(null)}
                                className="flex-1 py-2 rounded-lg font-bold text-textMuted hover:text-white transition-colors bg-card border border-border"
                                disabled={deleteMutation.isPending}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => deleteMutation.mutate(jornadaToDelete.id)}
                                disabled={deleteMutation.isPending}
                                className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {deleteMutation.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
