// Dibuja la canchita del usuario en formato historia (1080x1920) para compartir.
// Antes de la jornada muestra solo el equipo; en juego o terminada, los puntos de cada jugador.
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import CamisetaSVG from '../jugador/CamisetaSVG'
import { determinarColorNumero } from '../jugador/camisetaUtils'
import {
    ANCHO, NARANJA, BLANCO, GRIS, fuente, formatoPuntos, textoAjustado, caja,
    iniciarLienzo, dibujarLogo, dibujarPie, cargarImagen,
} from './canvasUtils'

// Cancha: mismo piso de madera y líneas que la canchita de la app (aro abajo)
const CANCHA = { x: 60, y: 260, w: 960, h: 920 }
const MADERA = '#e29b5a'
const LINEA = 'rgba(0,0,0,0.5)'

// Apellido para mostrar debajo de la camiseta. En el juego los nombres vienen como
// "APELLIDO, Nombre" (ej. "FRONTERA, J."); si no tiene coma, se saca el primer nombre.
export const apellido = (nombreCompleto = '') => {
    const limpio = nombreCompleto.trim()
    if (limpio.includes(',')) return limpio.split(',')[0].trim()
    const partes = limpio.split(/\s+/)
    return partes.length > 1 ? partes.slice(1).join(' ') : partes[0] ?? ''
}

// La camiseta se renderiza con el mismo componente de la app (colores y modelos)
// y se convierte en imagen. El número va aparte, dibujado en el canvas con Inter,
// porque dentro de un SVG usado como imagen no cargan las fuentes web.
const cacheCamisetas = new Map()
async function imagenCamiseta({ colorPrincipal, colorSecundario, modelo }) {
    const clave = `${colorPrincipal}|${colorSecundario}|${modelo}`
    if (cacheCamisetas.has(clave)) return cacheCamisetas.get(clave)

    let svg = renderToStaticMarkup(createElement(CamisetaSVG, {
        colorPrincipal: colorPrincipal || '#35c12b',
        colorSecundario: colorSecundario || '#000000',
        modelo: modelo || 1,
        numero: '',
        mostrarEstado: false,
        size: 100,
    }))
    // El id del clipPath viene de useId (puede traer caracteres raros): lo reemplazamos por uno simple
    const id = svg.match(/<clipPath id="([^"]+)"/)?.[1]
    if (id) svg = svg.split(id).join('clip')

    const img = await cargarImagen(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
    cacheCamisetas.set(clave, img)
    return img
}

function dibujarCancha(ctx) {
    const { x, y, w, h } = CANCHA
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, 40)
    ctx.clip()

    // Piso de madera con tablas
    ctx.fillStyle = MADERA
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = 'rgba(0,0,0,0.06)'
    for (let tx = x + 60; tx < x + w; tx += 120) ctx.fillRect(tx, y, 60, h)

    ctx.strokeStyle = LINEA
    ctx.lineWidth = 5
    const m = 18 // margen de las líneas
    ctx.strokeRect(x + m, y + m, w - m * 2, h - m * 2)

    const cx = x + w / 2
    const base = y + h - m

    // Triple (arco grande desde abajo)
    const anchoTriple = w * 0.84
    const altoTriple = h * 0.56
    ctx.beginPath()
    ctx.moveTo(cx - anchoTriple / 2, base)
    ctx.lineTo(cx - anchoTriple / 2, base - altoTriple + anchoTriple / 2)
    ctx.arc(cx, base - altoTriple + anchoTriple / 2, anchoTriple / 2, Math.PI, 0)
    ctx.lineTo(cx + anchoTriple / 2, base)
    ctx.stroke()

    // Pintura
    const anchoPintura = 290
    const altoPintura = 400
    ctx.fillStyle = 'rgba(0,0,0,0.05)'
    ctx.fillRect(cx - anchoPintura / 2, base - altoPintura, anchoPintura, altoPintura)
    ctx.strokeRect(cx - anchoPintura / 2, base - altoPintura, anchoPintura, altoPintura)

    // Círculo de libres
    ctx.beginPath()
    ctx.arc(cx, base - altoPintura, 130, 0, Math.PI * 2)
    ctx.stroke()

    // Tablero y aro
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(cx - 65, base - 40)
    ctx.lineTo(cx + 65, base - 40)
    ctx.stroke()
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(cx, base - 64, 22, 0, Math.PI * 2)
    ctx.stroke()

    // Semicírculo de mitad de cancha (arriba)
    ctx.strokeStyle = LINEA
    ctx.beginPath()
    ctx.arc(cx, y + m, 160, 0, Math.PI)
    ctx.stroke()

    ctx.restore()
}

