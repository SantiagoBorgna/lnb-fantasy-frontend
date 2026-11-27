// Historias (1080x1920) del resultado del Relámpago Selección: el quinteto del ganador y el
// quinteto ideal del partido. Usan el fondo de las historias de Instagram (con el logo y
// "SEXTO HOMBRE FANTASY" abajo) y la misma canchita que las placas de la liga.
import { BLANCO, fuente, cargarImagen } from './canvasUtils'
import { cancha, texto, puntos, dibujarGanadorJornada, dibujarQuintetoIdeal } from './quintetoCanvas'
import { tarjetas, dibujarTop5Libre } from './top5Canvas'

const ANCHO = 1080
const ALTO = 1920
const CELESTE = '#75AADB'
const AZUL_OSCURO = '#0E1828'
const GRIS_AZUL = '#A9BCD0'
// Misma proporción que la cancha del post, entre la zona de arriba de Instagram y el logo del fondo
const CANCHA = { x: 189, y: 670, w: 703, h: 878 }

async function fondo(canvas) {
    canvas.width = ANCHO
    canvas.height = ALTO
    const ctx = canvas.getContext('2d')
    const img = await cargarImagen('/historias/fondo-seleccion.png')
    if (img) {
        ctx.drawImage(img, 0, 0, ANCHO, ALTO)
    } else {
        const g = ctx.createLinearGradient(0, 0, ANCHO * 0.6, ALTO)
        g.addColorStop(0, AZUL_OSCURO)
        g.addColorStop(1, '#1C3C6E')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, ANCHO, ALTO)
    }
    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    return ctx
}

// Etiqueta celeste "⚡ RELÁMPAGO SELECCIÓN" centrada, como en las historias de lanzamiento
function etiqueta(ctx, y) {
    const t = 'RELÁMPAGO SELECCIÓN'
    ctx.font = fuente(30, 900)
    ctx.letterSpacing = '4px'
    const anchoTexto = ctx.measureText(t).width
    const rayo = 30, separacion = 12, padX = 30, alto = 64
    const ancho = padX * 2 + rayo + separacion + anchoTexto
    const x = (ANCHO - ancho) / 2

    ctx.fillStyle = CELESTE
    ctx.beginPath()
    ctx.roundRect(x, y, ancho, alto, alto / 2)
    ctx.fill()

    // Rayo (mismo trazo que el ícono de la app), escalado a 30px
    ctx.save()
    ctx.translate(x + padX, y + (alto - rayo) / 2)
    ctx.scale(rayo / 24, rayo / 24)
    ctx.fillStyle = AZUL_OSCURO
    ctx.fill(new Path2D('M13 2 4 14h6l-1 8 9-12h-6l1-8z'))
    ctx.restore()

    ctx.fillStyle = AZUL_OSCURO
    ctx.textAlign = 'left'
    ctx.fillText(t, x + padX + rayo + separacion, y + alto / 2 + 11)
    ctx.textAlign = 'center'
    ctx.letterSpacing = '0px'
}

// "ARGENTINA 85 - 70 BAHAMAS" (o sin resultado si no está cargado)
function cruce(d) {
    const local = (d.localNombre || '').toUpperCase()
    const visitante = (d.visitanteNombre || '').toUpperCase()
    return d.puntosLocal != null ? `${local} ${d.puntosLocal} - ${d.puntosVisitante} ${visitante}` : `${local} VS ${visitante}`
}

/** d: { localNombre, visitanteNombre, puntosLocal, puntosVisitante, ganador: { nombre, apellido, puntosTotales, jugadores } } */
export async function dibujarGanadorRelampago(canvas, d) {
    const ctx = await fondo(canvas)
    etiqueta(ctx, 270)
    texto(ctx, 'GANADOR', ANCHO / 2, 410, 44, GRIS_AZUL, { espaciado: 8 })
    texto(ctx, `${d.ganador.nombre} ${d.ganador.apellido}`.toUpperCase(), ANCHO / 2, 500, 84, BLANCO, { sombra: true, anchoMax: ANCHO - 120 })
    texto(ctx, `PUNTAJE TOTAL: ${puntos(d.ganador.puntosTotales)}`, ANCHO / 2, 568, 40, BLANCO)
    texto(ctx, cruce(d), ANCHO / 2, 626, 32, GRIS_AZUL)
    await cancha(ctx, d.ganador.jugadores, CANCHA)
}

/** d: { localNombre, visitanteNombre, puntosLocal, puntosVisitante, jugadores } */
export async function dibujarQuintetoIdealRelampago(canvas, d) {
    const ctx = await fondo(canvas)
    etiqueta(ctx, 270)
    texto(ctx, 'QUINTETO IDEAL', ANCHO / 2, 470, 96, BLANCO, { sombra: true })
    texto(ctx, cruce(d), ANCHO / 2, 570, 38, GRIS_AZUL)
    await cancha(ctx, d.jugadores, CANCHA)
}

/** d: { ..., top10: [{ posicion, nombre, apellido, puntosTotales }] } — tabla final en historia */
export async function dibujarTablaRelampago(canvas, d) {
    const ctx = await fondo(canvas)
    etiqueta(ctx, 270)
    texto(ctx, 'TOP 10', ANCHO / 2, 450, 96, BLANCO, { sombra: true })
    texto(ctx, cruce(d), ANCHO / 2, 530, 38, GRIS_AZUL)
    // Diez tarjetas entre el subtítulo y el logo del fondo
    tarjetas(ctx, filasTabla(d.top10), { altoTarjeta: 86, paso: 97, arriba: 590, radioMedalla: 32, radioTarjeta: 30 })
}

const filasTabla = (top) => top.map(f => ({ posicion: f.posicion, nombreEquipo: `${f.nombre} ${f.apellido}`, puntos: f.puntosTotales }))

// ── Posts 4:5 (1080x1350): las mismas placas que el juego base, sin logo de liga ─────────────

export function dibujarGanadorRelampagoPost(canvas, d) {
    return dibujarGanadorJornada(canvas, {
        nombreEquipo: `${d.ganador.nombre} ${d.ganador.apellido}`,
        subtitulo: `GANADOR RELÁMPAGO · ${cruce(d)}`,
        puntaje: d.ganador.puntosTotales,
        jugadores: d.ganador.jugadores,
    }, null, null)
}

export function dibujarQuintetoIdealRelampagoPost(canvas, d) {
    return dibujarQuintetoIdeal(canvas, { subtitulo: `RELÁMPAGO · ${cruce(d)}`, jugadores: d.jugadores }, null, null)
}

export function dibujarTablaRelampagoPost(canvas, d) {
    return dibujarTop5Libre(canvas, { titulo: 'LOS 5 MEJORES', subtitulo: `RELÁMPAGO · ${cruce(d)}`, filas: filasTabla(d.top10.slice(0, 5)) }, null, null)
}
