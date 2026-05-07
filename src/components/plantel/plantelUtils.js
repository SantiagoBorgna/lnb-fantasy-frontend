export const ROL_CONFIG = {
    CAPITAN: { label: 'CAP', badge: 'bg-yellow-500', mult: '×1.5' },
    TITULAR: { label: 'TIT', badge: 'bg-primary', mult: '×1.0' },
    SEXTO_HOMBRE: { label: '6TO', badge: 'bg-accent', mult: '×0.75' },
    SUPLENTE: { label: 'SUP', badge: 'bg-border', mult: '×0.5' },
}

export const esTitular = (rol) => rol === 'CAPITAN' || rol === 'TITULAR'
export const esBanco = (rol) => rol === 'SEXTO_HOMBRE' || rol === 'SUPLENTE'

// Posiciones compatibles por zona de la cancha
// Guard = BASE, ESCOLTA — pueden ocupar slots de guardia
// Forward = ALERO, ALA_PIVOT — pueden ocupar slots de alero
// Center = PIVOT — solo slots de pivot
export const ZONA_POSICIONES = {
    GUARD: ['BASE', 'ESCOLTA'],
    FORWARD: ['ALERO', 'ALA_PIVOT'],
    CENTER: ['PIVOT'],
}

// Dado el número de guards/forwards/centers de una formación,
// devuelve el array de zonas en orden visual (top → bottom)
// Ejemplo: "2-1-2" → ['GUARD','GUARD','FORWARD','CENTER','CENTER']
export const zonasDeFormacion = (formacion) => {
    if (!formacion) return []
    const [g, f, c] = formacion.split('-').map(Number)
    return [
        ...Array(g).fill('GUARD'),
        ...Array(f).fill('FORWARD'),
        ...Array(c).fill('CENTER'),
    ]
}

// Devuelve true si la posición del jugador es compatible con la zona del slot
export const esCompatible = (posicionJugador, zonaSlot) => {
    return ZONA_POSICIONES[zonaSlot]?.includes(posicionJugador) ?? false
}