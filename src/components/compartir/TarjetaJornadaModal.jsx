import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { Share2, Download } from 'lucide-react'
import { getMiResumenJornada } from '../../api/rankingApi'
import { getPlantelJornada, getEstadisticasJornada } from '../../api/plantelApi'
import { useUiStore } from '../../store/uiStore'
import { compartirImagen, puedeCompartirArchivos, descargarBlob, linkSitioCompartido } from '../../utils/compartir'
import { track } from '../../utils/analytics'
import { dibujarTarjetaJornada, cargarImagen, cargarFuentes } from './tarjetaJornadaCanvas'


// iPhone/iPad (los iPad nuevos se presentan como Mac con pantalla táctil)
const esIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
)

// Arma los datos de la tarjeta a partir de las 3 respuestas del backend
function armarDatos(resumen, plantel, estadisticas) {
    const puntosPorJugador = new Map(
        (estadisticas ?? [])
            .filter(e => e.puntajeFantasy != null)
            .map(e => [e.jugadorRealId, e.puntajeFantasy])
    )
    const jugadores = (plantel?.jugadores ?? []).map(j => ({
        nombre: j.nombreCompleto,
        rol: j.rol,
        puntos: puntosPorJugador.get(j.jugadorRealId),
    }))

    const conPuntos = jugadores.filter(j => j.puntos != null)
    const mvp = conPuntos.reduce((mejor, j) => (!mejor || j.puntos > mejor.puntos ? j : mejor), null)
    const capitan = jugadores.find(j => j.rol === 'CAPITAN')

    return {
        jornadaNumero: resumen.jornadaNumero,
        nombreEquipo: resumen.nombreEquipo ?? plantel?.nombreEquipo,
        puntajeFecha: resumen.puntajeFecha,
        posicionFecha: resumen.posicionFecha,
        totalParticipantesFecha: resumen.totalParticipantesFecha,
        posicionGlobal: resumen.posicionGlobal,
        colorClub: resumen.equipoFavoritoColor,
        mvp: mvp && { nombre: mvp.nombre, puntos: mvp.puntos },
        // Si el capitán fue el MVP va en una sola fila ("MVP Y CAPITÁN")
        mvpEsCapitan: !!mvp && mvp.nombre === capitan?.nombre,
        // El capitán siempre aparece: si no sumó (no jugó o sin estadísticas) va con 0
        capitan: capitan && capitan.nombre !== mvp?.nombre
            ? { nombre: capitan.nombre, puntos: capitan.puntos ?? 0 }
            : null,
    }
}

