import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { getParticipantesShowdown } from '../../api/adminApi'

/** Inscriptos de un Relámpago con su email, para avisarle al ganador. Solo para admins. */
export default function ModalParticipantesShowdown({ evento, onCerrar }) {
    const [participantes, setParticipantes] = useState(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        getParticipantesShowdown(evento.id)
            .then(setParticipantes)
            .catch(() => setError(true))
    }, [evento.id])

    // Con empate en el primer puesto, el ganador se define por sorteo (términos, sección 7)
    const finalizado = evento.estado === 'FINALIZADO'
    const puntosGanador = participantes?.[0]?.puntosTotales
    const hayEmpate = finalizado && participantes?.length > 1 && participantes[1].puntosTotales === puntosGanador

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/70 z-40" onClick={onCerrar} />
            <div className="fixed top-1/2 -translate-y-1/2 left-4 right-4 max-w-md mx-auto bg-card border border-border rounded-3xl z-50 p-6 space-y-4 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <h3 className="text-textMain font-bold text-lg text-center">
                    {evento.localSigla} vs {evento.visitanteSigla}
                </h3>

                {hayEmpate && (
                    <p className="bg-warning/10 text-warning text-sm font-medium rounded-xl p-3 text-center">
                        Hay empate en el primer puesto: definilo por sorteo.
                    </p>
                )}

                <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 space-y-2">
                    {error ? (
                        <p className="py-8 text-center text-red-500 text-sm">No se pudieron cargar los inscriptos.</p>
                    ) : !participantes ? (
                        <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : participantes.length === 0 ? (
                        <p className="py-8 text-center text-textMuted text-sm">Todavía no hay inscriptos.</p>
                    ) : (
                        participantes.map((p, index) => {
                            const esGanador = finalizado && p.puntosTotales === puntosGanador
                            return (
                                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${esGanador ? 'border-warning/40 bg-warning/5' : 'border-border'}`}>
                                    <span className="w-6 text-center text-sm font-black text-textMuted shrink-0">{index + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-textMain font-bold text-sm truncate">{p.nombre} {p.apellido}</p>
                                        <a href={`mailto:${p.email}`} className="text-textMuted text-xs hover:underline break-all">{p.email}</a>
                                    </div>
                                    <span className="text-accent font-bold text-sm tabular-nums shrink-0">{p.puntosTotales.toFixed(1)}</span>
                                </div>
                            )
                        })
                    )}
                </div>

                <button onClick={onCerrar} className="w-full py-2 text-textMuted text-sm font-medium">Cerrar</button>
            </div>
        </>,
        document.body
    )
}
