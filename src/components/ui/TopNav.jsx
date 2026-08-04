import { NavLink } from 'react-router-dom'
import clsx from 'clsx'
import { 
    HomeIcon, 
    CourtIcon, 
    MarketIcon, 
    TrophyIcon, 
    StatsIcon, 
    LogoutIcon 
} from './BottomNav'

import ContextSwitcher from './ContextSwitcher'

const NAV_ITEMS = [
    { to: '/', label: 'Inicio', icon: HomeIcon, exact: true },
    { to: '/canchita', label: 'Equipo', icon: CourtIcon },
    { to: '/mercado', label: 'Mercado', icon: MarketIcon },
    { to: '/torneos', label: 'Torneos', icon: TrophyIcon },
    { to: '/lideres', label: 'Líderes', icon: StatsIcon },
]

export default function TopNav({ onLogout, className }) {
    return (
        <nav className={clsx("relative bg-card border-b border-border h-16 flex items-center justify-between px-6 shrink-0", className)}>
            <div className="flex items-center gap-4 z-10">
                <NavLink to="/" className="shrink-0 hover:scale-105 transition-transform">
                    <img src="/icons/logo-redondo.png" alt="Sexto Hombre Fantasy" className="h-10 object-contain drop-shadow-[0_0_1px_#ffffff]" />
                </NavLink>
                <ContextSwitcher />
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2">
                {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={exact}
                        className={({ isActive }) => clsx(
                            'flex items-center gap-2 px-4 py-2 rounded-xl',
                            'text-sm font-semibold transition-all',
                            isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-textMuted hover:bg-surface hover:text-textMain'
                        )}
                    >
                        <Icon className="w-5 h-5" />
                        <span className="hidden md:block">{label}</span>
                    </NavLink>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <a 
                    href="https://forms.gle/BGGM2ZK12Fn8gP6L7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-textMuted hover:bg-surface hover:text-textMain transition-all"
                    title="Reportar un problema"
                >
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="hidden md:block">Reportar</span>
                </a>

                <button 
                    onClick={onLogout}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-textMuted hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span className="hidden md:block">Salir</span>
                </button>
            </div>
        </nav>
    )
}
