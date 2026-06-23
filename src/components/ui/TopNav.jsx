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

const NAV_ITEMS = [
    { to: '/', label: 'Inicio', icon: HomeIcon, exact: true },
    { to: '/canchita', label: 'Equipo', icon: CourtIcon },
    { to: '/mercado', label: 'Mercado', icon: MarketIcon },
    { to: '/torneos', label: 'Torneos', icon: TrophyIcon },
    { to: '/lideres', label: 'Líderes', icon: StatsIcon },
]

export default function TopNav({ onLogout, className }) {
    return (
        <nav className={clsx("bg-card border-b border-border h-16 flex items-center justify-between px-6 shrink-0", className)}>
            <div className="flex items-center">
                <img src="/icons/logo_blanco.png" alt="Sexto Hombre Fantasy" className="h-10 object-contain" />
            </div>

            <div className="flex items-center gap-2">
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

            <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-textMuted hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
                <LogoutIcon className="w-5 h-5" />
                <span className="hidden md:block">Salir</span>
            </button>
        </nav>
    )
}