export default function TarjetaJornadaModal({ jornadaId, onCerrar }) {
    const showToast = useUiStore(state => state.showToast)
    const canvasRef = useRef(null)
    const [imagen, setImagen] = useState(null) // { blob, url }
    const [compartiendo, setCompartiendo] = useState(false)

    const { data: resumen, isLoading: cargandoResumen, isError } = useQuery({
        queryKey: ['miResumenJornada', jornadaId],
        queryFn: () => getMiResumenJornada(jornadaId),
    })
    const { data: plantel, isLoading: cargandoPlantel } = useQuery({
        queryKey: ['plantelJornada', jornadaId],
        queryFn: () => getPlantelJornada(jornadaId),
    })
    const { data: estadisticas, isLoading: cargandoStats } = useQuery({
        queryKey: ['estadisticasJornada', jornadaId],
        queryFn: () => getEstadisticasJornada(jornadaId),
    })

    const cargando = cargandoResumen || cargandoPlantel || cargandoStats

    useEffect(() => {
        if (cargando || !resumen || !canvasRef.current) return
        let cancelado = false
        let urlCreada = null

        ;(async () => {
            await cargarFuentes()
            const logo = await cargarImagen('/icons/logo-cuadrado.jpg')
            if (cancelado) return
            const canvas = canvasRef.current
            dibujarTarjetaJornada(canvas, armarDatos(resumen, plantel, estadisticas), logo)
            canvas.toBlob(blob => {
                if (cancelado || !blob) return
                urlCreada = URL.createObjectURL(blob)
                setImagen({ blob, url: urlCreada })
            }, 'image/png')
        })()

        return () => {
            cancelado = true
            if (urlCreada) URL.revokeObjectURL(urlCreada)
        }
    }, [cargando, resumen, plantel, estadisticas])

    const nombreArchivo = `sexto-hombre-jornada-${resumen?.jornadaNumero ?? ''}.png`
    const texto = resumen
        ? `Hice ${resumen.puntajeFecha?.toLocaleString('es-AR')} puntos en la jornada ${resumen.jornadaNumero} de Sexto Hombre Fantasy 🏀 ¿Te animás a ganarme? ${linkSitioCompartido('tarjeta_jornada')}`
        : ''

    const sePuedeCompartir = imagen && puedeCompartirArchivos(new File([imagen.blob], nombreArchivo, { type: 'image/png' }))

    const handleCompartir = async () => {
        if (!imagen) return
        setCompartiendo(true)
        try {
            const resultado = await compartirImagen({ blob: imagen.blob, nombreArchivo, texto })
            if (resultado !== 'cancelado') {
                track('share', { content_type: 'tarjeta_jornada', method: resultado === 'compartido' ? 'menu_nativo' : 'descarga' })
            }
            if (resultado === 'descargado') showToast('Imagen descargada. ¡Subila a tus historias!')
        } finally {
            setCompartiendo(false)
        }
    }

    const sinDatos = !cargando && (isError || !resumen)

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/70 z-40" onClick={onCerrar} />
            <div
                className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md mx-auto
                    bg-card border-t border-border rounded-t-3xl md:rounded-3xl z-50 p-5 space-y-4
                    max-h-[92vh] overflow-y-auto animate-slide-up md:animate-none"
                onClick={e => e.stopPropagation()}
            >
                <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />
                <h3 className="text-textMain font-bold text-lg">Compartí tu jornada</h3>

                {/* El canvas se dibuja oculto y se muestra la imagen resultante */}
                <canvas ref={canvasRef} className="hidden" />

                {cargando || (!sinDatos && !imagen) ? (
                    <div className="aspect-[9/16] max-h-[55vh] mx-auto rounded-2xl bg-surface border border-border flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : sinDatos ? (
                    <p className="text-textMuted text-sm py-6 text-center">
                        No encontramos tu equipo en esta jornada. Cuando juegues una fecha completa vas a poder compartir tu resultado.
                    </p>
                ) : (
                    <img
                        src={imagen.url}
                        alt={`Mi jornada ${resumen.jornadaNumero}`}
                        className="max-h-[55vh] mx-auto rounded-2xl border border-border shadow-xl"
                    />
                )}

                {imagen && (
                    <div className="space-y-2">
                        <button
                            onClick={handleCompartir}
                            disabled={compartiendo}
                            className="btn-accent w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {sePuedeCompartir ? <Share2 size={18} /> : <Download size={18} />}
                            {sePuedeCompartir ? 'Compartir' : 'Descargar'}
                        </button>
                        {/* En iPhone descargar abre una pantalla del PNG en vez de guardar la foto:
                            ahí se guarda desde "Compartir" → "Guardar imagen" */}
                        {sePuedeCompartir && !esIOS && (
                            <button
                                onClick={() => {
                                    descargarBlob(imagen.blob, nombreArchivo)
                                    track('share', { content_type: 'tarjeta_jornada', method: 'descarga' })
                                }}
                                className="w-full py-2 text-textMuted text-sm flex items-center justify-center gap-2"
                            >
                                <Download size={16} /> Descargar
                            </button>
                        )}
                    </div>
                )}

                <button onClick={onCerrar} className="w-full py-2 text-textMuted text-sm">
                    Cerrar
                </button>
            </div>
        </>,
        document.body
    )
}
