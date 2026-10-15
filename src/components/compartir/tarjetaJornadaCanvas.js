// Dibuja la tarjeta "Mi jornada" en formato historia (1080x1920) para compartir
// en WhatsApp / Instagram. Separado del modal para poder probarlo solo.
import {
    ANCHO, NARANJA, BLANCO, GRIS, fuente, formatoPuntos, textoAjustado, caja,
    iniciarLienzo, dibujarLogo, dibujarPie,
} from './canvasUtils'

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} d datos: jornadaNumero, nombreEquipo, puntajeFecha, posicionFecha,
 *   totalParticipantesFecha, posicionGlobal, colorClub, mvp {nombre, puntos}, capitan {nombre, puntos}
 * @param {HTMLImageElement} logo
 */
export function dibujarTarjetaJornada(canvas, d, logo) {
    // Fondo con brillo del color del club favorito
    const ctx = iniciarLienzo(canvas, d.colorClub)
    const cx = ANCHO / 2

    // ── Logo y marca ──
    const L = 260
    dibujarLogo(ctx, logo, cx - L / 2, 90, L, 60)
    ctx.fillStyle = GRIS
    ctx.font = fuente(34)
    ctx.letterSpacing = '8px'
    ctx.fillText('SEXTO HOMBRE FANTASY', cx, 420)
    ctx.letterSpacing = '0px'

    // ── Jornada y equipo ──
    ctx.fillStyle = NARANJA
    ctx.font = fuente(64)
    ctx.fillText(`JORNADA ${d.jornadaNumero ?? ''}`.trim(), cx, 540)

    ctx.fillStyle = BLANCO
    textoAjustado(ctx, d.nombreEquipo || 'Mi equipo', cx, 640, ANCHO - 160, 76, 700, 56)

    // ── Puntos ──
    ctx.fillStyle = BLANCO
    textoAjustado(ctx, formatoPuntos(d.puntajeFecha), cx, 900, ANCHO - 160, 280)
    ctx.fillStyle = GRIS
    ctx.font = fuente(46, 600)
    ctx.fillText('PUNTOS', cx, 1020)

    // ── Puestos ──
    const yCajas = 1080
    const hCajas = 210
    const anchoCaja = (ANCHO - 160 - 40) / 2
    const cajas = [
        {
            label: 'EN LA FECHA',
            valor: d.posicionFecha ? `#${d.posicionFecha}` : '—',
        },
        {
            label: 'GENERAL',
            valor: d.posicionGlobal ? `#${d.posicionGlobal}` : '—',
        },
    ]
    cajas.forEach((c, i) => {
        const x = 80 + i * (anchoCaja + 40)
        caja(ctx, x, yCajas, anchoCaja, hCajas)
        const centro = x + anchoCaja / 2
        ctx.fillStyle = GRIS
        ctx.font = fuente(32, 600)
        ctx.fillText(c.label, centro, yCajas + 66)
        ctx.fillStyle = BLANCO
        textoAjustado(ctx, c.valor, centro, yCajas + 172, anchoCaja - 40, 104)
    })

    // ── MVP y capitán ──
    const filas = [
        d.mvp && { label: d.mvpEsCapitan ? 'MVP Y CAPITÁN' : 'MVP DE MI EQUIPO', ...d.mvp },
        d.capitan && { label: 'CAPITÁN', ...d.capitan },
    ].filter(Boolean)

    let y = 1340
    filas.forEach(f => {
        caja(ctx, 80, y, ANCHO - 160, 130, 32)
        ctx.textAlign = 'left'
        ctx.fillStyle = NARANJA
        ctx.font = fuente(28, 700)
        ctx.fillText(f.label, 124, y + 50)
        ctx.fillStyle = BLANCO
        textoAjustado(ctx, f.nombre, 124, y + 102, ANCHO - 160 - 300, 44, 700, 36)
        ctx.textAlign = 'right'
        ctx.fillStyle = BLANCO
        ctx.font = fuente(56, 700)
        ctx.fillText(formatoPuntos(f.puntos), ANCHO - 124, y + 70)
        ctx.fillStyle = GRIS
        ctx.font = fuente(26, 600)
        ctx.fillText('PTS', ANCHO - 124, y + 112)
        ctx.textAlign = 'center'
        y += 160
    })

    dibujarPie(ctx)
}
