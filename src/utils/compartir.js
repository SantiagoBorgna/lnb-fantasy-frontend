// Utilidades para compartir por WhatsApp / menú nativo del celular
import { ligaActual } from '../store/ligaStore'

// Link que abre WhatsApp (app en el celular, web en la compu) con el texto ya escrito
export const linkWhatsApp = (texto) => `https://wa.me/?text=${encodeURIComponent(texto)}`

const URL_SITIO = 'https://www.sextohombrefantasy.com.ar/'

// Agrega parámetros UTM para que GA sepa de dónde vino la visita
export const conUtm = (url, { source, medium, campaign }) => {
    try {
        const u = new URL(url)
        u.searchParams.set('utm_source', source)
        u.searchParams.set('utm_medium', medium)
        if (campaign) u.searchParams.set('utm_campaign', campaign)
        return u.toString()
    } catch {
        return url
    }
}

// Link de invitación a una liga. source: 'whatsapp' (botón) o 'link' (copiado a mano)
export const linkInvitacion = (torneo, source) =>
    conUtm(torneo.urlInvitacion ?? '', { source, medium: 'invitacion', campaign: 'liga' })

// Link al sitio para las imágenes que se comparten (tarjeta de jornada, canchita).
// Lleva la liga para que quien lo abra caiga en la misma liga
export const linkSitioCompartido = (contenido) =>
    conUtm(`${URL_SITIO}?liga=${ligaActual().id}`, { source: 'compartir', medium: contenido })

// Celular/tablet (los iPad nuevos se presentan como Mac con pantalla táctil)
const esCelular = () => typeof navigator !== 'undefined' && (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
)

// En la PC va sin emojis: la app de WhatsApp para Windows los rompe (muestra �) al recibirlos por link
export const mensajeInvitacionTorneo = (torneo) => esCelular()
    ? `Sumate a mi liga "${torneo.nombre}" en Sexto Hombre Fantasy, el fantasy de la ${ligaActual().nombre} 🏀 Es gratis 👇\n${linkInvitacion(torneo, 'whatsapp')}`
    : `Sumate a mi liga "${torneo.nombre}" en Sexto Hombre Fantasy, el fantasy de la ${ligaActual().nombre}. Es gratis:\n${linkInvitacion(torneo, 'whatsapp')}`

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
