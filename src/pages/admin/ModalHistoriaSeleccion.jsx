import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import ModalImagenCompartible from '../../components/compartir/ModalImagenCompartible'
import {
    dibujarGanadorRelampago, dibujarQuintetoIdealRelampago, dibujarTablaRelampago,
    dibujarGanadorRelampagoPost, dibujarQuintetoIdealRelampagoPost, dibujarTablaRelampagoPost,
} from '../../components/compartir/relampagoCanvas'
import { getResumenSeleccion, mensajeDeError } from '../../api/seleccionApi'

// Qué dibuja cada imagen en cada formato (historia 1080x1920, post 1080x1350)
const IMAGENES = {
    ganador: { nombre: 'Ganador', archivo: 'ganador', historia: dibujarGanadorRelampago, post: dibujarGanadorRelampagoPost },
    ideal: { nombre: 'Quinteto ideal', archivo: 'quinteto-ideal', historia: dibujarQuintetoIdealRelampago, post: dibujarQuintetoIdealRelampagoPost },
    tabla: { nombre: 'Tabla', archivo: 'tabla', historia: dibujarTablaRelampago, post: dibujarTablaRelampagoPost },
}

/**
 * Imágenes del resultado de un Relámpago Selección para Instagram: el quinteto del ganador,
 * el quinteto ideal o la tabla (top 10 en historia, top 5 en post).
 * Si hay empate en el primer puesto, se elige al ganador del sorteo antes de generar la imagen.
 */
export default function ModalHistoriaSeleccion({ evento, tipo, onCerrar }) {
    const [resumen, setResumen] = useState(null)
    const [error, setError] = useState(null)
    const [ganadorId, setGanadorId] = useState(null)
    const [formato, setFormato] = useState('historia')

    useEffect(() => {
        getResumenSeleccion(evento.id)
            .then(r => {
                setResumen(r)
                setGanadorId(r.ganadores[0]?.participanteId ?? null)
            })
            .catch(e => setError(mensajeDeError(e, 'No se pudo cargar el resultado')))
    }, [evento.id])

    const imagen = IMAGENES[tipo]
    const ganador = resumen?.ganadores.find(g => g.participanteId === ganadorId)
    const datos = useMemo(() => {
        if (!resumen) return null
        const base = {
            localNombre: resumen.localNombre,
            visitanteNombre: resumen.visitanteNombre,
            puntosLocal: resumen.puntosLocal,
            puntosVisitante: resumen.puntosVisitante,
        }
        if (tipo === 'ganador') return ganador ? { ...base, ganador } : null
        if (tipo === 'ideal') return resumen.quintetoIdeal.length > 0 ? { ...base, jugadores: resumen.quintetoIdeal } : null
        return resumen.top10.length > 0 ? { ...base, top10: resumen.top10 } : null
    }, [resumen, tipo, ganador])

    const partido = `${evento.localSigla} vs ${evento.visitanteSigla}`
    const slug = `${evento.localSigla}-${evento.visitanteSigla}`.toLowerCase()
    const sinDatos = tipo === 'ideal' ? 'La planilla no tiene jugadores.' : 'No hay inscriptos en este partido.'

    return (
        <ModalImagenCompartible
            titulo={`${imagen.nombre} ${partido}`}
            cargando={!resumen && !error}
            mensajeSinDatos={error ?? sinDatos}
            datos={datos}
            dibujar={imagen[formato]}
            nombreArchivo={`${imagen.archivo}-relampago-${slug}-${formato}.png`}
            contentType={`${formato}_${imagen.archivo.replace('-', '_')}_relampago`}
            altImagen={`${imagen.nombre} del Relámpago ${partido}`}
            onCerrar={onCerrar}
        >
            <div className="flex gap-2">
                {[
                    { key: 'historia', label: tipo === 'tabla' ? 'Historia · top 10' : 'Historia' },
                    { key: 'post', label: tipo === 'tabla' ? 'Post · top 5' : 'Post' },
                ].map(f => (
                    <button
                        key={f.key}
                        onClick={() => setFormato(f.key)}
                        className={clsx(
                            'flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                            f.key === formato ? 'bg-primary border-primary text-white' : 'border-border text-textMuted hover:text-textMain'
                        )}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {tipo === 'ganador' && resumen?.ganadores.length > 1 && (
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
