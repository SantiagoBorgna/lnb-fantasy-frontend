import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Trophy, Users, TrendingUp, Ticket } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { verRedirectPendiente } from '../utils/redirectPendiente'
import { track } from '../utils/analytics'
import Footer from '../components/ui/Footer'
import { LIGAS } from '../config/ligas'
import { useLigaActual } from '../store/ligaStore'
import { cambiarLiga } from '../utils/cambiarLiga'
import LigaLogo from '../components/liga/LigaLogo'

// Naranja de la pelota del logo, para destacar
const NARANJA = 'text-[#F5862E]'

const pasos = (liga) => [
    {
        titulo: 'Armá tu equipo',
        texto: `Tenés 100 créditos para fichar 10 jugadores reales de la ${liga.nombre}. Máximo 2 por club.`,
    },
    {
        titulo: 'Elegí capitán y sexto hombre',
        texto: 'El capitán suma x1.5 y el sexto hombre x0.75 de sus puntos. Ahí se ganan las jornadas.',
    },
    {
        titulo: 'Sumá con los partidos reales',
        texto: 'Puntos, rebotes, asistencias, robos y tapas de cada jugador se convierten en puntos para tu equipo',
    },
]

const BENEFICIOS = [
    {
        icono: Trophy,
        titulo: 'Premio todas las jornadas',
        texto: 'Cada jornada hay premio para el mejor equipo. No hace falta haber arrancado desde el principio.',
    },
    {
        icono: Users,
        titulo: 'Ligas con amigos',
        texto: 'Creá tu liga privada y pasales el link. Modo clásico, cara a cara o draft en vivo por turnos.',
    },
    {
        icono: TrendingUp,
        titulo: 'Mercado con precios vivos',
        texto: 'Los precios suben y bajan según el rendimiento real. Fichá barato antes que los demás.',
    },
]

