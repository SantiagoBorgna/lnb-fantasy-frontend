import { useNavigate } from 'react-router-dom'

const REGLAS = [
    {
        icono: '💰',
        titulo: 'Presupuesto',
        texto: 'Tenés 100 créditos para armar tu equipo de 10 jugadores y 1 DT.',
    },
    {
        icono: '📊',
        titulo: 'Puntuación',
        texto: 'Tus jugadores suman puntos según su rendimiento real en la LNB.',
    },
    {
        icono: '👑',
        titulo: 'Capitán',
        texto: 'El capitán suma x1.5. Elegí bien — puede marcar la diferencia.',
    },
    {
        icono: '🔄',
        titulo: 'Transferencias',
        texto: 'Podés hacer hasta 3 cambios por jornada, incluyendo al DT.',
    },
    {
        icono: '📅',
        titulo: 'Jornadas',
        texto: 'Las jornadas duran 3-4 días. No podés cambiar tu equipo mientras se juega.',
    },
    {
        icono: '🏆',
        titulo: 'Torneos',
        texto: 'Competí con tus amigos en ligas privadas o en el ranking global.',
    },
]

export default function OnboardingReglasPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-surface px-6 py-10 flex flex-col
                    max-w-md mx-auto">

            {/* Progreso */}
            <div className="flex gap-2 mb-8">
                {[1, 2, 3].map(n => (
                    <div key={n} className={`h-1 flex-1 rounded-full ${n <= 2 ? 'bg-accent' : 'bg-border'
                        }`} />
                ))}
            </div>

            <h1 className="text-textMain font-black text-2xl mb-1">
                ¿Cómo se juega? 📖
            </h1>
            <p className="text-textMuted text-sm mb-6">
                Leé esto antes de armar tu equipo.
            </p>

            <div className="space-y-3 flex-1">
                {REGLAS.map(({ icono, titulo, texto }) => (
                    <div key={titulo} className="card flex items-start gap-3">
                        <span className="text-2xl shrink-0">{icono}</span>
                        <div>
                            <p className="text-textMain font-semibold text-sm">{titulo}</p>
                            <p className="text-textMuted text-xs mt-0.5">{texto}</p>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={() => navigate('/onboarding/canchita', { replace: true })}
                className="btn-accent w-full mt-6"
            >
                ¡Armar mi equipo! 🏀
            </button>
        </div>
    )
}