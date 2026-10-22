// Fixture de una jornada para Instagram (post 4:5, 1080x1350), con el estilo de las placas
// que se hacían a mano: partidos agrupados por día, escudo vs. escudo, en dos columnas.
// Si la jornada tiene muchos partidos se reparte en varias imágenes (ver paginarFixture).
import { BLANCO, fuente, cargarImagen } from './canvasUtils'
import { ANCHO_POST, ALTO_POST } from './quintetoCanvas'

const GRIS_AZUL = '#8EA3C0'
export const MAX_PARTIDOS_POR_IMAGEN = 12

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const dosDigitos = (n) => String(n).padStart(2, '0')
const claveDia = (f) => `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())}`
const tituloDia = (f) => `${DIAS[f.getDay()]} ${dosDigitos(f.getDate())}-${dosDigitos(f.getMonth() + 1)}-${f.getFullYear()}`

// Archivo del escudo: /escudos/<liga>/<nombre del equipo sin tildes ni símbolos>.png
export const archivoEscudo = (ligaId, nombre = '') =>
    `/escudos/${ligaId}/${nombre.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`

/**
 * Agrupa los partidos por día y los reparte en la menor cantidad de imágenes posible
 * (hasta MAX_PARTIDOS_POR_IMAGEN cada una). Corta entre días siempre que se pueda; si no,
 * parte un día y su título se repite en la imagen siguiente. Devuelve [[{ titulo, partidos }]].
 */
export function paginarFixture(partidos) {
    const ordenados = [...partidos].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
    const dias = []
    for (const p of ordenados) {
        const f = new Date(p.fechaHora)
        const ultimo = dias[dias.length - 1]
        if (ultimo?.clave === claveDia(f)) ultimo.partidos.push(p)
        else dias.push({ clave: claveDia(f), titulo: tituloDia(f), partidos: [p] })
    }

    const total = ordenados.length
    const cantidadPaginas = Math.max(1, Math.ceil(total / MAX_PARTIDOS_POR_IMAGEN))
    const paginas = []
    let actual = [], enActual = 0, ubicados = 0

    const cerrar = () => { paginas.push(actual); actual = []; enActual = 0 }
    for (const dia of dias) {
        let resto = dia.partidos
        while (resto.length > 0) {
            if (enActual + resto.length <= MAX_PARTIDOS_POR_IMAGEN) {
                actual.push({ titulo: dia.titulo, partidos: resto })
                enActual += resto.length; ubicados += resto.length; resto = []
                continue
            }
            // El día no entra entero: se pasa a la imagen siguiente si lo que falta igual
            // cabe en las imágenes que quedan; si no, se parte para no sumar una imagen más
            const pendientes = total - ubicados
            const paginasQueQuedan = cantidadPaginas - paginas.length - 1
            if (enActual > 0 && pendientes <= paginasQueQuedan * MAX_PARTIDOS_POR_IMAGEN) { cerrar(); continue }
            const lugar = MAX_PARTIDOS_POR_IMAGEN - enActual
            actual.push({ titulo: dia.titulo, partidos: resto.slice(0, lugar) })
            ubicados += lugar; resto = resto.slice(lugar)
            cerrar()
        }
    }
    if (actual.length > 0) paginas.push(actual)
    return paginas
}

// Reparte la secuencia (título del día + partidos) en dos columnas parejas; la segunda puede
// arrancar con la continuación de un día, sin repetir el título (como en las placas a mano)
function enColumnas(dias, altoTitulo, altoFila) {
    const items = dias.flatMap(d => [{ tipo: 'dia', texto: d.titulo }, ...d.partidos.map(p => ({ tipo: 'partido', p }))])
    const alto = (it) => it.tipo === 'dia' ? altoTitulo : altoFila
    const total = items.reduce((s, it) => s + alto(it), 0)
    let corte = items.length, acumulado = 0, mejor = Infinity
    for (let i = 0; i <= items.length; i++) {
        // no cortar justo después de un título (quedaría solo al final de la primera columna)
        const despuesDeTitulo = i > 0 && items[i - 1].tipo === 'dia'
        const diferencia = Math.abs(total - 2 * acumulado)
        if (!despuesDeTitulo && diferencia < mejor) { mejor = diferencia; corte = i }
        if (i < items.length) acumulado += alto(items[i])
    }
    return [items.slice(0, corte), items.slice(corte)]
}

