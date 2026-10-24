// Imágenes de cierre de jornada para Instagram (post 4:5, 1080x1350): el equipo ganador
// y el quinteto ideal, con el mismo estilo de las placas que se hacían a mano.
import { BLANCO, fuente } from './canvasUtils'
import { dibujarCancha, imagenCamiseta } from './canchitaCanvas'
import { determinarColorNumero } from '../jugador/camisetaUtils'

export const ANCHO_POST = 1080
export const ALTO_POST = 1350

const CANCHA = { x: 200, y: 325, w: 703, h: 878 }
const GRIS_AZUL = '#8EA3C0'
const OSCURO = '#1F2937'
const AMARILLO = '#FDE047'

// Filas de la cancha según la posición (igual que la formación del juego):
// bases/escoltas arriba, aleros/ala pívots al medio, pívots abajo
const FILA_DE = { BASE: 0, ESCOLTA: 0, ALERO: 1, ALA_PIVOT: 1, PIVOT: 2 }
const ALTURA_FILA = [0.217, 0.51, 0.8]

// "VAZQUEZ, FEDERICO" → "VAZQUEZ, F."
export function nombreCorto(nombreCompleto = '') {
    const [apellido, nombres = ''] = nombreCompleto.split(',').map(s => s.trim())
    const inicial = nombres.charAt(0)
    return inicial ? `${apellido}, ${inicial}.` : apellido
}

// 27 → "27", 79.5 → "79.5" (con punto, como en las placas)
const puntos = (n) => {
    const r = Math.round(Number(n ?? 0) * 10) / 10
    return Number.isInteger(r) ? String(r) : r.toFixed(1)
}

function fondo(canvas) {
    canvas.width = ANCHO_POST
    canvas.height = ALTO_POST
    const ctx = canvas.getContext('2d')
    const g = ctx.createLinearGradient(0, 0, ANCHO_POST * 0.6, ALTO_POST)
    g.addColorStop(0, '#0E1828')
    g.addColorStop(1, '#1C3C6E')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, ANCHO_POST, ALTO_POST)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    return ctx
}

function texto(ctx, t, x, y, size, color, { sombra = false, anchoMax = ANCHO_POST - 120, espaciado = 0 } = {}) {
    let s = size
    ctx.font = fuente(s, 800)
    while (ctx.measureText(t).width > anchoMax && s > size * 0.5) ctx.font = fuente(--s, 800)
    ctx.save()
    if (sombra) {
        ctx.shadowColor = 'rgba(0,0,0,0.55)'
        ctx.shadowBlur = 10
        ctx.shadowOffsetY = 4
    }
    ctx.letterSpacing = `${espaciado}px`
    ctx.fillStyle = color
    ctx.fillText(t, x, y)
    ctx.restore()
}

async function tarjetaJugador(ctx, j, cx, cy) {
    const w = 210, h = 224
    const x = cx - w / 2, y = cy - h / 2

    ctx.fillStyle = 'rgba(255,255,255,0.38)'
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 30)
    ctx.fill()

    const img = await imagenCamiseta({ colorPrincipal: j.colorPrincipal, colorSecundario: j.colorSecundario, modelo: j.modeloCamiseta })
    if (img) ctx.drawImage(img, cx - 52, y + 14, 104, 125)

    // Número (mismo criterio de color que la camiseta de la app)
    const numero = j.numeroCamiseta ? String(j.numeroCamiseta) : ''
    if (numero) {
        const colorNumero = determinarColorNumero(j.colorPrincipal, j.colorSecundario)
        ctx.font = fuente(numero.length > 1 ? 34 : 40, 800)
        ctx.textAlign = 'center'
        ctx.lineWidth = 3
        ctx.strokeStyle = colorNumero === '#FFFFFF' ? '#000000' : '#FFFFFF'
        ctx.strokeText(numero, cx, y + 110)
        ctx.fillStyle = colorNumero
        ctx.fillText(numero, cx, y + 110)
    }

    texto(ctx, nombreCorto(j.nombre), cx, y + 172, 25, BLANCO, { sombra: true, anchoMax: w - 16 })
    texto(ctx, `${puntos(j.puntosFantasy)} pts`, cx, y + 205, 25, OSCURO, { anchoMax: w - 16 })

    if (j.esCapitan) {
        const bx = x + w - 11, by = y + 17
        ctx.fillStyle = AMARILLO
        ctx.strokeStyle = OSCURO
        ctx.lineWidth = 4
        ctx.beginPath()
        ctx.arc(bx, by, 30, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = OSCURO
        ctx.font = fuente(30, 800)
        ctx.textAlign = 'center'
        ctx.fillText('C', bx, by + 11)
    }
}

