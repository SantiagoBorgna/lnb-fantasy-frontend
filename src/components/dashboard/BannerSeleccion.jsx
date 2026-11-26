import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Zap, ChevronRight } from 'lucide-react'
import { getSeleccionActivo } from '../../api/seleccionApi'

const formatoFecha = (fecha) => new Date(fecha).toLocaleString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit',
})

/**
 * Banner del Relámpago Selección: aparece solo mientras hay un partido de la selección
 * con la inscripción abierta y lleva directo a armar el quinteto.
 */
export default function BannerSeleccion() {
    const { data: evento } = useQuery({
        queryKey: ['seleccion-activo'],
        queryFn: getSeleccionActivo,
        staleTime: 60_000,
        retry: false,
    })

    if (!evento) return null

    return (
        <Link
            to={`/seleccion/${evento.codigoInscripcion}`}
            className="block rounded-2xl overflow-hidden border border-[#75AADB]/40 bg-gradient-to-r from-[#75AADB]/25 via-white/5 to-[#75AADB]/25 hover:border-[#75AADB]/70 transition-colors"
        >
            <div className="flex items-center gap-3 p-4">
                <div className="w-11 h-11 rounded-full bg-[#75AADB] flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(117,170,219,0.5)]">
                    <Zap className="w-6 h-6 text-white fill-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#75AADB]">Relámpago Selección</p>
                    <p className="text-textMain font-black text-base md:text-lg leading-tight truncate">
                        {evento.localNombre} vs {evento.visitanteNombre}
                    </p>
                    <p className="text-textMuted text-xs mt-0.5 first-letter:uppercase">
                        Armá tu quinteto antes del salto inicial · {formatoFecha(evento.fecha)} hs
                    </p>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1 bg-[#75AADB] text-white font-bold text-sm rounded-xl px-4 py-2 shrink-0">
                    Jugar <ChevronRight className="w-4 h-4" />
                </span>
                <ChevronRight className="sm:hidden w-5 h-5 text-[#75AADB] shrink-0" />
            </div>
        </Link>
    )
}
