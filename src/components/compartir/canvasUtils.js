// Utilidades compartidas por las imágenes para compartir (tarjeta de jornada, canchita).
// Formato historia 1080x1920 con el estilo de la marca.

export const ANCHO = 1080
export const ALTO = 1920

export const AZUL_LOGO = '#132442'
export const FONDO = '#0F1923'
export const NARANJA = '#F5862E'
export const BLANCO = '#FFFFFF'
export const GRIS = '#A9BCD0'
export const CARD = 'rgba(255,255,255,0.07)'
export const BORDE = 'rgba(255,255,255,0.14)'

export const fuente = (size, weight = 700) => `${weight} ${size}px Inter, system-ui, sans-serif`

export const esHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)

export const hexARgba = (hex, alpha) => {
    const n = parseInt(hex.slice(1), 16)
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export const formatoPuntos = (n) =>
    Number(n ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })

// Achica la fuente hasta que el texto entre en el ancho disponible (sin bajar de minSize);
// si igual no entra, lo corta con "…"
export function textoAjustado(ctx, texto, x, y, anchoMax, size, weight = 700, minSize = size * 0.6) {
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

export function caja(ctx, x, y, w, h, r = 36) {
    ctx.fillStyle = CARD
    ctx.strokeStyle = BORDE
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, r)
    ctx.fill()
    ctx.stroke()
}

// Prepara el canvas y pinta el fondo azul con un brillo del color del club (si hay)
export function iniciarLienzo(canvas, colorAcento) {
    canvas.width = ANCHO
    canvas.height = ALTO
    const ctx = canvas.getContext('2d')

    const fondo = ctx.createLinearGradient(0, 0, 0, ALTO)
    fondo.addColorStop(0, AZUL_LOGO)
    fondo.addColorStop(1, FONDO)
    ctx.fillStyle = fondo
    ctx.fillRect(0, 0, ANCHO, ALTO)

    const acento = esHex(colorAcento) ? colorAcento : '#2E5CA0'
    const brillo = ctx.createRadialGradient(ANCHO, 0, 0, ANCHO, 0, 1100)
    brillo.addColorStop(0, hexARgba(acento, 0.45))
    brillo.addColorStop(1, hexARgba(acento, 0))
    ctx.fillStyle = brillo
    ctx.fillRect(0, 0, ANCHO, ALTO)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    return ctx
}

// Logo con esquinas redondeadas
export function dibujarLogo(ctx, logo, x, y, lado, radio) {
    if (!logo) return
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, lado, lado, radio)
    ctx.clip()
    ctx.drawImage(logo, x, y, lado, lado)
    ctx.restore()
}

// Cierre común: invitación a jugar + URL
export function dibujarPie(ctx) {
    const cx = ANCHO / 2
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
        img.onerror = () => resolve(null) // sin la imagen igual se puede dibujar
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