// Texto blanco sin fondo (con una sombra suave para que se lea sobre la madera)
function textoJugador(ctx, texto, cx, y, { size, anchoMax }) {
    ctx.font = fuente(size, 700)
    let t = texto
    while (ctx.measureText(t).width > anchoMax && t.length > 1) t = t.slice(0, -2) + '…'
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.75)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 2
    ctx.fillStyle = BLANCO
    ctx.textAlign = 'center'
    ctx.fillText(t, cx, y + size)
    ctx.restore()
    return size + 10
}

// Etiqueta con fondo (para los puntos)
function etiqueta(ctx, texto, cx, y, { size, anchoMax, fondo = 'rgba(15,25,35,0.88)', color = BLANCO, weight = 700 }) {
    ctx.font = fuente(size, weight)
    let t = texto
    while (ctx.measureText(t).width > anchoMax - 28 && t.length > 1) t = t.slice(0, -2) + '…'
    const ancho = Math.min(ctx.measureText(t).width + 28, anchoMax)
    const alto = size + 18
    ctx.fillStyle = fondo
    ctx.beginPath()
    ctx.roundRect(cx - ancho / 2, y, ancho, alto, alto / 2)
    ctx.fill()
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.fillText(t, cx, y + size + 3)
    return alto
}

function insignia(ctx, texto, cx, cy, r, fondo, color) {
    ctx.fillStyle = fondo
    ctx.strokeStyle = '#0F1923'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = color
    ctx.font = fuente(Math.round(r * (texto.length > 1 ? 0.75 : 1.1)), 700)
    ctx.textAlign = 'center'
    ctx.fillText(texto, cx, cy + r * (texto.length > 1 ? 0.27 : 0.38))
}

/** Camiseta + número + insignia (C / 6TO) + apellido + puntos */
async function dibujarJugador(ctx, j, cx, top, { ancho, conPuntos, tamTexto, anchoTexto }) {
    const alto = ancho * 1.2
    const img = await imagenCamiseta(j)
    if (img) ctx.drawImage(img, cx - ancho / 2, top, ancho, alto)

    // Número (mismo criterio de color que la camiseta de la app)
    const numero = j.numero != null ? String(j.numero) : ''
    if (numero) {
        const colorNumero = determinarColorNumero(j.colorPrincipal, j.colorSecundario)
        ctx.font = fuente(Math.round(alto * (numero.length > 1 ? 0.27 : 0.32)), 700)
        ctx.textAlign = 'center'
        ctx.lineWidth = Math.max(3, ancho * 0.03)
        ctx.strokeStyle = colorNumero === '#FFFFFF' ? '#000000' : '#FFFFFF'
        const yNumero = top + alto * 0.67 + alto * 0.1
        ctx.strokeText(numero, cx, yNumero)
        ctx.fillStyle = colorNumero
        ctx.fillText(numero, cx, yNumero)
    }

    const r = ancho * 0.17
    if (j.rol === 'CAPITAN') insignia(ctx, 'C', cx + ancho * 0.42, top + r * 0.9, r, '#EAB308', '#0F1923')
    if (j.rol === 'SEXTO_HOMBRE') insignia(ctx, '6', cx + ancho * 0.42, top + r * 0.9, r, BLANCO, '#0F1923')

    let y = top + alto + 8
    y += textoJugador(ctx, apellido(j.nombre), cx, y, { size: tamTexto, anchoMax: anchoTexto }) + 6

    if (conPuntos) {
        const jugo = j.puntos != null
        etiqueta(ctx, jugo ? `${formatoPuntos(j.puntos)} pts` : 'No jugó', cx, y, {
            size: tamTexto - 2,
            anchoMax: anchoTexto,
            fondo: jugo ? NARANJA : 'rgba(15,25,35,0.6)',
            color: jugo ? BLANCO : GRIS,
        })
    }
}

/**
 * @param {object} d nombreEquipo, jornadaNumero, formacion, conPuntos, total,
 *   filas [[jugador]], banco [jugador], dt { nombreCompleto, equipoSigla, puntos }
 *   jugador: { nombre, numero, colorPrincipal, colorSecundario, modelo, rol, puntos }
 */
