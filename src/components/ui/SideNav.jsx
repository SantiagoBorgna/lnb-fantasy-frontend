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

export default function SideNav({ onLogout, className }) {
    return (
        <nav className={clsx("w-64 bg-card border-r border-border h-full flex flex-col pt-8 pb-6 px-4 shrink-0", className)}>
            <div className="mb-10 px-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-white font-black text-sm">LNB</span>
                </div>
                <h1 className="text-textMain font-bold text-xl tracking-tight">Fantasy</h1>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto scrollbar-hide">
                {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={exact}
                        className={({ isActive }) => clsx(
                            'flex items-center gap-3 px-4 py-3 rounded-2xl',
                            'text-sm font-semibold transition-all',
                            isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-textMuted hover:bg-surface hover:text-textMain'
                        )}
                    >
                        <Icon className="w-6 h-6" />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </div>

            <button 
                onClick={onLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-textMuted hover:bg-red-500/10 hover:text-red-400 transition-all mt-auto"
            >
                <LogoutIcon className="w-6 h-6" />
                <span>Cerrar Sesión</span>
            </button>
        </nav>
    )
}
