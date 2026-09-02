import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { updatePartido } from '../../api/adminApi'

export default function AdminPartidoModal({ partido, onClose }) {
    const queryClient = useQueryClient()
    const [fechaHora, setFechaHora] = useState('')
    const [jornadaId, setJornadaId] = useState('')
    const [estado, setEstado] = useState('PROGRAMADO')
    const [puntosLocal, setPuntosLocal] = useState('')
    const [puntosVisitante, setPuntosVisitante] = useState('')

    useEffect(() => {
        if (partido) {
            setFechaHora(partido.fechaHora.substring(0, 16))
            setJornadaId(partido.jornada.id)
            setEstado(partido.estado)
            setPuntosLocal(partido.puntosLocal ?? '')
            setPuntosVisitante(partido.puntosVisitante ?? '')
        }
    }, [partido])

    const mutation = useMutation({
        mutationFn: (data) => updatePartido(partido.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['adminPartidos'])
            onClose()
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        mutation.mutate({
            fechaHora,
            jornadaId: Number(jornadaId),
            estado,
            puntosLocal: puntosLocal === '' ? null : Number(puntosLocal),
            puntosVisitante: puntosVisitante === '' ? null : Number(puntosVisitante)
        })
    }

    if (!partido) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-lg font-bold text-white">
                        Editar Partido
                    </h3>
                    <button onClick={onClose} className="p-1 text-textMuted hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="text-center font-bold text-white bg-card p-3 rounded-lg border border-border">
                        {partido.equipoLocal.nombre} vs {partido.equipoVisitante.nombre}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-textMuted mb-1">ID de Jornada (Fase)</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={jornadaId}
                            onChange={(e) => setJornadaId(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-textMuted mb-1">Fecha y Hora</label>
                        <input
                            type="datetime-local"
                            required
                            value={fechaHora}
                            onChange={(e) => setFechaHora(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-textMuted mb-1">Puntos {partido.equipoLocal.sigla}</label>
                            <input
                                type="number"
                                value={puntosLocal}
                                onChange={(e) => setPuntosLocal(e.target.value)}
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-textMuted mb-1">Puntos {partido.equipoVisitante.sigla}</label>
                            <input
                                type="number"
                                value={puntosVisitante}
                                onChange={(e) => setPuntosVisitante(e.target.value)}
                                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-textMuted mb-1">Estado</label>
                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors"
                        >
                            <option value="PROGRAMADO">Programado</option>
                            <option value="FINALIZADO">Finalizado</option>
                            <option value="PROCESADO">Procesado (Stats listas)</option>
                        </select>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2 rounded-lg font-bold text-textMuted hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="flex-1 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {mutation.isPending ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
