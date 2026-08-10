import { Trophy, Clock, CheckCircle } from 'lucide-react'

export default function ShowdownRanking({ evento, ranking, uuidDispositivo }) {

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
                        <span>Partido en curso - Calculando puntos...</span>
                    </div>
                )
            case 'FINALIZADO':
                return null;
            default: return null
        }
    }

    const myRankIndex = ranking.findIndex(p => p.esMio)
    const myRank = myRankIndex !== -1 ? myRankIndex + 1 : '-'

    return (
        <div className="min-h-screen bg-bg dark flex flex-col items-center p-4">
            <div className="w-full max-w-md flex flex-col gap-6 pt-4 pb-12">
                
                {/* Header */}
                <div className="text-center space-y-4">
                    <h1 className="text-xl font-black text-textMain tracking-tight">
                        {evento.localNombre?.replace(' (O)', '') || evento.localSigla} vs {evento.visitanteNombre?.replace(' (O)', '') || evento.visitanteSigla}
                    </h1>
                    <div className="flex justify-center">
                        {renderEstado()}
                    </div>
                </div>

                {/* Resumen Usuario */}
                {myRankIndex !== -1 && (
                    <div className="bg-surface text-textMain rounded-2xl p-6 shadow-xl flex items-center justify-between border border-border">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center">
                                <div className="text-textMuted font-medium text-[11px] mb-1.5 uppercase tracking-widest">Tu Posición</div>
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shrink-0 ${myRank === 1 ? 'bg-yellow-500 text-white' : myRank === 2 ? 'bg-gray-400 text-white' : myRank === 3 ? 'bg-amber-700 text-white' : 'bg-border text-textMuted'}`}>
                                    {myRank}
                                </span>
                            </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <div className="text-textMuted font-medium text-[11px] mb-1.5 uppercase tracking-widest">Tus Puntos</div>
                            <div className="text-3xl font-black text-accent tabular-nums">{ranking[myRankIndex].puntosTotales.toFixed(1)}</div>
                        </div>
                    </div>
                )}

                {/* Leaderboard */}
                <div className="bg-surface rounded-2xl border border-border overflow-hidden p-6 space-y-4">
                    <h2 className="font-bold text-textMain flex items-center gap-2 text-lg">
                        <Trophy className="w-5 h-5 text-warning" />
                        Tabla de Posiciones
                    </h2>
                    
                    <div className="space-y-3 mt-4">
                        {ranking.slice(0, 10).map((p, index) => {
                            const posicion = index + 1
                            const isMe = p.esMio
                            return (
                                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isMe ? 'bg-white/5 border border-white/10' : ''}`}>
                                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shrink-0 ${posicion === 1 ? 'bg-yellow-500 text-white' : posicion === 2 ? 'bg-gray-400 text-white' : posicion === 3 ? 'bg-amber-700 text-white' : 'bg-border text-textMuted'}`}>
                                        {posicion}
                                    </span>
                                    <p className={`flex-1 text-[15px] truncate ${isMe ? 'text-white font-bold' : 'text-textMain font-medium'}`}>
                                        {p.nombre} {p.apellido} {isMe && "(Vos)"}
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
            </div>
        </div>
    )
}
