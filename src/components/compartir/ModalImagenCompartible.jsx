import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Share2, Download } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { compartirImagen, puedeCompartirArchivos, descargarBlob } from '../../utils/compartir'
import { track } from '../../utils/analytics'
import { cargarImagen, cargarFuentes } from './canvasUtils'
import { ligaActual } from '../../store/ligaStore'

// iPhone/iPad (los iPad nuevos se presentan como Mac con pantalla táctil)
const esIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
)

/**
 * Modal que genera una imagen en un canvas, la muestra y permite compartirla/descargarla.
 * Lo usan la tarjeta de la jornada y la canchita.
 *
 * - datos: lo que necesita `dibujar`; mientras sea null no se dibuja (cargando o sin datos).
 * - dibujar: async (canvas, datos, logo, logoLiga) => void
 * - contentType: para el evento `share` de GA (ej. 'tarjeta_jornada', 'canchita').
 */
export default function ModalImagenCompartible({
    titulo, cargando = false, mensajeSinDatos, datos, dibujar,
    nombreArchivo, texto, contentType, altImagen, onCerrar, children,
}) {
    const showToast = useUiStore(state => state.showToast)
    const canvasRef = useRef(null)
    const [imagen, setImagen] = useState(null) // { blob, url }
    const [compartiendo, setCompartiendo] = useState(false)

    useEffect(() => {
        if (cargando || !datos || !canvasRef.current) return
        let cancelado = false
        let urlCreada = null

        ;(async () => {
            await cargarFuentes()
            const [logo, logoLiga] = await Promise.all([
                cargarImagen('/icons/logo-cuadrado.jpg'),
                cargarImagen(ligaActual().logo),
            ])
            if (cancelado) return
            const canvas = canvasRef.current
            await dibujar(canvas, datos, logo, logoLiga)
            if (cancelado) return
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
    }, [cargando, datos, dibujar])

    const sePuedeCompartir = imagen && puedeCompartirArchivos(new File([imagen.blob], nombreArchivo, { type: 'image/png' }))

    const handleCompartir = async () => {
        if (!imagen) return
        setCompartiendo(true)
        try {
            const resultado = await compartirImagen({ blob: imagen.blob, nombreArchivo, texto })
            if (resultado !== 'cancelado') {
                track('share', { content_type: contentType, method: resultado === 'compartido' ? 'menu_nativo' : 'descarga' })
            }
            if (resultado === 'descargado') showToast('Imagen descargada. ¡Subila a tus historias!')
        } finally {
            setCompartiendo(false)
        }
    }

    const sinDatos = !cargando && !datos

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
                <h3 className="text-textMain font-bold text-lg">{titulo}</h3>
                {children}

                {/* El canvas se dibuja oculto y se muestra la imagen resultante */}
                <canvas ref={canvasRef} className="hidden" />

                {sinDatos ? (
                    <p className="text-textMuted text-sm py-6 text-center">{mensajeSinDatos}</p>
                ) : !imagen ? (
                    <div className="aspect-[9/16] max-h-[55vh] mx-auto rounded-2xl bg-surface border border-border flex items-center justify-center">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <img
                        src={imagen.url}
                        alt={altImagen}
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
                                    track('share', { content_type: contentType, method: 'descarga' })
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
