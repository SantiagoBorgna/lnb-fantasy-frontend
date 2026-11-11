// Top 5 de una jornada para Instagram (post 4:5, 1080x1350), con el mismo fondo que el fixture:
// título + logo de la liga, "JORNADA N" y cinco tarjetas con el puesto, el equipo y los puntos.
import { BLANCO, fuente, textoAjustado } from './canvasUtils'
import { ANCHO_POST, ALTO_POST } from './quintetoCanvas'

const GRIS_AZUL = '#8EA3C0'
const TARJETA = '#1E2A3B'
const NEGRO = '#111111'

export const formatoPuntosTop5 = (n) => `${Number(n ?? 0).toFixed(1)} pts`

// Medalla del puesto: oro, plata y bronce con número blanco; el resto, blanca con número negro
function medalla(ctx, posicion, cx, cy, r) {
    let relleno = BLANCO, colorNumero = NEGRO
    if (posicion === 1) {
        relleno = '#F9DC5C'; colorNumero = BLANCO
    } else if (posicion === 2) {
        const g = ctx.createLinearGradient(0, cy - r, 0, cy + r)
        g.addColorStop(0, '#E9EBEE')
        g.addColorStop(1, '#9CA1A9')
        relleno = g; colorNumero = BLANCO
    } else if (posicion === 3) {
        relleno = '#DF9658'; colorNumero = BLANCO
    }
    ctx.fillStyle = relleno
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = colorNumero
    ctx.font = fuente(44, 700)
    ctx.textAlign = 'center'
    ctx.fillText(String(posicion), cx, cy + 16)
}

/** d: { jornadaNumero, filas: [{ posicion, nombreEquipo, puntos }] } */
export async function dibujarTop5(canvas, d, _logo, logoLiga) {
    canvas.width = ANCHO_POST
    canvas.height = ALTO_POST
    const ctx = canvas.getContext('2d')
    const g = ctx.createLinearGradient(0, 0, ANCHO_POST * 0.6, ALTO_POST)
    g.addColorStop(0, '#0E1828')
    g.addColorStop(1, '#1C3C6E')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, ANCHO_POST, ALTO_POST)
    ctx.textBaseline = 'alphabetic'

    // Título + logo de la liga, centrados como un bloque
    const titulo = 'LOS 5 MEJORES'
    ctx.font = fuente(76, 800)
    const anchoTitulo = ctx.measureText(titulo).width
    const altoLogo = 92, separacion = 32
    const anchoLogo = logoLiga ? logoLiga.width * altoLogo / logoLiga.height : 0
    const anchoBloque = anchoTitulo + (logoLiga ? separacion + anchoLogo : 0)
    const x0 = (ANCHO_POST - anchoBloque) / 2
    ctx.fillStyle = BLANCO
    ctx.textAlign = 'left'
    ctx.fillText(titulo, x0, 158)
    if (logoLiga) ctx.drawImage(logoLiga, x0 + anchoTitulo + separacion, 70, anchoLogo, altoLogo)

    ctx.fillStyle = GRIS_AZUL
    ctx.font = fuente(42, 700)
    ctx.textAlign = 'center'
    ctx.fillText(`JORNADA ${d.jornadaNumero}`, ANCHO_POST / 2, 258)

    // Tarjetas
    const izquierda = 108, derecha = ANCHO_POST - 108
    const altoTarjeta = 158, paso = 181.5, arriba = 310
    d.filas.forEach((fila, i) => {
        const y = arriba + i * paso
        const cy = y + altoTarjeta / 2
        ctx.fillStyle = TARJETA
        ctx.beginPath()
        ctx.roundRect(izquierda, y, derecha - izquierda, altoTarjeta, 48)
        ctx.fill()

        medalla(ctx, fila.posicion, 194, cy, 46)

        const puntos = formatoPuntosTop5(fila.puntos)
        ctx.fillStyle = BLANCO
        ctx.font = fuente(36, 700)
        ctx.textAlign = 'right'
        const xPuntos = derecha - 44
        ctx.fillText(puntos, xPuntos, cy + 13)
        const anchoPuntos = ctx.measureText(puntos).width

        const xNombre = 308
        ctx.textAlign = 'left'
        textoAjustado(ctx, (fila.nombreEquipo || '').toUpperCase(), xNombre, cy + 13,
            xPuntos - anchoPuntos - 36 - xNombre, 36, 700, 26)
    })

    ctx.fillStyle = GRIS_AZUL
    ctx.font = fuente(20, 800)
    ctx.letterSpacing = '8px'
    ctx.textAlign = 'center'
    ctx.fillText('SEXTO HOMBRE FANTASY', ANCHO_POST / 2, 1268)
    ctx.letterSpacing = '0px'
}
