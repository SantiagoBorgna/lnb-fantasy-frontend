import { useNavigate } from 'react-router-dom'

const REGLAS = [
    {
        titulo: 'Presupuesto Inicial',
        texto: 'Tenés 100 créditos para armar tu equipo de 10 jugadores y 1 DT, con un máximo de 2 jugadores por club.',
    },
    {
        titulo: 'Puntuación',
        texto: 'Tus jugadores suman puntos según su rendimiento real en la LNB.',
    },
    {
        titulo: 'El Capitán',
        texto: 'El capitán suma x1.5. Elegí bien, puede marcar la diferencia.',
    },
    {
        titulo: 'Transferencias',
        texto: 'Podés hacer hasta 3 cambios por jornada, incluyendo al DT.',
    },
    {
        titulo: 'Jornadas',
        texto: 'Las jornadas duran 3-4 días. No podés cambiar tu equipo mientras se juega.',
    },
    {
        titulo: 'Torneos',
        texto: 'Competí con tus amigos en ligas privadas o en el ranking global.',
    },
]

export default function OnboardingReglasPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-0 md:p-8">
            <div className="w-full max-w-2xl bg-surface md:bg-card border-none md:border md:border-border rounded-none md:rounded-3xl p-6 py-8 md:p-10 flex flex-col shadow-none md:shadow-xl h-[100dvh] md:h-auto md:min-h-[600px]">

            {/* Progreso */}
            <div className="flex gap-2 mb-8">
                {[1, 2, 3].map(n => (
                    <div key={n} className={`h-1 flex-1 rounded-full ${n <= 2 ? 'bg-accent' : 'bg-border'
                        }`} />
                ))}
            </div>

            <h1 className="text-textMain font-black text-2xl mb-1">
                ¿Cómo se juega?
            </h1>
            <p className="text-textMuted text-sm mb-6">
                Leé esto antes de armar tu equipo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 flex-1 content-start mb-6">
                {REGLAS.map(({ titulo, texto }) => (
                    <div key={titulo} className="card flex items-start gap-3 h-full">
                        <div>
                            <p className="text-textMain font-semibold text-base">{titulo}</p>
                            <p className="text-textMuted text-sm mt-1 leading-relaxed">{texto}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto flex flex-col gap-3">
                <button
                    onClick={() => navigate('/onboarding/canchita', { replace: true })}
                    className="btn-primary w-full"
                >
                    ¡Armar mi equipo!
                </button>
                <button
                    onClick={() => navigate('/onboarding/perfil', { replace: true })}
                    className="text-textMuted text-sm font-semibold hover:text-textMain py-2 transition-colors"
                >
                    Volver atrás
                </button>
            </div>
        </div>
        </div>
    )
}