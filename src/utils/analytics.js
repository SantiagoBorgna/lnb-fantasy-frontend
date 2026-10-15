// Google Analytics 4: carga y eventos.
// Solo se activa si existe VITE_GA_MEASUREMENT_ID (en Vercel está solo para producción,
// así las pruebas de staging no se mezclan con los datos reales).

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID

export const iniciarAnalytics = () => {
    if (!GA_ID || typeof window === 'undefined' || window.gtag) return

    window.dataLayer = window.dataLayer || []
    window.gtag = function gtag() { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', GA_ID)

    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`
    document.head.appendChild(script)
}

/**
 * Registra un evento en GA. Sin GA configurado no hace nada (en desarrollo lo muestra en consola).
 * Nunca debe romper la app: cualquier error se ignora.
 */
export const track = (evento, params = {}) => {
    try {
        if (window.gtag) {
            window.gtag('event', evento, params)
        } else if (import.meta.env.DEV) {
            console.debug('[analytics]', evento, params)
        }
    } catch {
        // la medición nunca bloquea al usuario
    }
}
