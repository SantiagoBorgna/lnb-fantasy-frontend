// Escudos de los equipos, guardados en public/escudos/<liga>/<nombre del equipo sin tildes ni símbolos>.png
// (256 px, para las placas) y en .../mini/ (96 px, para mostrarlos chicos en la app).
const slug = (nombre = '') =>
    nombre.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export const archivoEscudo = (ligaId, nombre) => `/escudos/${ligaId}/${slug(nombre)}.png`
export const archivoEscudoMini = (ligaId, nombre) => `/escudos/${ligaId}/mini/${slug(nombre)}.png`