async function cancha(ctx, jugadores) {
    dibujarCancha(ctx, CANCHA)
    const filas = [[], [], []]
    for (const j of jugadores) filas[FILA_DE[j.posicion] ?? 1].push(j)

    const cx = CANCHA.x + CANCHA.w / 2
    for (let f = 0; f < 3; f++) {
        const fila = filas[f]
        const paso = fila.length > 2 ? 226 : 292
        const cy = CANCHA.y + CANCHA.h * ALTURA_FILA[f]
        for (let k = 0; k < fila.length; k++) {
            await tarjetaJugador(ctx, fila[k], cx + (k - (fila.length - 1) / 2) * paso, cy)
        }
    }
}

function pie(ctx) {
    texto(ctx, 'SEXTO HOMBRE FANTASY', ANCHO_POST / 2, 1262, 19, GRIS_AZUL, { espaciado: 6 })
}

// Título con el logo de la liga a la derecha, todo centrado. El logo apoya en la base del
// texto (la pelota sobresale arriba). Si el título es largo, la letra se achica para que entre.
function tituloConLogo(ctx, titulo, size, base, logoLiga, altoLogo) {
    const anchoLogo = logoLiga ? logoLiga.width * altoLogo / logoLiga.height : 0
    const separacion = logoLiga ? 22 : 0
    const anchoMax = ANCHO_POST - 120 - anchoLogo - separacion
    let s = size
    ctx.font = fuente(s, 800)
    while (ctx.measureText(titulo).width > anchoMax && s > size * 0.5) ctx.font = fuente(--s, 800)
    const anchoTitulo = ctx.measureText(titulo).width
    const inicio = (ANCHO_POST - anchoTitulo - separacion - anchoLogo) / 2

    ctx.textAlign = 'left'
    texto(ctx, titulo, inicio, base, s, BLANCO, { sombra: true, anchoMax })
    if (logoLiga) ctx.drawImage(logoLiga, inicio + anchoTitulo + separacion, base - altoLogo, anchoLogo, altoLogo)
    ctx.textAlign = 'center'
}

/** d: { nombreEquipo, jornadaNumero, puntaje, jugadores } — logoLiga va a la derecha del nombre */
export async function dibujarGanadorJornada(canvas, d, _logo, logoLiga) {
    const ctx = fondo(canvas)
    tituloConLogo(ctx, (d.nombreEquipo || '').toUpperCase(), 76, 125, logoLiga, 84)
    texto(ctx, `GANADOR JORNADA ${d.jornadaNumero}`, ANCHO_POST / 2, 205, 38, GRIS_AZUL)
    texto(ctx, `PUNTAJE TOTAL: ${puntos(d.puntaje)}`, ANCHO_POST / 2, 275, 36, BLANCO)
    await cancha(ctx, d.jugadores)
    pie(ctx)
}

/** d: { jornadaNumero, jugadores } — logoLiga va a la derecha del título */
export async function dibujarQuintetoIdeal(canvas, d, _logo, logoLiga) {
    const ctx = fondo(canvas)
    tituloConLogo(ctx, 'QUINTETO IDEAL', 84, 150, logoLiga, 96)
    texto(ctx, `JORNADA ${d.jornadaNumero}`, ANCHO_POST / 2, 260, 40, GRIS_AZUL)
    await cancha(ctx, d.jugadores)
    pie(ctx)
}