export async function dibujarCanchita(canvas, d, logo) {
    const ctx = iniciarLienzo(canvas, null)

    // ── Encabezado: logo + equipo ──
    dibujarLogo(ctx, logo, 70, 60, 150, 36)
    ctx.textAlign = 'left'
    ctx.fillStyle = NARANJA
    ctx.font = fuente(34, 700)
    const etiquetaJornada = d.jornadaNumero ? `JORNADA ${d.jornadaNumero}` : ''
    ctx.fillText(d.conPuntos ? etiquetaJornada : ['MI EQUIPO', etiquetaJornada].filter(Boolean).join(' · '), 250, 100)
    ctx.fillStyle = BLANCO
    textoAjustado(ctx, d.nombreEquipo || 'Mi equipo', 250, 168, ANCHO - 250 - 70, 60, 700, 40)
    if (d.conPuntos) {
        ctx.fillStyle = BLANCO
        ctx.font = fuente(46, 700)
        ctx.fillText(`${formatoPuntos(d.total)} pts`, 250, 226)
    } else if (d.formacion) {
        ctx.fillStyle = GRIS
        ctx.font = fuente(32, 600)
        ctx.fillText(`Formación ${d.formacion}`, 250, 222)
    }

    // ── Cancha con los titulares ──
    dibujarCancha(ctx)
    const filas = (d.filas ?? []).filter(f => f.length > 0)
    // Con puntos cada jugador lleva una etiqueta más: camisetas un poco más chicas para que entre
    const anchoCamiseta = d.conPuntos ? 130 : 150
    const altoBloque = anchoCamiseta * 1.2 + (d.conPuntos ? 112 : 56)
    const margen = 36
    const altoFila = (CANCHA.h - margen * 2) / Math.max(filas.length, 1)
    for (let i = 0; i < filas.length; i++) {
        const fila = filas[i]
        const top = CANCHA.y + margen + altoFila * i + (altoFila - altoBloque) / 2
        const paso = Math.min(300, (CANCHA.w - 80) / fila.length)
        for (let k = 0; k < fila.length; k++) {
            const cx = ANCHO / 2 + (k - (fila.length - 1) / 2) * paso
            await dibujarJugador(ctx, fila[k], cx, top, {
                ancho: anchoCamiseta, conPuntos: d.conPuntos, tamTexto: 30, anchoTexto: paso - 16,
            })
        }
    }

    // ── Banco ──
    const banco = d.banco ?? []
    ctx.textAlign = 'center'
    ctx.fillStyle = GRIS
    ctx.font = fuente(28, 700)
    ctx.letterSpacing = '6px'
    ctx.fillText('BANCO', ANCHO / 2, 1232)
    ctx.letterSpacing = '0px'
    const pasoBanco = (ANCHO - 120) / Math.max(banco.length, 1)
    for (let k = 0; k < banco.length; k++) {
        const cx = 60 + pasoBanco * (k + 0.5)
        await dibujarJugador(ctx, banco[k], cx, 1256, {
            ancho: 112, conPuntos: d.conPuntos, tamTexto: 24, anchoTexto: pasoBanco - 8,
        })
    }

    // ── DT ──
    if (d.dt?.nombreCompleto) {
        const y = d.conPuntos ? 1560 : 1520
        caja(ctx, 80, y, ANCHO - 160, 110, 30)
        ctx.textAlign = 'left'
        ctx.fillStyle = NARANJA
        ctx.font = fuente(26, 700)
        ctx.fillText('DT', 120, y + 44)
        ctx.fillStyle = BLANCO
        textoAjustado(ctx, d.dt.nombreCompleto, 120, y + 88, ANCHO - 160 - 330, 38, 700, 28)
        ctx.textAlign = 'right'
        if (d.conPuntos && d.dt.puntos != null) {
            ctx.font = fuente(46, 700)
            ctx.fillText(`${formatoPuntos(d.dt.puntos)} pts`, ANCHO - 120, y + 72)
        } else if (d.dt.equipoSigla) {
            ctx.fillStyle = GRIS
            ctx.font = fuente(32, 600)
            ctx.fillText(d.dt.equipoSigla, ANCHO - 120, y + 70)
        }
    }

    dibujarPie(ctx)
}
