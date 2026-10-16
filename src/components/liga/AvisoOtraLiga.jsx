import { useNavigate } from 'react-router-dom'
import { LIGAS } from '../../config/ligas'
import { useLigaActual } from '../../store/ligaStore'
import { cambiarLiga } from '../../utils/cambiarLiga'
import { track } from '../../utils/analytics'
import LigaLogo from './LigaLogo'

/**
 * En el onboarding no está el chip de liga: si alguien entró a la liga que no quería,
 * desde acá vuelve a la otra (donde quizás ya tiene su equipo). Con una sola liga no se muestra.
 */
export default function AvisoOtraLiga({ className = '' }) {
    const liga = useLigaActual()
    const navigate = useNavigate()
    const otra = LIGAS.find(l => l.id !== liga.id)
    if (!otra) return null

    const irALaOtra = () => {
        if (cambiarLiga(otra.id)) {
            track('cambiar_liga', { ubicacion: 'onboarding' })
            navigate('/', { replace: true })
        }
    }

    return (
        <div className={`flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-sm ${className}`}>
            <LigaLogo liga={liga} className="h-6" />
            <span className="text-textMuted flex-1 leading-tight">Estás en la {liga.nombre}</span>
            <button onClick={irALaOtra} className="font-semibold text-accent text-right leading-tight">
                Ir a la {otra.nombre}
            </button>
        </div>
    )
}
