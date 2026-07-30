import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getRankingJornada } from '../../api/rankingApi'
import CamisetaSVG from '../jugador/CamisetaSVG'

function StatCard({ label, valor }) {
    return (
        <div className="bg-surface rounded-xl p-3 text-center border border-border">
            <p className="text-accent font-bold text-lg tabular-nums">{valor}</p>
            <p className="text-textMuted text-xs mt-0.5">{label}</p>
        </div>
    )
}

export default function DashboardClasicoGlobal({ 
    plantel, 
    miPosicion, 
    rankingGlobal, 
    jornadas, 
    jornadaSelInicial 
}) {
    const navigate = useNavigate()
    const [rankingFecha, setRankingFecha] = useState([])
    const [jornadaSel, setJornadaSel] = useState(jornadaSelInicial)
    const [jornadaTab, setJornadaTab] = useState('global')

    useEffect(() => {
        if (!jornadaSel) return
        getRankingJornada(jornadaSel, 5).then(setRankingFecha).catch(() => { })
    }, [jornadaSel])

    useEffect(() => {
        if(jornadaSelInicial && !jornadaSel) {
            setJornadaSel(jornadaSelInicial)
        }
    }, [jornadaSelInicial])

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-4">
                {/* ── Mi equipo ── */}
                <div className="card space-y-3">
                    <h3 className="text-textMain font-semibold">Mi Equipo</h3>

                    {plantel ? (
                        <>
                            {/* Stats del plantel */}
                            <div className="grid grid-cols-3 gap-2">
                                <StatCard
                                    label="Presupuesto"
                                    valor={`${plantel.presupuestoRestante?.toFixed(1)} cr`}
                                />
                                <StatCard
                                    label={`Jornada ${plantel.jornadaNumero}`}
                                    valor={plantel.puntajeObtenidoFecha?.toFixed(1) ?? '—'}
                                />
                                <StatCard
                                    label="Transferencias disponibles"
                                    valor={`${plantel.transferenciasRestantes}/3`}
                                />
                            </div>

                            {/* Mi posición en el ranking */}
                            {miPosicion && (
                                <div className="bg-surface rounded-2xl p-3 border border-border
                                  flex items-center gap-3">
                                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center
                      text-sm font-black shrink-0
                      ${miPosicion.posicion === 1 ? 'bg-yellow-500 text-white' : ''}
                      ${miPosicion.posicion === 2 ? 'bg-gray-400 text-white' : ''}
                      ${miPosicion.posicion === 3 ? 'bg-amber-700 text-white' : ''}
                      ${miPosicion.posicion >= 4 ? 'bg-border text-textMuted' : ''}
                    `}>
                                        {miPosicion.posicion}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-textMain text-[15px] font-semibold truncate">
                                            {miPosicion.nombreEquipo}
                                        </p>
                                        <p className="text-textMuted text-xs">Ranking general</p>
                                    </div>
                                    <span className="text-accent font-bold tabular-nums text-[15px]">
                                        {miPosicion.puntajeGlobal?.toFixed(1)} pts
                                    </span>
                                </div>
                            )}

                            <button
                                onClick={() => navigate('/canchita')}
                                className="btn-primary w-full"
                            >
                                Ver Equipo
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-4 space-y-3">
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

            {/* ── Rankings (Desktop / Mobile) ── */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vista Desktop (md+): Mostramos ambos rankings separados */}
                <div className="hidden md:block card space-y-3 h-fit">
                    <div className="flex items-center h-[38px]">
                        <h3 className="text-textMain font-bold">
                            Ranking General
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {rankingGlobal.map(fila => (
                            <div key={`global-${fila.equipoVirtualId}`} className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${fila.posicion === 1 ? 'bg-yellow-500 text-white' : fila.posicion === 2 ? 'bg-gray-400 text-white' : fila.posicion === 3 ? 'bg-amber-700 text-white' : 'bg-border text-textMuted'}`}>
                                    {fila.posicion}
                                </span>
                                <p className="flex-1 text-textMain font-medium text-[15px] truncate">{fila.nombreEquipo}</p>
                                <span className="text-accent font-bold text-[15px] tabular-nums shrink-0">{fila.puntajeGlobal?.toFixed(1)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hidden md:flex flex-col card space-y-3 h-fit">
                    <div className="flex items-center justify-between">
                        <h3 className="text-textMain font-bold">Ranking Jornada</h3>
                        {jornadas.length > 0 && (
                            <select
                                value={jornadaSel ?? ''}
                                onChange={e => setJornadaSel(Number(e.target.value))}
                                className="bg-surface border border-border rounded-xl px-4 py-2 min-w-[160px] text-textMain text-sm font-semibold focus:outline-none focus:border-primary cursor-pointer"
                            >
                                {jornadas.map(j => (
                                    <option key={j.id} value={j.id}>Jornada {j.numero}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="space-y-3">
                        {rankingFecha.length === 0 ? (
                            <p className="text-textMuted text-xs text-center py-3">No hay datos para esta jornada.</p>
                        ) : (
                            rankingFecha.filter((v,i,a)=>a.findIndex(t=>(t.equipoVirtualId === v.equipoVirtualId))===i).map(fila => (
                                <div key={`jornada-${fila.equipoVirtualId}`} className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${fila.posicion === 1 ? 'bg-yellow-500 text-white' : fila.posicion === 2 ? 'bg-gray-400 text-white' : fila.posicion === 3 ? 'bg-amber-700 text-white' : 'bg-border text-textMuted'}`}>
                                        {fila.posicion}
                                    </span>
                                    <p className="flex-1 text-textMain font-medium text-[15px] truncate">{fila.nombreEquipo}</p>
                                    <span className="text-accent font-bold text-[15px] tabular-nums shrink-0">{fila.puntajeGlobal?.toFixed(1)}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Vista Móvil (hasta md): Usamos las Tabs */}
                <div className="md:hidden card space-y-3 h-fit">
                        <div className="flex bg-surface rounded-xl p-1 border border-border mb-3">
                        {[
                            { key: 'global', label: 'General' },
                            { key: 'jornada', label: 'Jornada' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setJornadaTab(key)}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${jornadaTab === key ? 'bg-card shadow text-textMain' : 'text-textMuted'}`}
                            >
                                {label}
                            </button>
                        ))}
                        </div>

                    {jornadaTab === 'jornada' && jornadas.length > 0 && (
                        <select
                            value={jornadaSel ?? ''}
                            onChange={e => setJornadaSel(Number(e.target.value))}
                            className="w-full bg-surface border border-border rounded-xl px-3 py-2 text-textMain text-sm focus:outline-none focus:border-primary"
                        >
                            {jornadas.map(j => (
                                <option key={j.id} value={j.id}>Jornada {j.numero}</option>
                            ))}
                        </select>
                    )}

                    <div className="space-y-2">
                        {(jornadaTab === 'global' ? rankingGlobal : rankingFecha).map(fila => (
                            <div key={fila.equipoVirtualId} className="flex items-center gap-3">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${fila.posicion === 1 ? 'bg-yellow-500 text-white' : fila.posicion === 2 ? 'bg-gray-400 text-white' : fila.posicion === 3 ? 'bg-amber-700 text-white' : 'bg-border text-textMuted'}`}>
                                    {fila.posicion}
                                </span>
                                <p className="flex-1 text-textMain font-medium text-[15px] truncate">{fila.nombreEquipo}</p>
                                <span className="text-accent font-bold text-[15px] tabular-nums shrink-0">{fila.puntajeGlobal?.toFixed(1)}</span>
                            </div>
                        ))}
                        {jornadaTab === 'jornada' && rankingFecha.length === 0 && (
                            <p className="text-textMuted text-xs text-center py-3">No hay datos para esta jornada.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