export default function LoginPage() {
    const token = useAuthStore(state => state.token)
    const navigate = useNavigate()
    const liga = useLigaActual()

    // Si ya está autenticado, redirigir al dashboard
    useEffect(() => {
        if (token) navigate('/', { replace: true })
    }, [token, navigate])

    // Si llegó desde un link de invitación a un torneo
    const vieneInvitado = verRedirectPendiente()?.startsWith('/u/')

    return (
        <div className="min-h-screen bg-surface text-textMain">

            {/* ── Hero ─────────────────────────────────────────── */}
            <section className="relative overflow-hidden px-6 pt-16 pb-8 md:pt-24 md:pb-24">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-surface to-surface pointer-events-none" />

                <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-20">
                    <div className="flex-1 text-center md:text-left">
                        {vieneInvitado && (
                            <div className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-[#F5862E]/40 bg-[#F5862E]/10 px-4 py-2 text-sm font-semibold">
                                <Ticket size={18} className={NARANJA} />
                                Te invitaron a un torneo. Ingresá para sumarte.
                            </div>
                        )}

                        <img
                            src="/icons/logo-cuadrado.jpg"
                            alt="Sexto Hombre Fantasy"
                            className="w-36 h-36 md:hidden mx-auto mb-8 object-cover rounded-[28px] drop-shadow-xl"
                        />

                        <p className="text-textMuted text-xs md:text-sm font-bold uppercase tracking-[0.2em] mb-3 md:mb-4">
                            Sexto Hombre Fantasy
                        </p>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
                            El fantasy de la <span className={NARANJA}>{liga.nombre}</span> de Básquet
                        </h1>
                        <p className="text-textMuted mt-4 md:mt-6 text-base md:text-xl max-w-md md:max-w-xl mx-auto md:mx-0">
                            Armá tu equipo con jugadores reales, sumá puntos con cada partido y competí con tus amigos.
                        </p>

                        <div className="mt-5 md:mt-6 flex flex-wrap justify-center md:justify-start gap-2">
                            {['Gratis', 'Premio todas las jornadas'].map(t => (
                                <span key={t} className="rounded-full border border-border bg-card px-3 py-1 md:px-4 md:py-1.5 text-xs md:text-sm font-semibold">
                                    {t}
                                </span>
                            ))}
                        </div>

                        <div className="mt-8 md:mt-10 max-w-sm md:max-w-md mx-auto md:mx-0">
                            <SelectorLiga ligaId={liga.id} />
                            <BotonesLogin grande seccion="hero" />
                        </div>
                    </div>

                    <img
                        src="/icons/logo-cuadrado.jpg"
                        alt=""
                        className="hidden md:block w-80 h-80 lg:w-96 lg:h-96 object-cover rounded-[40px] shadow-2xl shadow-black/40"
                    />
                </div>
            </section>

            {/* ── Cómo se juega ────────────────────────────────── */}
            <section className="px-6 pt-6 pb-8 md:py-12 max-w-5xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-black text-center mb-8">Cómo se juega</h2>
                <ol className="grid gap-4 md:grid-cols-3">
                    {/* Celular: número a la izquierda de título y texto. PC: número y título en la misma fila, texto abajo */}
                    {pasos(liga).map(({ titulo, texto }, i) => (
                        <li key={titulo} className="card grid grid-cols-[auto_1fr] gap-x-4 md:gap-x-3 md:gap-y-3 items-center">
                            <span className="row-span-2 md:row-span-1 w-9 h-9 rounded-full bg-primary flex items-center justify-center font-black">
                                {i + 1}
                            </span>
                            <p className="font-bold self-end md:self-center">{titulo}</p>
                            <p className="text-textMuted text-sm mt-1 md:mt-0 leading-relaxed self-start md:col-span-2">{texto}</p>
                        </li>
                    ))}
                </ol>
            </section>

            {/* ── Por qué jugar ────────────────────────────────── */}
            <section className="px-6 pt-4 pb-12 md:py-12 max-w-5xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-black text-center mb-8">Mucho más que armar un quinteto</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {BENEFICIOS.map(({ icono: Icono, titulo, texto }, i) => (
                        <div
                            key={titulo}
                            className={`card flex gap-4 ${
                                i === BENEFICIOS.length - 1 && BENEFICIOS.length % 2 === 1
                                    ? 'sm:col-span-2 sm:justify-self-center sm:w-[calc(50%-0.5rem)]'
                                    : ''
                            }`}
                        >
                            <Icono size={26} className={`${NARANJA} shrink-0 mt-0.5`} />
                            <div>
                                <p className="font-bold">{titulo}</p>
                                <p className="text-textMuted text-sm mt-1 leading-relaxed">{texto}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA final ────────────────────────────────────── */}
            <section className="px-6 py-14">
                <div className="max-w-md mx-auto text-center card bg-gradient-to-b from-primary/60 to-card py-8 px-6">
                    <h2 className="text-2xl font-black">¿Listo para armar tu equipo?</h2>
                    <p className="text-textMuted text-sm mt-2 mb-6">Es gratis y en 2 minutos estás jugando.</p>
                    <BotonesLogin seccion="final" />
                </div>
            </section>

            <div className="pb-[calc(env(safe-area-inset-bottom)+2rem)] md:pb-0">
                <Footer />
            </div>
        </div>
    )
}

// Con más de una liga: elegir en cuál jugar antes de entrar (se recuerda para la próxima)
function SelectorLiga({ ligaId }) {
    if (LIGAS.length < 2) return null

    const elegir = (id) => {
        if (cambiarLiga(id)) track('cambiar_liga', { ubicacion: 'landing' })
    }

    return (
        <div className="mb-6">
            <p className="text-sm md:text-base font-bold mb-3 text-center md:text-left">¿En qué liga querés jugar?</p>
            <div className="grid grid-cols-2 gap-3">
                {LIGAS.map(l => {
                    const elegida = l.id === ligaId
                    return (
                        <button
                            key={l.id}
                            type="button"
                            onClick={() => elegir(l.id)}
                            aria-pressed={elegida}
                            className={`flex flex-col items-center gap-3 rounded-2xl border-2 px-3 py-4 transition-colors ${
                                elegida
                                    ? 'border-[#F5862E] bg-[#F5862E]/10'
                                    : 'border-border bg-card hover:border-textMuted'
                            }`}
                        >
                            <LigaLogo liga={l} className="h-12 md:h-14 max-w-full" />
                            <span className={`text-sm md:text-base font-bold leading-tight ${elegida ? '' : 'text-textMuted'}`}>
                                {l.nombre}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

function BotonesLogin({ grande = false, seccion }) {
    const medirClick = (metodo) => () => track('login_click', {
        metodo,
        seccion,
        invitado: !!verRedirectPendiente()?.startsWith('/u/'),
    })
    const tamano = grande ? 'md:py-4 md:text-lg' : ''
    return (
        <div className="space-y-3">
            <a
                href={import.meta.env.VITE_OAUTH2_GOOGLE_URL}
                onClick={medirClick('google')}
                className={`${tamano}
                flex items-center justify-center gap-3
                w-full py-3 px-4 rounded-2xl
                bg-white text-gray-800 font-semibold
                hover:bg-gray-100 transition-colors
                shadow-lg
                `}
            >
                <GoogleIcon />
                Continuar con Google
            </a>

            <a
                href={import.meta.env.VITE_OAUTH2_MICROSOFT_URL}
                onClick={medirClick('microsoft')}
                className={`${tamano}
                flex items-center justify-center gap-3
                w-full py-3 px-4 rounded-2xl
                bg-[#2F2F2F] text-white font-semibold
                hover:bg-[#404040] transition-colors
                shadow-lg
                `}
            >
                <MicrosoftIcon />
                Continuar con Microsoft
            </a>

            <p className={`text-textMuted text-xs text-center pt-1 ${grande ? 'md:text-sm' : ''}`}>
                Al continuar, aceptás nuestros{' '}
                <Link to="/terminos" className="text-textMain hover:underline font-semibold">
                    Términos y Condiciones
                </Link>
                {' '}y Política de Privacidad.
            </p>
        </div>
    )
}

function GoogleIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
    )
}

function MicrosoftIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#F25022" d="M1 1h10v10H1z" />
            <path fill="#00A4EF" d="M13 1h10v10H13z" />
            <path fill="#7FBA00" d="M1 13h10v10H1z" />
            <path fill="#FFB900" d="M13 13h10v10H13z" />
        </svg>
    )
}