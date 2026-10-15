import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Trophy, Users, QrCode, TrendingUp, Crown, Wallet, Ticket } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { verRedirectPendiente } from '../utils/redirectPendiente'
import Footer from '../components/ui/Footer'

// Naranja de la pelota del logo, para destacar
const NARANJA = 'text-[#F5862E]'

const PASOS = [
    {
        icono: Wallet,
        titulo: 'Armá tu equipo',
        texto: 'Tenés 100 créditos para fichar 10 jugadores reales de la Liga Nacional. Máximo 2 por club.',
    },
    {
        icono: Crown,
        titulo: 'Elegí capitán y sexto hombre',
        texto: 'El capitán suma x1.5 y el sexto hombre el 75% de sus puntos. Ahí se ganan las jornadas.',
    },
    {
        icono: TrendingUp,
        titulo: 'Sumá con los partidos reales',
        texto: 'Puntos, rebotes, asistencias, robos y tapas de cada partido se convierten en puntos para tu equipo.',
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
        icono: QrCode,
        titulo: 'Modo Estadio',
        texto: '¿Vas a la cancha? Escaneá el QR y armá un equipo solo para el partido que estás viendo.',
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

    // Si ya está autenticado, redirigir al dashboard
    useEffect(() => {
        if (token) navigate('/', { replace: true })
    }, [token, navigate])

    // Si llegó desde un link de invitación a un torneo
    const vieneInvitado = verRedirectPendiente()?.startsWith('/u/')

    return (
        <div className="min-h-screen bg-surface text-textMain">

            {/* ── Hero ─────────────────────────────────────────── */}
            <section className="relative overflow-hidden px-6 pt-10 pb-14 md:pt-16 md:pb-20">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-surface to-surface pointer-events-none" />

                <div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-16">
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
                            className="w-24 h-24 md:hidden mx-auto mb-6 object-cover rounded-[22px] drop-shadow-xl"
                        />

                        <p className="text-textMuted text-xs font-bold uppercase tracking-[0.2em] mb-3">
                            Sexto Hombre Fantasy
                        </p>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05]">
                            El fantasy de la <span className={NARANJA}>Liga Nacional</span> de Básquet
                        </h1>
                        <p className="text-textMuted mt-4 text-base md:text-lg max-w-md mx-auto md:mx-0">
                            Armá tu equipo con jugadores reales, sumá puntos con cada partido y competí con tus amigos.
                        </p>

                        <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-2">
                            {['Gratis', 'Premio todas las jornadas', 'Ligas con amigos'].map(t => (
                                <span key={t} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
                                    {t}
                                </span>
                            ))}
                        </div>

                        <div className="mt-8 max-w-sm mx-auto md:mx-0">
                            <BotonesLogin />
                        </div>
                    </div>

                    <img
                        src="/icons/logo-cuadrado.jpg"
                        alt=""
                        className="hidden md:block w-72 h-72 object-cover rounded-[36px] shadow-2xl shadow-black/40"
                    />
                </div>
            </section>

            {/* ── Cómo se juega ────────────────────────────────── */}
            <section className="px-6 py-12 max-w-5xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-black text-center mb-8">Cómo se juega</h2>
                <ol className="grid gap-4 md:grid-cols-3">
                    {PASOS.map(({ icono: Icono, titulo, texto }, i) => (
                        <li key={titulo} className="card flex gap-4 md:flex-col">
                            <div className="flex items-center gap-3 shrink-0">
                                <span className="w-9 h-9 rounded-full bg-primary flex items-center justify-center font-black">
                                    {i + 1}
                                </span>
                                <Icono size={22} className={`${NARANJA} hidden md:block`} />
                            </div>
                            <div>
                                <p className="font-bold">{titulo}</p>
                                <p className="text-textMuted text-sm mt-1 leading-relaxed">{texto}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            {/* ── Por qué jugar ────────────────────────────────── */}
            <section className="px-6 py-12 max-w-5xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-black text-center mb-8">Mucho más que armar un quinteto</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {BENEFICIOS.map(({ icono: Icono, titulo, texto }) => (
                        <div key={titulo} className="card flex gap-4">
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
                    <BotonesLogin />
                </div>
            </section>

            <Footer />
        </div>
    )
}

function BotonesLogin() {
    return (
        <div className="space-y-3">
            <a
                href={import.meta.env.VITE_OAUTH2_GOOGLE_URL}
                className="
                flex items-center justify-center gap-3
                w-full py-3 px-4 rounded-2xl
                bg-white text-gray-800 font-semibold
                hover:bg-gray-100 transition-colors
                shadow-lg
                "
            >
                <GoogleIcon />
                Continuar con Google
            </a>

            <a
                href={import.meta.env.VITE_OAUTH2_MICROSOFT_URL}
                className="
                flex items-center justify-center gap-3
                w-full py-3 px-4 rounded-2xl
                bg-[#2F2F2F] text-white font-semibold
                hover:bg-[#404040] transition-colors
                shadow-lg
                "
            >
                <MicrosoftIcon />
                Continuar con Microsoft
            </a>

            <p className="text-textMuted text-xs text-center pt-1">
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