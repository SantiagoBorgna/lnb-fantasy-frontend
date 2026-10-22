import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { Download, Loader2 } from 'lucide-react'

/** QR del link de inscripción a un Relámpago, para proyectar en el estadio o descargar como PNG. */
export default function ModalQrShowdown({ link, titulo, onCerrar }) {
    const [imagen, setImagen] = useState(null)

    useEffect(() => {
        // 1024px con margen blanco: se lee bien impreso o en pantalla grande
        QRCode.toDataURL(link, { width: 1024, margin: 2, errorCorrectionLevel: 'M' })
            .then(setImagen)
            .catch(() => setImagen(null))
    }, [link])

    const nombreArchivo = `qr-relampago-${titulo.replace(/\s+/g, '-').toLowerCase()}.png`

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/70 z-40" onClick={onCerrar} />
            <div className="fixed top-1/2 -translate-y-1/2 left-0 right-0 max-w-sm mx-auto bg-card border border-border rounded-3xl z-50 p-6 space-y-4 text-center" onClick={e => e.stopPropagation()}>
                <h3 className="text-textMain font-bold text-lg">{titulo}</h3>
                <div className="bg-white rounded-2xl p-3 aspect-square flex items-center justify-center">
                    {imagen
                        ? <img src={imagen} alt={`QR de ${titulo}`} className="w-full h-full" />
                        : <Loader2 className="w-8 h-8 animate-spin text-slate-400" />}
                </div>
                <p className="text-textMuted text-xs break-all">{link}</p>
                <a
                    href={imagen ?? undefined}
                    download={nombreArchivo}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white font-semibold text-sm aria-disabled:opacity-50"
                    aria-disabled={!imagen}
                >
                    <Download className="w-4 h-4" /> Descargar PNG
                </a>
                <button onClick={onCerrar} className="w-full py-2 text-textMuted text-sm font-medium">Cerrar</button>
            </div>
        </>,
        document.body
    )
}
