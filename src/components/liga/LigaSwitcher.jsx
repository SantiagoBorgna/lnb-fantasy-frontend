import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { LIGAS } from '../../config/ligas'
import { useLigaActual } from '../../store/ligaStore'
import { cambiarLiga } from '../../utils/cambiarLiga'
import { track } from '../../utils/analytics'
import LigaLogo from './LigaLogo'

/**
 * Chip del encabezado para cambiar de liga. Con una sola liga no se muestra.
 */
export default function LigaSwitcher() {
    const liga = useLigaActual()
    const navigate = useNavigate()
    const [abierto, setAbierto] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const cerrarAfuera = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setAbierto(false)
        }
        document.addEventListener('mousedown', cerrarAfuera)
        return () => document.removeEventListener('mousedown', cerrarAfuera)
    }, [])

    if (LIGAS.length < 2) return null

    const elegir = (id) => {
        setAbierto(false)
        if (cambiarLiga(id)) {
            track('cambiar_liga', { ubicacion: 'encabezado' })
            navigate('/', { replace: true })
        }
    }

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setAbierto(!abierto)}
                aria-label={`Liga: ${liga.nombre}. Cambiar de liga`}
                className="flex items-center gap-1.5 pl-2 pr-1.5 py-1.5 rounded-xl border border-border bg-surface text-textMain text-sm font-semibold"
            >
                <LigaLogo liga={liga} className="h-6" />
                <svg className={clsx('w-4 h-4 transition-transform', abierto && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {abierto && (
                <div className="absolute top-full left-0 mt-2 w-52 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {LIGAS.map(l => (
                        <button
                            key={l.id}
                            onClick={() => elegir(l.id)}
                            className={clsx(
                                'w-full flex items-center gap-3 text-left px-4 py-3 text-sm font-medium hover:bg-surface transition-colors',
                                l.id === liga.id ? 'text-accent' : 'text-textMain'
                            )}
                        >
                            <span className="w-12 flex justify-center"><LigaLogo liga={l} className="h-6" /></span>
                            {l.nombre}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
