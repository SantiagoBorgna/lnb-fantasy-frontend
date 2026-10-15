// Genera public/og-image.png (1200x630): la imagen que muestran WhatsApp,
// Instagram, X, etc. cuando se comparte un link del sitio.
// Uso: node scripts/generar-og.mjs
import { createCanvas, loadImage, registerFont } from 'canvas'
import { writeFileSync, existsSync } from 'fs'

const W = 1200
const H = 630
const AZUL_LOGO = '#132442'
const NARANJA = '#F5862E'
const BLANCO = '#FFFFFF'
const GRIS = '#A9BCD0'

// Inter si está instalada; si no, cae en la sans del sistema
const DIR_INTER = '/usr/share/fonts/opentype/inter'
const PESOS = { Medium: '500', SemiBold: '600', Bold: '700', Black: '900' }
for (const [nombre, weight] of Object.entries(PESOS)) {
    const ruta = `${DIR_INTER}/Inter-${nombre}.otf`
    if (existsSync(ruta)) registerFont(ruta, { family: 'Inter', weight })
}
const fuente = (weight, size) => `${weight} ${size}px Inter, Arial, sans-serif`

const canvas = createCanvas(W, H)
const ctx = canvas.getContext('2d')

// Fondo: azul del logo con un brillo suave arriba a la izquierda
ctx.fillStyle = AZUL_LOGO
ctx.fillRect(0, 0, W, H)
const brillo = ctx.createRadialGradient(250, 120, 0, 250, 120, 700)
brillo.addColorStop(0, 'rgba(46, 92, 160, 0.55)')
brillo.addColorStop(1, 'rgba(19, 36, 66, 0)')
ctx.fillStyle = brillo
ctx.fillRect(0, 0, W, H)

// Logo a la derecha
const logo = await loadImage('public/icons/logo-cuadrado.jpg')
const L = 430
const lx = W - L - 70
const ly = (H - L) / 2
ctx.save()
ctx.beginPath()
ctx.roundRect(lx, ly, L, L, 48)
ctx.clip()
ctx.drawImage(logo, lx, ly, L, L)
ctx.restore()

// Textos a la izquierda
const x = 80
ctx.textBaseline = 'alphabetic'

ctx.fillStyle = GRIS
ctx.font = fuente(700, 26)
ctx.fillText('SEXTO HOMBRE FANTASY', x, 150)

ctx.fillStyle = BLANCO
ctx.font = fuente(900, 72)
ctx.fillText('El fantasy de la', x, 245)
ctx.fillStyle = NARANJA
ctx.fillText('Liga Nacional', x, 325)
ctx.fillStyle = BLANCO
ctx.fillText('de Básquet', x, 405)

// Píldoras
let px = x
const py = 455
ctx.font = fuente(700, 26)
for (const texto of ['Gratis', 'Premio todas las jornadas']) {
    const ancho = ctx.measureText(texto).width + 44
    ctx.fillStyle = 'rgba(255,255,255,0.10)'
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(px, py, ancho, 52, 26)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = BLANCO
    ctx.fillText(texto, px + 22, py + 35)
    px += ancho + 14
}

ctx.fillStyle = GRIS
ctx.font = fuente(600, 26)
ctx.fillText('sextohombrefantasy.com.ar', x, 575)

writeFileSync('public/og-image.png', canvas.toBuffer('image/png'))
console.log('✅ public/og-image.png generado')