function escudoSuplente(ctx, sigla, cx, cy, lado) {
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.beginPath()
    ctx.arc(cx, cy, lado / 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = BLANCO
    ctx.font = fuente(Math.round(lado * 0.26), 800)
    ctx.textAlign = 'center'
    ctx.fillText(sigla || '?', cx, cy + lado * 0.09)
}

function escudo(ctx, img, sigla, cx, cy, lado) {
    if (!img) return escudoSuplente(ctx, sigla, cx, cy, lado)
    const escala = Math.min(lado / img.width, lado / img.height)
    const w = img.width * escala, h = img.height * escala
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h)
}

/** d: { jornadaNumero, ligaId, dias: [{ titulo, partidos }] } */
export async function dibujarFixture(canvas, d, _logo, logoLiga) {
    canvas.width = ANCHO_POST
    canvas.height = ALTO_POST
    const ctx = canvas.getContext('2d')
    const g = ctx.createLinearGradient(0, 0, ANCHO_POST * 0.6, ALTO_POST)
    g.addColorStop(0, '#0E1828')
    g.addColorStop(1, '#1C3C6E')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, ANCHO_POST, ALTO_POST)
    ctx.textBaseline = 'alphabetic'

    // Título y logo de la liga arriba a la derecha
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.55)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 4
    ctx.fillStyle = BLANCO
    ctx.font = fuente(80, 800)
    ctx.textAlign = 'center'
    ctx.fillText(`JORNADA ${d.jornadaNumero}`, ANCHO_POST / 2, 140)
    ctx.restore()
    if (logoLiga) {
        const alto = 84
        const ancho = logoLiga.width * alto / logoLiga.height
        ctx.drawImage(logoLiga, ANCHO_POST - 50 - ancho, 40, ancho, alto)
    }

    // Escudos (los que falten se dibujan con la sigla)
    const nombres = [...new Set(d.dias.flatMap(dia => dia.partidos.flatMap(p => [p.equipoLocal, p.equipoVisitante])))]
    const imagenes = Object.fromEntries(await Promise.all(
        nombres.map(async n => [n, await cargarImagen(archivoEscudo(d.ligaId, n))])))

    // Tamaño de las filas: el más grande con el que las dos columnas entran en el espacio
    // (se reparte de nuevo con cada tamaño, porque el corte entre columnas depende de él)
    const arriba = 210, abajo = 1200
    const altoTitulo = 72
    const altoColumna = (items, fila) => items.reduce((t, it) => t + (it.tipo === 'dia' ? altoTitulo : fila), 0)
    let altoFila = 175
    let columnas = enColumnas(d.dias, altoTitulo, altoFila)
    while (altoFila > 80 && Math.max(...columnas.map(c => altoColumna(c, altoFila))) > abajo - arriba) {
        altoFila -= 5
        columnas = enColumnas(d.dias, altoTitulo, altoFila)
    }
    const lado = Math.min(135, altoFila - 22)

    const centros = [ANCHO_POST * 0.285, ANCHO_POST * 0.735]
    const sobra = abajo - arriba - Math.max(...columnas.map(c => altoColumna(c, altoFila)))
    const inicio = arriba + Math.max(0, sobra) / 2 // con pocos partidos, el bloque queda centrado
    columnas.forEach((items, c) => {
        let y = inicio
        const cx = centros[c]
        for (const it of items) {
            if (it.tipo === 'dia') {
                ctx.fillStyle = GRIS_AZUL
                ctx.font = fuente(40, 700)
                ctx.textAlign = 'center'
                ctx.fillText(it.texto, cx, y + 50)
                y += altoTitulo
            } else {
                const cy = y + altoFila / 2
                const dx = Math.max(lado * 0.95, 120)
                escudo(ctx, imagenes[it.p.equipoLocal], it.p.siglaLocal, cx - dx, cy, lado)
                escudo(ctx, imagenes[it.p.equipoVisitante], it.p.siglaVisitante, cx + dx, cy, lado)
                ctx.fillStyle = BLANCO
                ctx.font = fuente(38, 800)
                ctx.textAlign = 'center'
                ctx.fillText('vs.', cx, cy + 13)
                y += altoFila
            }
        }
    })

    ctx.fillStyle = GRIS_AZUL
    ctx.font = fuente(19, 800)
    ctx.letterSpacing = '6px'
    ctx.textAlign = 'center'
    ctx.fillText('SEXTO HOMBRE FANTASY', ANCHO_POST / 2, 1290)
    ctx.letterSpacing = '0px'
}
