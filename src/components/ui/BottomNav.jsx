import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { logout } from '../../api/authApi'
import { useAuthStore } from '../../store/authStore'

const NAV_ITEMS = [
    {
        to: '/',
        label: 'Inicio',
        icon: HomeIcon,
        exact: true,
    },
    {
        to: '/canchita',
        label: 'Equipo',
        icon: CourtIcon,
    },
    {
        to: '/mercado',
        label: 'Mercado',
        icon: MarketIcon,
    },
    {
        to: '/torneos',
        label: 'Torneos',
        icon: TrophyIcon,
    },
    {
        to: '/lideres',
        label: 'Líderes',
        icon: StatsIcon,
    },
]

export default function BottomNav({ onLogout }) {
    const navigate = useNavigate()
    const { setAuth } = useAuthStore()

    return (
        <nav className="
      fixed bottom-0 left-0 right-0
      max-w-md mx-auto
      bg-card border-t border-border
      flex items-center justify-around
      h-16 px-2
      z-50
    ">
            {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
                <NavLink
                    key={to}
                    to={to}
                    end={exact}
                    className={({ isActive }) => clsx(
                        'flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl',
                        'text-xs font-medium transition-colors',
                        isActive
                            ? 'text-accent'
                            : 'text-textMuted hover:text-textMain'
                    )}
                >
                    <Icon className="w-5 h-5" />
                    <span>{label}</span>
                </NavLink>
            ))}

            {/* ── Botón de Salir con la función asignada ── */}
            <button
                onClick={onLogout} // <-- Cambiá handleLogout por onLogout
                className="flex flex-col items-center gap-0.5 px-3 py-1
             rounded-xl text-xs font-medium text-textMuted
             hover:text-accent transition-colors"
            >
                <LogoutIcon className="w-5 h-5" />
                <span>Salir</span>
            </button>
        </nav>
    )
}

// ── Íconos SVG inline (sin dependencia de librería de íconos) ───────────────
function HomeIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    )
}

function CourtIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="5" width="18" height="14" rx="1" strokeLinecap="round" />
            <line x1="12" y1="5" x2="12" y2="19" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

function MarketIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
    )
}

function TrophyIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 21h8m-4-4v4M5 3H3v5a4 4 0 004 4h.5M19 3h2v5a4 4 0 01-4 4h-.5M7 3h10v6a5 5 0 01-10 0V3z" />
        </svg>
    )
}

function StatsIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    )
}

function LogoutIcon({ className }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
        </svg>
    )
}