import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'
import { ChevronLeft } from 'lucide-react'

import AdminShowdownPanel from './AdminShowdownPanel'
import AdminQuintetosPanel from './AdminQuintetosPanel'
import AdminJugadoresPanel from './AdminJugadoresPanel'
import AdminDtsPanel from './AdminDtsPanel'

export default function AdminPage() {
    const usuario = useAuthStore(state => state.usuario)
    const [tab, setTab] = useState('RELAMPAGOS') // 'RELAMPAGOS' o 'QUINTETOS'

    if (!usuario || usuario.rol !== 'ADMIN') {
        return <Navigate to="/" replace />
    }

    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row pb-20 md:pb-0">
            {/* Contenido Principal */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 overflow-y-auto">
                <div className="flex flex-col gap-6">
                    <div>
                        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-textMuted hover:text-primary transition-colors mb-2">
                            <ChevronLeft className="w-4 h-4" />
                            Volver al inicio
                        </Link>
                        <h1 className="text-3xl font-black text-textMain font-display tracking-tight">Panel de Administrador</h1>
                        <p className="text-textMuted mt-1">Gestioná los modos de juego y estadísticas</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex p-1 bg-surface rounded-xl border border-border w-full md:w-max mx-auto md:mx-0">
                        <button
                            onClick={() => setTab('RELAMPAGOS')}
                            className={clsx(
                                "flex-1 md:w-48 py-2 text-sm font-bold rounded-lg transition-all",
                                tab === 'RELAMPAGOS' ? "bg-card text-textMain shadow-sm border border-border" : "text-textMuted hover:text-textMain"
                            )}
                        >
                            Modo Relámpago
                        </button>
                        <button
                            onClick={() => setTab('QUINTETOS')}
                            className={clsx(
                                "flex-1 md:w-32 py-2 text-sm font-bold rounded-lg transition-all",
                                tab === 'QUINTETOS' ? "bg-card text-textMain shadow-sm border border-border" : "text-textMuted hover:text-textMain"
                            )}
                        >
                            Quintetos
                        </button>
                        <button
                            onClick={() => setTab('JUGADORES')}
                            className={clsx(
                                "flex-1 md:w-32 py-2 text-sm font-bold rounded-lg transition-all",
                                tab === 'JUGADORES' ? "bg-card text-textMain shadow-sm border border-border" : "text-textMuted hover:text-textMain"
                            )}
                        >
                            Jugadores
                        </button>
                        <button
                            onClick={() => setTab('DTS')}
                            className={clsx(
                                "flex-1 md:w-32 py-2 text-sm font-bold rounded-lg transition-all",
                                tab === 'DTS' ? "bg-card text-textMain shadow-sm border border-border" : "text-textMuted hover:text-textMain"
                            )}
                        >
                            DTs
                        </button>
                    </div>

                    {/* Content */}
                    <div className="mt-4">
                        {tab === 'RELAMPAGOS' && <AdminShowdownPanel />}
                        {tab === 'QUINTETOS' && <AdminQuintetosPanel />}
                        {tab === 'JUGADORES' && <AdminJugadoresPanel />}
                        {tab === 'DTS' && <AdminDtsPanel />}
                    </div>
                </div>
            </main>
        </div>
    )
}
