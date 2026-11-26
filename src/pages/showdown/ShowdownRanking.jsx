import { Trophy, Clock, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import ShowdownCanchita from '../../components/showdown/ShowdownCanchita'
import ShowdownStatsModal from '../../components/showdown/ShowdownStatsModal'
import SponsorsBanner from '../../components/ui/SponsorsBanner'

export default function ShowdownRanking({ evento, ranking, miEquipo, conSponsors = false }) {
    const [activeTab, setActiveTab] = useState('ranking')
    const [selectedJugador, setSelectedJugador] = useState(null)

    // Al llegar desde el armado del equipo la página quedaba scrolleada abajo
    useEffect(() => { window.scrollTo(0, 0) }, [])
    const renderEstado = () => {
        switch (evento.estado) {
            case 'ABIERTO':
                return (
                    <div className="flex items-center gap-2 text-warning bg-warning/10 px-4 py-2 rounded-full text-sm font-medium">
                        <Clock className="w-4 h-4" />
                        <span>Esperando inicio de partido</span>
                    </div>
                )
            case 'EN_CURSO':
                return (
                    <div className="flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-full text-sm font-medium">
                        <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                        <span>Partido en curso</span>
                    </div>
                )
            case 'FINALIZADO':
                return null;
            default: return null
        }
    }

    // Con el mismo puntaje se comparte la posición (1, 1, 3...)
    const posiciones = ranking.map((p, i) => ranking.findIndex(o => o.puntosTotales === p.puntosTotales) + 1)
    const myRankIndex = ranking.findIndex(p => p.esMio)
    const myRank = myRankIndex !== -1 ? posiciones[myRankIndex] : '-'
    // Empate en el primer puesto: el premio se sortea entre los empatados (términos, sección 7)
    const empateEnPrimero = posiciones.filter(pos => pos === 1).length > 1

    return (
        <div className="min-h-screen bg-bg dark flex flex-col items-center p-4">
            <div className="w-full max-w-md flex flex-col gap-3 pt-1 pb-8">
                {/* Sponsors arriba de todo: al final de la página no se veían */}
                {conSponsors && <SponsorsBanner className="!py-1" />}

                {/* Header */}
                <div className="text-center space-y-2">
                    <div>
                        <h1 className="text-xl font-black text-textMain tracking-tight">
                            {evento.localNombre?.replace(' (O)', '') || evento.localSigla} vs {evento.visitanteNombre?.replace(' (O)', '') || evento.visitanteSigla}
                        </h1>
                        {evento.fecha && (
                            <p className="text-textMuted text-sm font-medium mt-1">
                                {new Date(evento.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                    {/* Finalizado no muestra estado: sin el contenedor vacío no queda el hueco */}
                    {evento.estado !== 'FINALIZADO' && (
                        <div className="flex justify-center">
                            {renderEstado()}
                        </div>
                    )}
                </div>

                {/* Winner Banner */}
                {evento.estado === 'FINALIZADO' && myRank === 1 && (
                    <div className="bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl px-4 py-2.5 text-center">
                        <p className="font-bold text-lg">{empateEnPrimero ? '¡Estás empatado en el primer puesto!' : '¡Ganaste!'}</p>
                        <p className="text-sm mt-0.5">
                            {empateEnPrimero ? 'El premio se sortea entre los empatados. ' : ''}Nos vamos a comunicar con vos muy pronto.
                        </p>
                    </div>
                )}

                {/* Tabs */}
                {miEquipo && (
                    <div className="flex bg-surface border border-border rounded-lg p-1">
                        {[
                            { key: 'ranking', label: 'Ranking' },
                            { key: 'equipo', label: 'Mi Equipo' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`flex-1 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === key ? 'bg-card shadow text-textMain' : 'text-textMuted hover:text-textMain'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {activeTab === 'ranking' ? (
                    <>
                        {/* Resumen Usuario */}
                        {myRankIndex !== -1 && (
                    <div className="bg-surface text-textMain rounded-2xl px-4 py-3 shadow-xl grid grid-cols-2 items-center border border-border">
                        <div className="flex justify-center">
                            <div className="flex flex-col items-center">
                                <div className="text-textMuted font-medium text-[11px] mb-1.5 uppercase tracking-widest">Tu Posición</div>
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shrink-0 ${myRank === 1 ? 'bg-yellow-500 text-white' : myRank === 2 ? 'bg-gray-400 text-white' : myRank === 3 ? 'bg-amber-700 text-white' : 'bg-border text-textMuted'}`}>
                                    {myRank}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="text-textMuted font-medium text-[11px] mb-1.5 uppercase tracking-widest">Tus Puntos</div>
                            <div className="text-3xl font-black text-accent tabular-nums">{ranking[myRankIndex].puntosTotales.toFixed(1)}</div>
                        </div>
                    </div>
                )}

                {/* Leaderboard */}
                <div className="bg-surface rounded-2xl border border-border overflow-hidden px-4 py-3 space-y-2">
                    <h2 className="font-bold text-textMain flex items-center gap-2 text-lg">
                        <Trophy className="w-5 h-5 text-warning" />
                        Tabla de Posiciones
                    </h2>
                    
                    <div className="space-y-1">
                        {ranking.slice(0, 10).map((p, index) => {
                            const posicion = posiciones[index]
                            const isMe = p.esMio
                            return (
                                <div key={p.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${isMe ? 'bg-white/5 border border-white/10' : ''}`}>
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${posicion === 1 ? 'bg-yellow-500 text-white' : posicion === 2 ? 'bg-gray-400 text-white' : posicion === 3 ? 'bg-amber-700 text-white' : 'bg-border text-textMuted'}`}>
                                        {posicion}
                                    </span>
                                    <p className={`flex-1 text-[15px] truncate ${isMe ? 'text-white font-bold' : 'text-textMain font-medium'}`}>
                                        {p.nombre} {p.apellido}
                                    </p>
                                    <span className="text-accent font-bold text-[15px] tabular-nums shrink-0">
                                        {p.puntosTotales.toFixed(1)}
                                    </span>
                                </div>
                            )
                        })}
                        {ranking.length === 0 && (
                            <div className="py-8 text-center text-textMuted text-sm">
                                Aún no hay participantes en este evento.
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-2xl px-4 py-4 text-center">
                    <h3 className="text-lg font-black text-textMain mb-2">¿Querés seguir jugando?</h3>
                    <p className="text-sm text-textMuted mb-3">
                        Registrate en Sexto Hombre Fantasy y competí todas las semanas por grandes premios. ¡Es gratis!
                    </p>
                    <button 
                        onClick={() => window.open('/', '_blank')} 
                        className="w-full bg-primary text-bg font-bold rounded-xl py-3 hover:bg-primary/90 transition-colors shadow-md"
                    >
                        ¡Registrarme ahora!
                    </button>
                </div>
            </>
        ) : (
            <div className="animate-fade-in space-y-3">
                        {/* Total del equipo arriba de la canchita */}
                        {miEquipo && (
                            <div className="bg-surface border border-border rounded-2xl px-4 py-3 flex flex-col items-center">
                                <span className="text-textMuted font-medium text-[11px] mb-1 uppercase tracking-widest">Tus Puntos</span>
                                <span className="text-3xl font-black text-accent tabular-nums">{(miEquipo.puntosTotales ?? 0).toFixed(1)}</span>
                            </div>
                        )}
                        {/* Mi Equipo Tab */}
                        {miEquipo && (() => {
                            const plantel = {};
                            miEquipo.jugadores.forEach(j => {
                                // Match position name correctly, assuming exact match or mapping if needed
                                // The backend returns Base, Escolta, Alero, AlaPivot, Pivot
                                let posKey = j.posicion;
                                if (posKey === 'ALA_PIVOT') posKey = 'AlaPivot';
                                else if (posKey === 'BASE') posKey = 'Base';
                                else if (posKey === 'ESCOLTA') posKey = 'Escolta';
                                else if (posKey === 'ALERO') posKey = 'Alero';
                                else if (posKey === 'PIVOT') posKey = 'Pivot';
                                
                                plantel[posKey] = j;
                            });
                            
                            const capitan = miEquipo.jugadores.find(j => j.esCapitan);
                            
                            return (
                                <ShowdownCanchita
                                    plantel={plantel}
                                    capitanId={capitan?.id}
                                    modo="ranking"
                                    onSlotLlenoTap={(slot) => setSelectedJugador(slot.jugador)}
                                />
                            );
                        })()}
                    </div>
                )}
            </div>

            <ShowdownStatsModal
                isOpen={!!selectedJugador}
                onClose={() => setSelectedJugador(null)}
                jugador={selectedJugador}
            />
        </div>
    )
}
