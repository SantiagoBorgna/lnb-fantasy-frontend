import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Loader2, Star, ImageDown, Plus, Pencil, Trash2, Trophy, Medal } from 'lucide-react'
import { getJornadas } from '../../api/jornadaApi'
import {
    getMesesAdmin, crearMesAdmin, actualizarMesAdmin, eliminarMesAdmin, getResumenMesAdmin,
} from '../../api/adminApi'
import { useUiStore } from '../../store/uiStore'
import CamisetaSVG from '../../components/jugador/CamisetaSVG'
import ModalImagenCompartible from '../../components/compartir/ModalImagenCompartible'
import { dibujarGanadorJornada, dibujarQuintetoIdeal } from '../../components/compartir/quintetoCanvas'
import { dibujarTablaMes } from '../../components/compartir/top5Canvas'

const POSICIONES = { BASE: 'Base', ESCOLTA: 'Escolta', ALERO: 'Alero', ALA_PIVOT: 'Ala Pivot', PIVOT: 'Pivot' }
const FILAS_POR_IMAGEN = 5
const fmt = (n) => Number(n ?? 0).toFixed(1)

// "dd/mm" del día en que se genera la imagen
const fechaHoy = () => {
    const d = new Date()
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function AdminMesPanel() {
    const queryClient = useQueryClient()
    const showToast = useUiStore(state => state.showToast)
    const [mesElegido, setMesId] = useState('')
    const [editor, setEditor] = useState(null) // { id?, nombre, jornadaIds: Set }
    const [imagen, setImagen] = useState(null) // 'tabla' | 'puntero' | 'ideal'
    const [confirmarEliminar, setConfirmarEliminar] = useState(false)

    const { data: meses = [], isLoading: cargandoMeses } = useQuery({
        queryKey: ['adminMeses'],
        queryFn: getMesesAdmin,
    })
    // El elegido si sigue existiendo; si no, el último mes creado
    const mesId = meses.some(m => String(m.id) === mesElegido)
        ? mesElegido
        : (meses[0] ? String(meses[0].id) : '')

    const { data: jornadas = [] } = useQuery({
        queryKey: ['adminMesJornadas'],
        queryFn: getJornadas,
        select: list => [...list].sort((a, b) => a.numero - b.numero),
    })
    const { data: resumen, isLoading: cargandoResumen, isError } = useQuery({
        queryKey: ['adminMesResumen', mesId],
        queryFn: () => getResumenMesAdmin(mesId),
        enabled: !!mesId,
        staleTime: 0,
    })

    const errorDe = (err, porDefecto) => showToast(err.response?.data?.mensaje || porDefecto, 'error')

    const guardar = useMutation({
        mutationFn: ({ id, nombre, jornadaIds }) => {
            const body = { nombre, jornadaIds: [...jornadaIds] }
            return id ? actualizarMesAdmin(id, body) : crearMesAdmin(body)
        },
        onSuccess: (mes) => {
            queryClient.invalidateQueries({ queryKey: ['adminMeses'] })
            queryClient.invalidateQueries({ queryKey: ['adminMesResumen', String(mes.id)] })
            setMesId(String(mes.id))
            setEditor(null)
            showToast('Mes guardado')
        },
        onError: err => errorDe(err, 'No se pudo guardar el mes'),
    })

    const eliminar = useMutation({
        mutationFn: eliminarMesAdmin,
        onSuccess: () => {
            setMesId('')
            setConfirmarEliminar(false)
            queryClient.invalidateQueries({ queryKey: ['adminMeses'] })
            showToast('Mes eliminado')
        },
        onError: err => errorDe(err, 'No se pudo eliminar el mes'),
    })

    const mesActual = meses.find(m => String(m.id) === mesId)

    const abrirEditor = (mes) => setEditor(mes
        ? { id: mes.id, nombre: mes.nombre, jornadaIds: new Set(mes.jornadaIds) }
        : { nombre: '', jornadaIds: new Set() })

    const toggleJornada = (id) => setEditor(e => {
        const ids = new Set(e.jornadaIds)
        ids.has(id) ? ids.delete(id) : ids.add(id)
        return { ...e, jornadaIds: ids }
    })


    return (
        <div className="flex flex-col gap-6 animate-fade-in">
            {/* Selector de mes */}
            <div className="bg-surface border border-border rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-textMain">Resumen del mes</h2>
                <div className="flex flex-wrap items-center gap-2">
                    {meses.length > 0 && (
                        <select
                            value={mesId}
                            onChange={e => { setMesId(e.target.value); setEditor(null) }}
                            className="bg-card text-textMain border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary outline-none capitalize"
                        >
                            {meses.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                        </select>
                    )}
                    {mesActual && (
                        <>
                            <button onClick={() => abrirEditor(mesActual)} title="Editar jornadas"
                                className="p-2 rounded-xl border border-border text-textMuted hover:text-textMain">
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => setConfirmarEliminar(true)} title="Eliminar mes" disabled={eliminar.isPending}
                                className="p-2 rounded-xl border border-border text-textMuted hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </>
                    )}
                    <button onClick={() => abrirEditor(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-bold">
                        <Plus className="w-4 h-4" /> Nuevo mes
                    </button>
                </div>
            </div>

            {/* Editor */}
            {editor && (
                <div className="bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4">
                    <h3 className="font-bold text-textMain">{editor.id ? 'Editar mes' : 'Nuevo mes'}</h3>
                    <input
                        value={editor.nombre}
                        onChange={e => setEditor(ed => ({ ...ed, nombre: e.target.value }))}
                        placeholder="Nombre (ej: noviembre)"
                        maxLength={50}
                        className="bg-card text-textMain border border-border rounded-xl px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
                    />
                    <div>
                        <p className="text-sm text-textMuted mb-2">Jornadas que forman el mes</p>
                        <div className="flex flex-wrap gap-2">
                            {jornadas.map(j => (
                                <button
                                    key={j.id}
                                    onClick={() => toggleJornada(j.id)}
                                    className={clsx(
                                        'px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                                        editor.jornadaIds.has(j.id)
                                            ? 'bg-primary border-primary text-white'
                                            : 'border-border text-textMuted hover:text-textMain'
                                    )}
                                >
                                    J{j.numero}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditor(null)} className="px-4 py-2 text-sm text-textMuted">Cancelar</button>
                        <button
                            onClick={() => guardar.mutate(editor)}
                            disabled={guardar.isPending || !editor.nombre.trim() || editor.jornadaIds.size === 0}
                            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50"
                        >
                            {guardar.isPending ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </div>
            )}

            {!cargandoMeses && meses.length === 0 && !editor && (
                <p className="text-textMuted text-center py-12">Todavía no hay meses. Creá uno y elegí sus jornadas.</p>
            )}

            {(cargandoMeses || (mesId && cargandoResumen)) && (
                <div className="py-20 flex justify-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
            )}

            {isError && <p className="text-red-400 text-center">Error al cargar el resumen del mes</p>}

            {resumen && !cargandoResumen && (
                <ResumenMes resumen={resumen} onImagen={setImagen} />
            )}

            {resumen && imagen && (
                <ModalesImagen resumen={resumen} tipo={imagen} onCerrar={() => setImagen(null)} />
            )}

            {confirmarEliminar && mesActual && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-surface border border-border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 text-red-500">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2 capitalize">Eliminar {mesActual.nombre}</h3>
                        <p className="text-textMuted mb-6">
                            ¿Estás seguro de que querés eliminar este mes? Las jornadas no se tocan.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmarEliminar(false)}
                                className="flex-1 py-2 rounded-lg font-bold text-textMuted hover:text-white transition-colors bg-card border border-border"
                                disabled={eliminar.isPending}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => eliminar.mutate(mesActual.id)}
                                disabled={eliminar.isPending}
                                className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {eliminar.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function Tarjeta({ titulo, children, accion, className }) {
    return (
        <div className={clsx('bg-surface border border-border rounded-2xl p-5 flex flex-col gap-4', className)}>
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-black text-textMain">{titulo}</h3>
                {accion}
            </div>
            {children}
        </div>
    )
}

function BotonImagen({ onClick, children = 'Imagen para Instagram' }) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-border px-3 py-1.5 rounded-lg text-sm font-semibold text-textMain transition-colors shrink-0"
        >
            <ImageDown className="w-4 h-4" /> {children}
        </button>
    )
}

function FilaJugador({ jugador, valor, detalle, sufijo = 'pts' }) {
    return (
        <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    <CamisetaSVG
                        numero={jugador.numeroCamiseta}
                        modelo={jugador.modeloCamiseta}
                        colorPrincipal={jugador.colorPrincipal}
                        colorSecundario={jugador.colorSecundario}
                        size={40}
                    />
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-textMain font-bold truncate">{jugador.nombre}</p>
                        {jugador.esCapitan && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />}
                    </div>
                    <p className="text-textMuted text-sm">
                        {jugador.clubReal} · {POSICIONES[jugador.posicion] ?? jugador.posicion}{detalle ? ` · ${detalle}` : ''}
                    </p>
                </div>
            </div>
            <div className="text-right shrink-0">
                <p className="text-lg font-black text-textMain">{fmt(valor)}</p>
                <p className="text-xs font-medium text-textMuted uppercase tracking-wider">{sufijo}</p>
            </div>
        </div>
    )
}

function ResumenMes({ resumen, onImagen }) {
    const { tabla, puntero, quintetoIdeal, mvp, ganadoresJornada, jornadas, minimoPartidos } = resumen
    const mejorFecha = ganadoresJornada.reduce((max, g) => (!max || g.puntaje > max.puntaje ? g : max), null)
    const sinDatos = <p className="text-textMuted text-center py-6 text-sm">Todavía no hay datos de jornadas jugadas.</p>

    return (
        <>
            <p className="text-textMuted text-sm -mt-2">
                Jornadas: {jornadas.map(j => `J${j.numero}${j.estado === 'EN_JUEGO' ? ' (en juego)' : j.estado === 'FINALIZADA' ? '' : ' (sin jugar)'}`).join(', ')}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tabla */}
                <Tarjeta titulo="Tabla de posiciones" accion={tabla.length > 0 && <BotonImagen onClick={() => onImagen('tabla')}>Imágenes</BotonImagen>}>
                    {tabla.length === 0 ? sinDatos : (
                        <div className="flex flex-col gap-1.5">
                            {tabla.map(f => (
                                <div key={f.usuarioId} className="flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-2">
                                    <span className={clsx(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0',
                                        f.posicion === 1 ? 'bg-yellow-400 text-white'
                                            : f.posicion === 2 ? 'bg-gray-300 text-white'
                                                : f.posicion === 3 ? 'bg-orange-400 text-white'
                                                    : 'bg-white text-black'
                                    )}>{f.posicion}</span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-textMain font-bold truncate">{f.nombreEquipo}</p>
                                        <p className="text-textMuted text-xs truncate">{f.nombreUsuario} · {f.jornadasJugadas} fechas · mejor {fmt(f.mejorFecha)}</p>
                                    </div>
                                    <span className="text-textMain font-black shrink-0">{fmt(f.puntos)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Tarjeta>

                {/* Puntero */}
                <Tarjeta titulo={puntero ? `Puntero: ${puntero.nombreEquipo}` : 'Quinteto del puntero'}accion={puntero?.jugadores?.length > 0 && <BotonImagen onClick={() => onImagen('puntero')} />}>
                    {!puntero ? sinDatos : (
                        <>
                            <div className="text-sm text-textMuted">
                                <p><span className="text-primary font-bold">{puntero.nombreEquipo}</span> ({puntero.nombreUsuario})</p>
                                <p>Puntaje del mes: <span className="text-textMain font-bold">{fmt(puntero.puntajeMes)}</span> · Jornada {puntero.jornadaNumero}: <span className="text-textMain font-bold">{fmt(puntero.puntajeJornada)}</span></p>
                            </div>
                            <div className="flex flex-col gap-2">
                                {puntero.jugadores.map(j => <FilaJugador key={j.id} jugador={j} valor={j.puntosFantasy} />)}
                            </div>
                        </>
                    )}
                </Tarjeta>

                {/* Quinteto ideal del mes */}
                <Tarjeta titulo="Quinteto ideal del mes" accion={quintetoIdeal.length > 0 && <BotonImagen onClick={() => onImagen('ideal')} />}>
                    <p className="text-textMuted text-sm -mt-2">Mejor promedio por posición (mínimo {minimoPartidos} {minimoPartidos === 1 ? 'partido' : 'partidos'}).</p>
                    {quintetoIdeal.length === 0 ? sinDatos : (
                        <div className="flex flex-col gap-2">
                            {quintetoIdeal.map(p => (
                                <FilaJugador key={p.jugador.id} jugador={p.jugador} valor={p.promedio} sufijo="prom"
                                    detalle={`${p.partidos} PJ`} />
                            ))}
                        </div>
                    )}
                </Tarjeta>

                <div className="flex flex-col gap-6">
                    {/* MVP */}
                    <Tarjeta titulo="MVP del mes">
                        {mvp.length === 0 ? sinDatos : (
                            <div className="flex flex-col gap-2">
                                {mvp.map((p, i) => (
                                    <div key={p.jugador.id} className="flex items-center gap-2">
                                        <span className="w-6 text-center font-black text-textMuted shrink-0">
                                            {i === 0 ? <Trophy className="w-5 h-5 text-yellow-400 mx-auto" /> : i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <FilaJugador jugador={p.jugador} valor={p.promedio} sufijo="prom"
                                                detalle={`${p.partidos} PJ · ${fmt(p.total)} total`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Tarjeta>

                    {/* Ganadores por jornada */}
                    <Tarjeta titulo="Ganadores por jornada">
                        {ganadoresJornada.length === 0 ? sinDatos : (
                            <div className="flex flex-col gap-1.5">
                                {ganadoresJornada.map(g => (
                                    <div key={g.jornadaNumero} className={clsx(
                                        'flex items-center gap-3 rounded-xl px-3 py-2 border',
                                        g === mejorFecha ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-card border-border'
                                    )}>
                                        <span className="text-textMuted text-sm font-bold w-8 shrink-0">J{g.jornadaNumero}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-textMain font-bold truncate">{g.nombreEquipo}</p>
                                            <p className="text-textMuted text-xs truncate">{g.nombreUsuario}</p>
                                        </div>
                                        {g === mejorFecha && <Medal className="w-4 h-4 text-yellow-400 shrink-0" title="Mejor fecha del mes" />}
                                        <span className="text-textMain font-black shrink-0">{fmt(g.puntaje)}</span>
                                    </div>
                                ))}
                                {mejorFecha && (
                                    <p className="text-xs text-textMuted mt-1">
                                        Mejor fecha del mes: {mejorFecha.nombreEquipo} con {fmt(mejorFecha.puntaje)} en la jornada {mejorFecha.jornadaNumero}.
                                    </p>
                                )}
                            </div>
                        )}
                    </Tarjeta>
                </div>
            </div>
        </>
    )
}

function ModalesImagen({ resumen, tipo, onCerrar }) {
    const [pagina, setPagina] = useState(0)
    const [fecha] = useState(fechaHoy) // fija mientras el modal está abierto
    const mes = resumen.nombre
    const slug = mes.toLowerCase().replace(/\s+/g, '-')

    const paginas = useMemo(() => {
        const p = []
        for (let i = 0; i < resumen.tabla.length; i += FILAS_POR_IMAGEN) p.push(resumen.tabla.slice(i, i + FILAS_POR_IMAGEN))
        return p
    }, [resumen.tabla])

    const datosTabla = useMemo(() => paginas[pagina] ? {
        mes, fecha,
        filas: paginas[pagina].map(f => ({ posicion: f.posicion, nombreEquipo: f.nombreEquipo, puntos: f.puntos })),
    } : null, [paginas, pagina, mes, fecha])

    const datosPuntero = useMemo(() => resumen.puntero ? {
        nombreEquipo: resumen.puntero.nombreEquipo,
        subtitulo: `PUNTAJE DE ${mes.toUpperCase()}`,
        puntajeEnSubtitulo: true,
        puntaje: resumen.puntero.puntajeMes,
        jugadores: resumen.puntero.jugadores,
    } : null, [resumen.puntero, mes])

    const datosIdeal = useMemo(() => resumen.quintetoIdeal.length > 0 ? {
        subtitulo: mes.toUpperCase(),
        jugadores: resumen.quintetoIdeal.map(p => ({ ...p.jugador, puntosFantasy: p.promedio, sufijoPuntos: 'prom' })),
    } : null, [resumen.quintetoIdeal, mes])

    if (tipo === 'tabla') {
        const sufijo = paginas.length > 1 ? `-${pagina + 1}` : ''
        return (
            <ModalImagenCompartible
                key={pagina}
                titulo={`Top 10 ${mes}`}
                mensajeSinDatos="Todavía no hay posiciones."
                datos={datosTabla}
                dibujar={dibujarTablaMes}
                nombreArchivo={`top10-${slug}${sufijo}.png`}
                contentType="placa_tabla_mes"
                altImagen={`Top 10 ${mes}`}
                onCerrar={onCerrar}
            >
                {paginas.length > 1 && (
                    <div className="flex gap-2">
                        {paginas.map((filas, i) => (
                            <button
                                key={i}
                                onClick={() => setPagina(i)}
                                className={clsx(
                                    'flex-1 py-1.5 rounded-lg text-sm font-semibold border transition-colors',
                                    i === pagina ? 'bg-primary border-primary text-white' : 'border-border text-textMuted hover:text-textMain'
                                )}
                            >
                                Puestos {filas[0].posicion} a {filas[filas.length - 1].posicion}
                            </button>
                        ))}
                    </div>
                )}
            </ModalImagenCompartible>
        )
    }

    const esPuntero = tipo === 'puntero'
    return (
        <ModalImagenCompartible
            titulo={esPuntero ? resumen.puntero?.nombreEquipo : `Quinteto ideal de ${mes}`}
            datos={esPuntero ? datosPuntero : datosIdeal}
            dibujar={esPuntero ? dibujarGanadorJornada : dibujarQuintetoIdeal}
            nombreArchivo={esPuntero ? `puntero-${slug}.png` : `quinteto-ideal-${slug}.png`}
            contentType={esPuntero ? 'placa_puntero_mes' : 'placa_quinteto_ideal_mes'}
            altImagen={esPuntero ? `Quinteto del puntero de ${mes}` : `Quinteto ideal de ${mes}`}
            onCerrar={onCerrar}
        />
    )
}
