import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'

const SIZES = [192, 512]
const COLOR_BG = '#1A3A6B'
const COLOR_TEXT = '#FFFFFF'

mkdirSync('public/icons', { recursive: true })

for (const size of SIZES) {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    // Fondo
    ctx.fillStyle = COLOR_BG
    ctx.roundRect(0, 0, size, size, size * 0.2)
    ctx.fill()

    // Texto "LNB"
    ctx.fillStyle = COLOR_TEXT
    ctx.font = `bold ${size * 0.28}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('LNB', size / 2, size * 0.42)

    // Subtexto "Fantasy"
    ctx.font = `${size * 0.14}px Arial`
    ctx.fillText('Fantasy', size / 2, size * 0.65)

    writeFileSync(`public/icons/icon-${size}.png`, canvas.toBuffer('image/png'))
    console.log(`✓ icon-${size}.png generado`)
}