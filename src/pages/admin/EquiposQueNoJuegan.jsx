import { useQuery } from '@tanstack/react-query'
import { Copy, Loader2 } from 'lucide-react'
import { getEquiposParaOnboarding } from '../../api/authApi'
import { getPartidosJornada } from '../../api/jornadaApi'
import { useUiStore } from '../../store/uiStore'

const normalizar = (nombre = '') => nombre.trim().toUpperCase()

/** Equipos que no tienen partido en la jornada (para avisarlo en redes). */
export default function EquiposQueNoJuegan({ jornada }) {
    const showToast = useUiStore(state => state.showToast)
    const { data: equipos, isLoading: cargandoEquipos } = useQuery({
        queryKey: ['adminEquipos'],
        queryFn: getEquiposParaOnboarding,
        staleTime: 5 * 60 * 1000,
    })
    const { data: partidos, isLoading: cargandoPartidos } = useQuery({
        queryKey: ['adminPartidosJornada', jornada.id],
        queryFn: () => getPartidosJornada(jornada.id),
        staleTime: 0,
    })

    if (cargandoEquipos || cargandoPartidos) {
        return <Loader2 size={16} className="animate-spin text-textMuted" />
    }
    if (!partidos?.length) {
        return <p className="text-textMuted">Esta jornada todavía no tiene partidos cargados.</p>
    }

    const juegan = new Set(partidos.flatMap(p => [normalizar(p.equipoLocal), normalizar(p.equipoVisitante)]))
    const noJuegan = (equipos ?? [])
        .map(e => e.nombre)
        .filter(nombre => !juegan.has(normalizar(nombre)))
        .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))

    if (noJuegan.length === 0) {
        return <p className="text-textMuted">Juegan todos los equipos.</p>
    }

    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(`Jornada ${jornada.numero} · No juegan: ${noJuegan.join(', ')}`)
            showToast('Copiado', 'success')
        } catch {
            showToast('No se pudo copiar', 'error')
        }
    }

    return (
        <div className="flex flex-col md:flex-row md:items-start gap-3">
            <p className="flex-1 text-textMain leading-relaxed">
                <span className="font-bold">No juegan ({noJuegan.length}):</span> {noJuegan.join(', ')}
            </p>
            <button
                onClick={copiar}
                className="self-start flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background text-textMuted hover:text-white text-xs font-semibold"
            >
                <Copy size={14} /> Copiar
            </button>
        </div>
    )
}
