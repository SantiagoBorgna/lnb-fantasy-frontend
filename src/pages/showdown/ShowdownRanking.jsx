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
                return (
                    <div className="flex items-center gap-2 text-success bg-success/10 px-4 py-2 rounded-full text-sm font-medium">
                        <CheckCircle className="w-4 h-4" />
                        <span>Resultados Finales</span>
                    </div>
                )
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
                    <h1 className="text-2xl font-black text-textMain tracking-tight">
                        {evento.localSigla} vs {evento.visitanteSigla}
                    </h1>
                    <div className="flex justify-center">
                        {renderEstado()}
                    </div>
                </div>

                {/* Resumen Usuario */}
                {myRankIndex !== -1 && (
                    <div className="bg-primary text-bg rounded-2xl p-6 shadow-xl shadow-primary/20 flex items-center justify-between">
                        <div>
                            <div className="text-primary-light font-medium text-sm mb-1 uppercase tracking-wider">Tu Posición</div>
                            <div className="text-4xl font-black">#{myRank}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-primary-light font-medium text-sm mb-1 uppercase tracking-wider">Puntos</div>
                            <div className="text-3xl font-bold">{ranking[myRankIndex].puntosTotales.toFixed(1)}</div>
                        </div>
                    </div>
                )}

                {/* Leaderboard */}
                <div className="bg-surface rounded-3xl border border-border overflow-hidden">
                    <div className="p-4 border-b border-border bg-card">
                        <h2 className="font-bold text-textMain flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-warning" />
                            Tabla de Posiciones
                        </h2>
                    </div>
                    <div className="divide-y divide-border">
                        {ranking.map((p, index) => {
                            const isMe = p.esMio
                            return (
                                <div key={p.id} className={`flex items-center p-4 transition-colors ${isMe ? 'bg-primary/5' : ''}`}>
                                    <div className={`w-8 font-bold text-lg ${index < 3 ? 'text-warning' : 'text-textMuted'}`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-bold ${isMe ? 'text-primary' : 'text-textMain'}`}>
                                            {p.nombre} {p.apellido} {isMe && "(Vos)"}
                                        </div>
                                    </div>
                                    <div className="font-mono font-bold text-textMain">
                                        {p.puntosTotales.toFixed(1)}
                                    </div>
                                </div>
                            )
                        })}
                        {ranking.length === 0 && (
                            <div className="p-8 text-center text-textMuted text-sm">
                                Aún no hay participantes en este evento.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
