// Utilidades para compartir por WhatsApp / menú nativo del celular

// Link que abre WhatsApp (app en el celular, web en la compu) con el texto ya escrito
export const linkWhatsApp = (texto) => `https://wa.me/?text=${encodeURIComponent(texto)}`

export const mensajeInvitacionTorneo = (torneo) =>
    `Sumate a mi liga "${torneo.nombre}" en Sexto Hombre Fantasy, el fantasy de la Liga Nacional 🏀 Es gratis 👇\n${torneo.urlInvitacion}`

// ¿El navegador puede compartir archivos con el menú nativo? (Android/iOS sí, la mayoría de las compus no)
export const puedeCompartirArchivos = (archivo) =>
    typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [archivo] })

/**
 * Comparte una imagen con el menú nativo del celular (WhatsApp, Instagram, etc.).
 * Si no se puede, la descarga.
 * @returns {'compartido'|'cancelado'|'descargado'}
 */
export const compartirImagen = async ({ blob, nombreArchivo, texto }) => {
    const archivo = new File([blob], nombreArchivo, { type: 'image/png' })

    if (puedeCompartirArchivos(archivo)) {
        try {
            await navigator.share({ files: [archivo], text: texto })
            return 'compartido'
        } catch (e) {
            // El usuario cerró el menú: no es un error
            if (e?.name === 'AbortError') return 'cancelado'
        }
    }

    descargarBlob(blob, nombreArchivo)
    return 'descargado'
}

export const descargarBlob = (blob, nombreArchivo) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
}
