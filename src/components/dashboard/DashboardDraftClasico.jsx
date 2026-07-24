import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import MercadoWidget from './MercadoWidget'
import clsx from 'clsx'

function StatCard({ label, valor }) {
    return (
        <div className="bg-surface rounded-xl p-3 text-center border border-border">
            <p className="text-accent font-bold text-lg tabular-nums">{valor}</p>
            <p className="text-textMuted text-xs mt-0.5">{label}</p>
        </div>
    )
}

export default function DashboardDraftClasico({ plantel, miPosicion, rankingGlobal, contextoActual }) {
    const navigate = useNavigate()
    const usuario = useAuthStore(state => state.usuario)

    const miEquipoId = useMemo(() => {
        const miFila = rankingGlobal?.find(r => r.usuarioId === usuario?.id || r.nombreUsuario === usuario?.nombreDisplay)
        return miFila ? miFila.equipoVirtualId : null
    }, [rankingGlobal, usuario])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* ── Columna 1: Mi Equipo ── */}
            <div className="h-fit">
                <div className="card space-y-4">
                    <h3 className="text-textMain font-bold">Mi Equipo</h3>

                    {plantel ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                <StatCard
                                    label={`Jornada ${plantel.jornadaNumero}`}
                                    valor={plantel.puntajeObtenidoFecha?.toFixed(1) ?? '—'}
                                />
                                <StatCard
                                    label="Pts Totales"
                                    valor={miPosicion?.puntajeGlobal?.toFixed(1) ?? '0.0'}
                                />
                            </div>

                            <button
                                onClick={() => navigate('/canchita')}
                                className="btn-primary w-full"
                            >
                                Ver equipo
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center space-y-3 py-2">
                            <p className="text-textMuted text-sm">
                                Comenzarás a jugar en la siguiente jornada.
                            </p>
                            <button
                                onClick={() => navigate('/canchita')}
                                className="btn-accent w-full"
                            >
                                Ver Equipo
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Columna 2: Tabla de Posiciones ── */}
            <div className="h-fit">
                <div className="card space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="text-textMain font-bold">
                            Posiciones de la Liga
                        </h3>
                    </div>
                    <div className="flex-1 space-y-2">
                        {rankingGlobal.map(fila => {
                            return (
                                <div key={`global-${fila.equipoVirtualId}`} className="flex items-center justify-between py-1">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${fila.posicion === 1 ? 'bg-yellow-500 text-white' : fila.posicion === 2 ? 'bg-gray-400 text-white' : fila.posicion === 3 ? 'bg-amber-700 text-white' : 'bg-border text-textMuted'}`}>
                                            {fila.posicion}
                                        </span>
                                        <p className="font-medium text-[15px] truncate text-textMain">
                                            {fila.nombreEquipo}
                                        </p>
                                    </div>
                                    <span className="text-accent font-bold text-[15px] tabular-nums shrink-0">{fila.puntajeGlobal?.toFixed(1) ?? '0.0'}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* ── Columna 3: Mercado ── */}
            <div className="h-full">
                <MercadoWidget torneoId={contextoActual.id} miEquipoId={miEquipoId} />
            </div>

        </div>
    )
}
