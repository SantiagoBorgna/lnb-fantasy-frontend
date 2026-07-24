import { useNavigate } from 'react-router-dom'

const REGLAS = [
    {
        titulo: 'El Draft',
        texto: 'Un evento en vivo por turnos con amigos. Los jugadores elegidos son exclusivos, si vos elegís un jugador, nadie más lo tiene.',
    },
    {
        titulo: 'Agencia Restringida',
        texto: 'Entre jornadas podes reclamar los agentes libres que querés, y se los lleva quien tenga prioridad mas alta en el mercado.',
    },
    {
        titulo: 'Agencia Libre',
        texto: 'Si nadie reclama a un jugador, queda libre y el primero que llega se lo lleva.',
    },
    {
        titulo: 'Traspasos',
        texto: 'Proponé traspasos a los otros jugadores de tu liga.',
    },
    {
        titulo: 'Formatos de competencia',
        texto: 'Competí en "Modo clásico" (todos contra todos por puntuacion del equipo) o "Modo versus" (enfrentamientos cara a cara cada jornada).',
    },
]

export default function OnboardingDraftPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-0 md:p-8">
            <div className="w-full max-w-2xl bg-surface md:bg-card border-none md:border md:border-border rounded-none md:rounded-3xl p-6 py-8 md:p-10 flex flex-col shadow-none md:shadow-xl h-[100dvh] md:h-auto md:min-h-[600px]">

            {/* Progreso */}
            <div className="flex gap-2 mb-8">
                {[1, 2, 3, 4].map(n => (
                    <div key={n} className={`h-1 flex-1 rounded-full ${n <= 4 ? 'bg-accent' : 'bg-border'}`} />
                ))}
            </div>

            <h1 className="text-textMain font-black text-2xl mb-6">
                Torneos Draft con amigos
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-1 overflow-y-auto content-start mb-6 custom-scrollbar pr-2">
                {REGLAS.map(({ titulo, texto }) => (
                    <div key={titulo} className="card flex items-start gap-3 h-full">
                        <div>
                            <p className="text-textMain font-semibold text-base">{titulo}</p>
                            <p className="text-textMuted text-sm mt-1 leading-relaxed">{texto}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={() => navigate('/', { replace: true })}
                className="btn-primary w-full mt-auto"
            >
                ¡Entendido, a jugar!
            </button>
        </div>
        </div>
    )
}
