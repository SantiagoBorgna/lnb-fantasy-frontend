// Dibuja la tarjeta "Mi jornada" en formato historia (1080x1920) para compartir
// en WhatsApp / Instagram. Separado del modal para poder probarlo solo.

export const ANCHO = 1080
export const ALTO = 1920

const AZUL_LOGO = '#132442'
const FONDO = '#0F1923'
const NARANJA = '#F5862E'
const BLANCO = '#FFFFFF'
const GRIS = '#A9BCD0'
const CARD = 'rgba(255,255,255,0.07)'
const BORDE = 'rgba(255,255,255,0.14)'

const fuente = (size, weight = 700) => `${weight} ${size}px Inter, system-ui, sans-serif`

const esHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)

const hexARgba = (hex, alpha) => {
    const n = parseInt(hex.slice(1), 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const formatoPuntos = (n) =>
    Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

// Achica la fuente hasta que el texto entre en el ancho disponible (sin bajar de minSize);
// si igual no entra, lo corta con "…"
function textoAjustado(ctx, texto, x, y, anchoMax, size, weight = 700, minSize = size * 0.6) {
    let s = size
    ctx.font = fuente(s, weight)
    while (ctx.measureText(texto).width > anchoMax && s > minSize) {
        s -= 2
        ctx.font = fuente(s, weight)
    }
    let t = texto
    while (ctx.measureText(t).width > anchoMax && t.length > 1) {
        t = t.slice(0, -2) + '…'
    }
    ctx.fillText(t, x, y)
}

function caja(ctx, x, y, w, h, r = 36) {
    ctx.fillStyle = CARD
    ctx.strokeStyle = BORDE
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fill()
    ctx.stroke()
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {object} d datos: jornadaNumero, nombreEquipo, puntajeFecha, posicionFecha,
 *   totalParticipantesFecha, posicionGlobal, colorClub, mvp {nombre, puntos}, capitan {nombre, puntos}
 * @param {HTMLImageElement} logo
 */
export function dibujarTarjetaJornada(canvas, d, logo) {
    canvas.width = ANCHO
    canvas.height = ALTO
    const ctx = canvas.getContext('2d')
    const cx = ANCHO / 2

    // ── Fondo ──
    const fondo = ctx.createLinearGradient(0, 0, 0, ALTO)
    fondo.addColorStop(0, AZUL_LOGO)
    fondo.addColorStop(1, FONDO)
    ctx.fillStyle = fondo
    ctx.fillRect(0, 0, ANCHO, ALTO)

    // Brillo con el color del club favorito
    const acento = esHex(d.colorClub) ? d.colorClub : '#2E5CA0'
    const brillo = ctx.createRadialGradient(ANCHO, 0, 0, ANCHO, 0, 1100)
    brillo.addColorStop(0, hexARgba(acento, 0.45))
    brillo.addColorStop(1, hexARgba(acento, 0))
    ctx.fillStyle = brillo
    ctx.fillRect(0, 0, ANCHO, ALTO)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'

    // ── Logo y marca ──
    const L = 190
    if (logo) {
        ctx.save()
        ctx.beginPath()
        ctx.roundRect(cx - L / 2, 120, L, L, 44)
        ctx.clip()
        ctx.drawImage(logo, cx - L / 2, 120, L, L)
        ctx.restore()
    }
    ctx.fillStyle = GRIS
    ctx.font = fuente(34)
    ctx.letterSpacing = '8px'
    ctx.fillText('SEXTO HOMBRE FANTASY', cx, 380)
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
    const hCajas = 250
    const anchoCaja = (ANCHO - 160 - 40) / 2
    const cajas = [
        {
            label: 'EN LA FECHA',
            valor: d.posicionFecha ? `#${d.posicionFecha}` : '—',
            sub: d.totalParticipantesFecha ? `de ${d.totalParticipantesFecha}` : '',
        },
        {
            label: 'GENERAL',
            valor: d.posicionGlobal ? `#${d.posicionGlobal}` : '—',
            sub: 'en el ranking',
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
        textoAjustado(ctx, c.valor, centro, yCajas + 170, anchoCaja - 40, 104)
        ctx.fillStyle = GRIS
        ctx.font = fuente(32, 500)
        ctx.fillText(c.sub, centro, yCajas + 220)
    })

    // ── MVP y capitán ──
    const filas = [
        d.mvp && { label: 'MVP DE MI EQUIPO', ...d.mvp },
        d.capitan && { label: 'CAPITÁN', ...d.capitan },
    ].filter(Boolean)

    let y = 1380
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

    // ── Cierre ──
    ctx.textAlign = 'center'
    ctx.fillStyle = BLANCO
    ctx.font = fuente(54, 700)
    ctx.fillText('¿Te animás a ganarme?', cx, 1745)
    ctx.fillStyle = NARANJA
    ctx.font = fuente(42, 700)
    ctx.fillText('sextohombrefantasy.com.ar', cx, 1810)
    ctx.fillStyle = GRIS
    ctx.font = fuente(32, 500)
    ctx.fillText('Gratis · Premio todas las jornadas', cx, 1862)
}

export const cargarImagen = (src) =>
    new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null) // sin logo igual se puede dibujar
        img.src = src
    })

// Espera a que la fuente Inter esté lista: si no, el canvas dibuja con la de sistema
export const cargarFuentes = async () => {
    if (!document.fonts?.load) return
    try {
        await Promise.all([
            document.fonts.load(fuente(40, 700)),
            document.fonts.load(fuente(40, 600)),
            document.fonts.load(fuente(40, 500)),
        ])
    } catch {
        // seguimos con la fuente que haya
    }
}
