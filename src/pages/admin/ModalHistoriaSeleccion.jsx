import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import ModalImagenCompartible from '../../components/compartir/ModalImagenCompartible'
import { dibujarGanadorRelampago, dibujarQuintetoIdealRelampago } from '../../components/compartir/relampagoCanvas'
import { getResumenSeleccion, mensajeDeError } from '../../api/seleccionApi'

/**
 * Historias del resultado de un Relámpago Selección: el quinteto del ganador o el quinteto ideal.
 * Si hay empate en el primer puesto, se elige al ganador del sorteo antes de generar la imagen.
 */
export default function ModalHistoriaSeleccion({ evento, tipo, onCerrar }) {
    const [resumen, setResumen] = useState(null)
    const [error, setError] = useState(null)
    const [ganadorId, setGanadorId] = useState(null)

    useEffect(() => {
        getResumenSeleccion(evento.id)
            .then(r => {
                setResumen(r)
                setGanadorId(r.ganadores[0]?.participanteId ?? null)
            })
            .catch(e => setError(mensajeDeError(e, 'No se pudo cargar el resultado')))
    }, [evento.id])

    const esGanador = tipo === 'ganador'
    const ganador = resumen?.ganadores.find(g => g.participanteId === ganadorId)
    const datos = useMemo(() => {
        if (!resumen) return null
        const base = {
            localNombre: resumen.localNombre,
            visitanteNombre: resumen.visitanteNombre,
            puntosLocal: resumen.puntosLocal,
            puntosVisitante: resumen.puntosVisitante,
        }
        if (esGanador) return ganador ? { ...base, ganador } : null
        return resumen.quintetoIdeal.length > 0 ? { ...base, jugadores: resumen.quintetoIdeal } : null
    }, [resumen, esGanador, ganador])

    const slug = `${evento.localSigla}-${evento.visitanteSigla}`.toLowerCase()

    return (
        <ModalImagenCompartible
            titulo={esGanador ? `Ganador ${evento.localSigla} vs ${evento.visitanteSigla}` : `Quinteto ideal ${evento.localSigla} vs ${evento.visitanteSigla}`}
            cargando={!resumen && !error}
            mensajeSinDatos={error ?? (esGanador ? 'No hay inscriptos en este partido.' : 'La planilla no tiene jugadores.')}
            datos={datos}
            dibujar={esGanador ? dibujarGanadorRelampago : dibujarQuintetoIdealRelampago}
            nombreArchivo={esGanador ? `ganador-relampago-${slug}.png` : `quinteto-ideal-relampago-${slug}.png`}
            contentType={esGanador ? 'historia_ganador_relampago' : 'historia_quinteto_ideal_relampago'}
            altImagen={esGanador ? 'Quinteto del ganador del Relámpago' : 'Quinteto ideal del Relámpago'}
            onCerrar={onCerrar}
        >
            {esGanador && resumen?.ganadores.length > 1 && (
                <div className="space-y-2">
                    <p className="text-warning text-sm font-medium">
                        Hay {resumen.ganadores.length} empatados en el primer puesto: elegí al que ganó el sorteo.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {resumen.ganadores.map(g => (
                            <button
                                key={g.participanteId}
                                onClick={() => setGanadorId(g.participanteId)}
                                className={clsx(
                                    'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                                    g.participanteId === ganadorId ? 'bg-primary border-primary text-white' : 'border-border text-textMuted hover:text-textMain'
                                )}
                            >
                                {g.nombre} {g.apellido}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </ModalImagenCompartible>
    )
}
