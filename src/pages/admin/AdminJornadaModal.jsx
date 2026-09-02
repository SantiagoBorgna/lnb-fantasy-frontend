import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'

const saveJornada = async (data) => {
    const url = data.id ? `/api/admin/jornadas/${data.id}` : '/api/admin/jornadas'
    const method = data.id ? 'PUT' : 'POST'
    const res = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Error al guardar jornada')
    return res.json()
}

export default function AdminJornadaModal({ jornada, onClose }) {
    const queryClient = useQueryClient()
    const [numero, setNumero] = useState(1)
    const [fechaInicio, setFechaInicio] = useState('')
    const [fechaFin, setFechaFin] = useState('')
    const [estado, setEstado] = useState('ABIERTA_A_CAMBIOS')

    useEffect(() => {
        if (jornada) {
            setNumero(jornada.numero)
            // Convert to YYYY-MM-DDThh:mm format for datetime-local input
            setFechaInicio(jornada.fechaInicio.substring(0, 16))
            setFechaFin(jornada.fechaFin.substring(0, 16))
            setEstado(jornada.estado)
        } else {
            // Default to next week if creating new
            const now = new Date()
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
            nextWeek.setMinutes(nextWeek.getMinutes() - nextWeek.getTimezoneOffset())
            setFechaInicio(now.toISOString().substring(0, 16))
            setFechaFin(nextWeek.toISOString().substring(0, 16))
        }
    }, [jornada])

    const mutation = useMutation({
        mutationFn: saveJornada,
        onSuccess: () => {
            queryClient.invalidateQueries(['adminJornadas'])
            onClose()
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        mutation.mutate({
            id: jornada?.id,
            numero: Number(numero),
            fechaInicio,
            fechaFin,
            estado
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-surface border border-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="text-lg font-bold text-white">
                        {jornada ? `Editar Jornada ${jornada.numero}` : 'Nueva Jornada'}
                    </h3>
                    <button onClick={onClose} className="p-1 text-textMuted hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-textMuted mb-1">Número de Jornada</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={numero}
                            onChange={(e) => setNumero(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-textMuted mb-1">Fecha de Inicio</label>
                        <input
                            type="datetime-local"
                            required
                            value={fechaInicio}
                            onChange={(e) => setFechaInicio(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-textMuted mb-1">Fecha de Fin</label>
                        <input
                            type="datetime-local"
                            required
                            value={fechaFin}
                            onChange={(e) => setFechaFin(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-textMuted mb-1">Estado</label>
                        <select
                            value={estado}
                            onChange={(e) => setEstado(e.target.value)}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-textMain outline-none focus:border-primary transition-colors"
                        >
                            <option value="ABIERTA_A_CAMBIOS">Abierta a Cambios</option>
                            <option value="EN_JUEGO">En Juego</option>
                            <option value="FINALIZADA">Finalizada</option>
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
