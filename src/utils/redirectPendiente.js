// URL a la que hay que volver después del login/onboarding
// (ej. el link de invitación a un torneo que abrió alguien sin sesión).

const KEY = 'redirectUrl'

// Solo rutas internas: evita redirigir a otro dominio con "//otro.com" o "https://..."
const esRutaInterna = (url) => typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')

export const guardarRedirectPendiente = (url) => {
    if (esRutaInterna(url)) localStorage.setItem(KEY, url)
}

export const verRedirectPendiente = () => {
    const url = localStorage.getItem(KEY)
    return esRutaInterna(url) ? url : null
}

// Devuelve la URL pendiente (o null) y la borra
export const consumirRedirectPendiente = () => {
    const url = verRedirectPendiente()
    localStorage.removeItem(KEY)
    return url
}
