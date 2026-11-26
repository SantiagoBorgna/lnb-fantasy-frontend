import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { getSeleccionActivo } from '../../api/seleccionApi'

const CELESTE = '#75AADB'
const ZONA = 'America/Argentina/Buenos_Aires'

// "HOY · 21:40", "MAÑANA · 18:10" o "DOM 29/11 · 18:10" (la fecha del evento viene en hora argentina)
function cuando(fecha) {
    const inicio = new Date(fecha)
    const hora = inicio.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
    const dia = (d) => d.toLocaleDateString('en-CA', { timeZone: ZONA })
    const hoy = new Date()
    const manana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000)
    if (dia(inicio) === dia(hoy)) return `HOY · ${hora}`
    if (dia(inicio) === dia(manana)) return `MAÑANA · ${hora}`
    const corto = inicio.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })
    return `${corto.replace('.', '').toUpperCase()} · ${hora}`
}

function Rayo({ className }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
            <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
        </svg>
    )
}

/**
 * Banner del Relámpago Selección: aparece solo mientras hay un partido de la selección
 * con la inscripción abierta y lleva directo a armar el quinteto.
 * Mismo estilo que las historias de Instagram: fondo azul, etiqueta celeste y el cruce en grande.
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
            className="group block rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0E1828] to-[#1C3C6E] shadow-lg hover:border-[#75AADB]/60 transition-colors"
        >
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-5 md:px-8 md:py-6">
                <div className="flex-1 min-w-0 flex flex-col items-center md:items-start gap-3 text-center md:text-left">
                    <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[#0E1828] text-[11px] md:text-xs font-black tracking-[0.15em]"
                        style={{ backgroundColor: CELESTE }}
                    >
                        <Rayo className="w-3.5 h-3.5" />
                        RELÁMPAGO SELECCIÓN
                    </span>

                    <p className="text-white font-black uppercase leading-none tracking-tight text-[28px] md:text-4xl [text-shadow:0_3px_10px_rgba(0,0,0,0.5)]">
                        {evento.localNombre}
                        <span className="mx-2 text-lg md:text-2xl align-middle" style={{ color: CELESTE }}>VS</span>
                        {evento.visitanteNombre}
                    </p>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1">
                        <span className="rounded-lg border border-white/35 px-2.5 py-0.5 text-white text-sm font-extrabold">
                            {cuando(evento.fecha)}
                        </span>
                        <span className="text-[#A9BCD0] text-xs md:text-sm font-semibold">
                            Gratis · Sin registrarte · Cierra al inicio del partido
                        </span>
                    </div>
                </div>

                <span
                    className="inline-flex items-center justify-center gap-1 rounded-xl px-5 py-3 text-[#0E1828] text-sm md:text-base font-black tracking-wide shrink-0 group-hover:brightness-110 transition"
                    style={{ backgroundColor: CELESTE }}
                >
                    ARMÁ TU QUINTETO
                    <ChevronRight className="w-5 h-5" />
                </span>
            </div>
        </Link>
    )
}
