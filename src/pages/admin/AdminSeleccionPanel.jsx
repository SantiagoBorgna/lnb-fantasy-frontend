import { useEffect, useMemo, useState } from 'react'
import { Loader2, Copy, CheckCircle, Trash2, QrCode, Pencil, ClipboardList, Plus, X, Eye, EyeOff, Trophy, Star } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import ConfirmModal from '../../components/ui/ConfirmModal'
import CamisetaSVG from '../../components/jugador/CamisetaSVG'
import ModalQrShowdown from './ModalQrShowdown'
import ModalParticipantesShowdown from './ModalParticipantesShowdown'
import ModalPlanillaSeleccion from './ModalPlanillaSeleccion'
import ModalHistoriaSeleccion from './ModalHistoriaSeleccion'
import {
    getEquiposSeleccion, guardarEquipoSeleccion, eliminarEquipoSeleccion,
    getJugadoresSeleccion, guardarJugadorSeleccion, eliminarJugadorSeleccion,
    getEventosSeleccion, crearEventoSeleccion, editarEventoSeleccion, eliminarEventoSeleccion, cambiarBannerSeleccion,
    getParticipantesSeleccion, linkSeleccion, mensajeDeError,
} from '../../api/seleccionApi'

const POSICIONES = [
    { value: 'BASE', label: 'Base' },
    { value: 'ESCOLTA', label: 'Escolta' },
    { value: 'ALERO', label: 'Alero' },
    { value: 'ALA_PIVOT', label: 'Ala Pívot' },
    { value: 'PIVOT', label: 'Pívot' },
]
const labelPosicion = (p) => POSICIONES.find(x => x.value === p)?.label ?? p

const EQUIPO_VACIO = { nombre: '', sigla: '', colorPrincipal: '#75AADB', colorSecundario: '#FFFFFF', modeloCamiseta: 1 }
const JUGADOR_VACIO = { nombreCompleto: '', numeroCamiseta: '', posicion: 'BASE', valor: '' }
const EVENTO_VACIO = { localId: '', visitanteId: '', fechaHora: '' }

const input = 'w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-textMain focus:outline-none focus:border-primary'
const boton = 'px-4 py-2 bg-primary text-bg font-bold rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50'
const botonGris = 'flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-semibold text-textMain transition-colors disabled:opacity-40 disabled:cursor-not-allowed'

/**
 * Relámpago Selección: partidos de la selección (Argentina vs Bahamas, vs Canadá...) con
 * selecciones, jugadores y precios cargados a mano. Todo vive en tablas propias (seleccion_*)
 * del backend de la Liga Nacional: no toca el mercado, los promedios ni los precios de la liga.
 */
export default function AdminSeleccionPanel() {
    const showToast = useUiStore(state => state.showToast)
    const [equipos, setEquipos] = useState([])
    const [jugadores, setJugadores] = useState([])
    const [eventos, setEventos] = useState([])
    const [loading, setLoading] = useState(true)

    const [qrDe, setQrDe] = useState(null)
    const [inscriptosDe, setInscriptosDe] = useState(null)
    const [planillaDe, setPlanillaDe] = useState(null)
    const [historia, setHistoria] = useState(null) // { evento, tipo: 'ganador' | 'ideal' }
    const [copiadoId, setCopiadoId] = useState(null)
    const [aBorrar, setABorrar] = useState(null) // { tipo, id, titulo, mensaje }

    const cargar = () => Promise.all([getEquiposSeleccion(), getJugadoresSeleccion(), getEventosSeleccion()])
        .then(([eq, ju, ev]) => {
            setEquipos(eq)
            setJugadores(ju)
            setEventos(ev)
        })
        .catch(error => showToast(mensajeDeError(error, 'Error cargando la Selección'), 'error'))
        .finally(() => setLoading(false))

    useEffect(() => { cargar() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const copiar = (evento) => {
        navigator.clipboard.writeText(linkSeleccion(evento.codigoInscripcion))
        setCopiadoId(evento.id)
        setTimeout(() => setCopiadoId(null), 2000)
    }

    const confirmarBorrado = async () => {
        const { tipo, id } = aBorrar
        setABorrar(null)
        try {
            if (tipo === 'evento') await eliminarEventoSeleccion(id)
            if (tipo === 'equipo') await eliminarEquipoSeleccion(id)
            if (tipo === 'jugador') await eliminarJugadorSeleccion(id)
            showToast('Eliminado', 'success')
            cargar()
        } catch (error) {
            showToast(mensajeDeError(error, 'No se pudo eliminar'), 'error')
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
    }

    return (
        <div className="flex flex-col gap-10 animate-fade-in pt-4">
            {qrDe && (
                <ModalQrShowdown
                    link={linkSeleccion(qrDe.codigoInscripcion)}
                    titulo={`${qrDe.localSigla} vs ${qrDe.visitanteSigla}`}
                    onCerrar={() => setQrDe(null)}
                />
            )}
            {inscriptosDe && (
                <ModalParticipantesShowdown
                    evento={inscriptosDe}
                    cargar={getParticipantesSeleccion}
                    onCerrar={() => setInscriptosDe(null)}
                />
            )}
            {planillaDe && (
                <ModalPlanillaSeleccion
                    evento={planillaDe}
                    onCerrar={() => setPlanillaDe(null)}
                    onGuardada={cargar}
                />
            )}
            {historia && (
                <ModalHistoriaSeleccion
                    evento={historia.evento}
                    tipo={historia.tipo}
                    onCerrar={() => setHistoria(null)}
                />
            )}
            <ConfirmModal
                isOpen={!!aBorrar}
                onClose={() => setABorrar(null)}
                onConfirm={confirmarBorrado}
                titulo={aBorrar?.titulo}
                mensaje={aBorrar?.mensaje}
            />

            <SeccionEventos
                equipos={equipos}
                eventos={eventos}
                copiadoId={copiadoId}
                onCopiar={copiar}
                onQr={setQrDe}
                onInscriptos={setInscriptosDe}
                onPlanilla={setPlanillaDe}
                onHistoria={(evento, tipo) => setHistoria({ evento, tipo })}
                onBorrar={(e) => setABorrar({
                    tipo: 'evento', id: e.id, titulo: 'Eliminar Relámpago',
                    mensaje: `¿Eliminar ${e.localSigla} vs ${e.visitanteSigla}? Se borran también los ${e.participantesCount} inscriptos y la planilla. No se puede deshacer.`,
                })}
                onCambio={cargar}
            />

            <SeccionJugadores
                equipos={equipos}
                jugadores={jugadores}
                onBorrar={(j) => setABorrar({
                    tipo: 'jugador', id: j.id, titulo: 'Eliminar jugador',
                    mensaje: `¿Eliminar a ${j.nombreCompleto}?`,
                })}
                onCambio={cargar}
            />

            <SeccionEquipos
                equipos={equipos}
                onBorrar={(e) => setABorrar({
                    tipo: 'equipo', id: e.id, titulo: 'Eliminar selección',
                    mensaje: `¿Eliminar ${e.nombre}?`,
                })}
                onCambio={cargar}
            />
        </div>
    )
}

// ── Partidos ─────────────────────────────────────────────────────────────────

function SeccionEventos({ equipos, eventos, copiadoId, onCopiar, onQr, onInscriptos, onPlanilla, onHistoria, onBorrar, onCambio }) {
    const showToast = useUiStore(state => state.showToast)
    const [form, setForm] = useState(EVENTO_VACIO)
    const [guardando, setGuardando] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [bannerCambiando, setBannerCambiando] = useState(null)

    // El banner del inicio sigue después del partido (para ver resultados) hasta apagarlo acá
    const cambiarBanner = async (e) => {
        setBannerCambiando(e.id)
        try {
            await cambiarBannerSeleccion(e.id, !e.mostrarBanner)
            showToast(e.mostrarBanner ? 'Banner oculto del inicio' : 'Banner visible en el inicio', 'success')
            onCambio()
        } catch (error) {
            showToast(mensajeDeError(error, 'No se pudo cambiar el banner'), 'error')
        } finally {
            setBannerCambiando(null)
        }
    }

    const crear = async (ev) => {
        ev.preventDefault()
        setGuardando(true)
        try {
            await crearEventoSeleccion(aPayload(form))
            showToast('¡Relámpago creado!', 'success')
            setForm(EVENTO_VACIO)
            onCambio()
        } catch (error) {
            showToast(mensajeDeError(error, 'No se pudo crear el partido'), 'error')
        } finally {
            setGuardando(false)
        }
    }

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-lg font-bold text-textMain">Partidos de la Selección</h2>
                <p className="text-xs text-textMuted mt-1">
                    Cada partido es un Relámpago con su link y QR. La inscripción se cierra sola a la hora del partido (hora argentina).
                    Cuando termina, cargá la planilla: se calculan los puntos y queda el ranking final.
                </p>
            </div>

            <form onSubmit={crear} className="bg-surface border border-border rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                <CamposEvento form={form} setForm={setForm} equipos={equipos} />
                <button type="submit" disabled={guardando} className={boton}>
                    {guardando ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Crear Relámpago'}
                </button>
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {eventos.length === 0 && (
                    <div className="bg-surface rounded-xl p-6 text-center text-textMuted text-sm border border-border lg:col-span-2">
                        Todavía no hay partidos. Primero cargá las selecciones y sus jugadores (más abajo).
                    </div>
                )}
                {eventos.map(e => editandoId === e.id ? (
                    <EdicionEvento
                        key={e.id}
                        evento={e}
                        equipos={equipos}
                        onCancelar={() => setEditandoId(null)}
                        onGuardado={() => { setEditandoId(null); onCambio() }}
                    />
                ) : (
                    <div key={e.id} className="bg-surface border border-border rounded-xl p-4 shadow-sm space-y-3">
                        <div className="flex justify-between items-start gap-3">
                            <div>
                                <p className="font-black text-textMain text-lg leading-tight">
                                    {e.localSigla} vs {e.visitanteSigla}
                                    {e.puntosLocal != null && <span className="text-textMuted font-bold text-sm ml-2">{e.puntosLocal}-{e.puntosVisitante}</span>}
                                </p>
                                <p className="text-xs text-textMuted mt-0.5">
                                    {new Date(e.fecha).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${e.estado === 'ABIERTO' ? 'bg-warning/20 text-warning' : e.estado === 'EN_CURSO' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/50'}`}>
                                    {e.estado.replace('_', ' ')}
                                </span>
                                <button onClick={() => onInscriptos(e)} className="text-xs text-textMuted font-medium underline hover:text-textMain">
                                    {e.participantesCount} inscriptos
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/5">
                            <button onClick={() => onCopiar(e)} className={`${botonGris} flex-1`}>
                                {copiadoId === e.id ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                {copiadoId === e.id ? '¡Copiado!' : 'Copiar link'}
                            </button>
                            <button onClick={() => onQr(e)} className={botonGris}><QrCode className="w-4 h-4" /> QR</button>
                            <button
                                onClick={() => onPlanilla(e)}
                                disabled={e.estado === 'ABIERTO'}
                                title={e.estado === 'ABIERTO' ? 'Se habilita cuando empieza el partido' : 'Cargar estadísticas'}
                                className={botonGris}
                            >
                                <ClipboardList className="w-4 h-4" /> Planilla
                            </button>
                            <button
                                onClick={() => cambiarBanner(e)}
                                disabled={bannerCambiando === e.id}
                                className={botonGris}
                                title={e.mostrarBanner ? 'Ocultar el banner del inicio' : 'Mostrar el banner en el inicio'}
                            >
                                {e.mostrarBanner ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-textMuted" />}
                                {e.mostrarBanner ? 'Banner' : 'Sin banner'}
                            </button>
                            <button onClick={() => setEditandoId(e.id)} className={botonGris} title="Editar"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => onBorrar(e)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg" title="Eliminar">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Con la planilla cargada: historias del resultado para Instagram */}
                        {e.estado === 'FINALIZADO' && (
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-textMuted font-semibold">Historias:</span>
                                <button onClick={() => onHistoria(e, 'ganador')} className={`${botonGris} flex-1`}>
                                    <Trophy className="w-4 h-4" /> Quinteto del ganador
                                </button>
                                <button onClick={() => onHistoria(e, 'ideal')} className={`${botonGris} flex-1`}>
                                    <Star className="w-4 h-4" /> Quinteto ideal
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    )
}

const aPayload = (form) => ({ localId: Number(form.localId), visitanteId: Number(form.visitanteId), fechaHora: form.fechaHora })

function CamposEvento({ form, setForm, equipos }) {
    return (
        <>
            <label className="text-xs text-textMuted font-semibold space-y-1">
                <span>Local</span>
                <select required value={form.localId} onChange={e => setForm({ ...form, localId: e.target.value })} className={input}>
                    <option value="">Elegir…</option>
                    {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
            </label>
            <label className="text-xs text-textMuted font-semibold space-y-1">
                <span>Visitante</span>
                <select required value={form.visitanteId} onChange={e => setForm({ ...form, visitanteId: e.target.value })} className={input}>
                    <option value="">Elegir…</option>
                    {equipos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
            </label>
            <label className="text-xs text-textMuted font-semibold space-y-1">
                <span>Inicio (hora argentina)</span>
                <input required type="datetime-local" value={form.fechaHora} onChange={e => setForm({ ...form, fechaHora: e.target.value })} className={input} />
            </label>
        </>
    )
}

// Edición en la misma tarjeta (ej. si se posterga el partido). Con inscriptos no se pueden cambiar los equipos.
function EdicionEvento({ evento, equipos, onCancelar, onGuardado }) {
    const showToast = useUiStore(state => state.showToast)
    const [form, setForm] = useState({ localId: evento.localId, visitanteId: evento.visitanteId, fechaHora: evento.fecha.slice(0, 16) })
    const [guardando, setGuardando] = useState(false)

    const guardar = async (ev) => {
        ev.preventDefault()
        setGuardando(true)
        try {
            await editarEventoSeleccion(evento.id, aPayload(form))
            showToast('Partido actualizado', 'success')
            onGuardado()
        } catch (error) {
            showToast(mensajeDeError(error, 'No se pudo guardar el partido'), 'error')
        } finally {
            setGuardando(false)
        }
    }

    return (
        <form onSubmit={guardar} className="bg-surface border border-primary rounded-xl p-4 shadow-sm space-y-3">
            <p className="font-black text-textMain">Editar {evento.localSigla} vs {evento.visitanteSigla}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <CamposEvento form={form} setForm={setForm} equipos={equipos} />
            </div>
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={onCancelar} className={botonGris}>Cancelar</button>
                <button type="submit" disabled={guardando} className={boton}>
                    {guardando ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Guardar'}
                </button>
            </div>
        </form>
    )
}

// ── Jugadores ────────────────────────────────────────────────────────────────

function SeccionJugadores({ equipos, jugadores, onBorrar, onCambio }) {
    const showToast = useUiStore(state => state.showToast)
    const [equipoId, setEquipoId] = useState(null)
    const [form, setForm] = useState(JUGADOR_VACIO)
    const [editandoId, setEditandoId] = useState(null)
    const [guardando, setGuardando] = useState(false)

    const equipoActual = equipoId ?? equipos[0]?.id
    const delEquipo = useMemo(() => {
        const orden = POSICIONES.map(p => p.value)
        return jugadores
            .filter(j => j.equipoId === equipoActual)
            .sort((a, b) => orden.indexOf(a.posicion) - orden.indexOf(b.posicion) || b.valor - a.valor)
    }, [jugadores, equipoActual])
    const equipo = equipos.find(e => e.id === equipoActual)

    const editar = (j) => {
        setEditandoId(j.id)
        setForm({ nombreCompleto: j.nombreCompleto, numeroCamiseta: j.numeroCamiseta, posicion: j.posicion, valor: j.valor })
    }
    const cancelar = () => { setEditandoId(null); setForm(JUGADOR_VACIO) }

    const guardar = async (ev) => {
        ev.preventDefault()
        setGuardando(true)
        try {
            await guardarJugadorSeleccion({
                id: editandoId ?? undefined,
                equipoId: equipoActual,
                nombreCompleto: form.nombreCompleto,
                numeroCamiseta: Number(form.numeroCamiseta),
                posicion: form.posicion,
                valor: Number(form.valor),
            })
            showToast(editandoId ? 'Jugador actualizado' : 'Jugador agregado', 'success')
            cancelar()
            onCambio()
        } catch (error) {
            showToast(mensajeDeError(error, 'No se pudo guardar el jugador'), 'error')
        } finally {
            setGuardando(false)
        }
    }

    if (equipos.length === 0) return null

    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-lg font-bold text-textMain">Jugadores</h2>
                <p className="text-xs text-textMuted mt-1">
                    Precio en créditos: el quinteto tiene un tope de 50cr. Cada posición necesita al menos un jugador por partido.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {equipos.map(e => (
                    <button
                        key={e.id}
                        onClick={() => { setEquipoId(e.id); cancelar() }}
                        className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${e.id === equipoActual ? 'bg-card border-primary text-textMain' : 'border-border text-textMuted hover:text-textMain'}`}
                    >
                        {e.nombre} <span className="text-textMuted font-medium">({jugadores.filter(j => j.equipoId === e.id).length})</span>
                    </button>
                ))}
            </div>

            <form onSubmit={guardar} className="bg-surface border border-border rounded-xl p-4 grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                <label className="text-xs text-textMuted font-semibold space-y-1 col-span-2">
                    <span>Nombre</span>
                    <input required value={form.nombreCompleto} onChange={e => setForm({ ...form, nombreCompleto: e.target.value })} className={input} placeholder="Nombre y apellido" />
                </label>
                <label className="text-xs text-textMuted font-semibold space-y-1">
                    <span>Número</span>
                    <input required type="number" min="0" value={form.numeroCamiseta} onChange={e => setForm({ ...form, numeroCamiseta: e.target.value })} className={input} />
                </label>
                <label className="text-xs text-textMuted font-semibold space-y-1">
                    <span>Posición</span>
                    <select value={form.posicion} onChange={e => setForm({ ...form, posicion: e.target.value })} className={input}>
                        {POSICIONES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                </label>
                <label className="text-xs text-textMuted font-semibold space-y-1">
                    <span>Precio (cr)</span>
                    <input required type="number" min="0.5" step="0.5" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} className={input} />
                </label>
                <div className="flex gap-2">
                    <button type="submit" disabled={guardando} className={`${boton} flex-1 flex items-center justify-center gap-1`}>
                        {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : editandoId ? 'Guardar' : <><Plus className="w-4 h-4" /> Agregar</>}
                    </button>
                    {editandoId && <button type="button" onClick={cancelar} className={botonGris}><X className="w-4 h-4" /></button>}
                </div>
            </form>

            <div className="bg-surface border border-border rounded-xl divide-y divide-white/5">
                {delEquipo.length === 0 && <p className="p-6 text-center text-textMuted text-sm">Sin jugadores cargados.</p>}
                {delEquipo.map(j => (
                    <div key={j.id} className="flex items-center gap-3 p-3">
                        <CamisetaSVG
                            colorPrincipal={equipo?.colorPrincipal}
                            colorSecundario={equipo?.colorSecundario}
                            modelo={equipo?.modeloCamiseta}
                            numero={j.numeroCamiseta}
                            size={32}
                            mostrarEstado={false}
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-textMain font-bold text-sm truncate">{j.nombreCompleto}</p>
                            <p className="text-textMuted text-xs">{labelPosicion(j.posicion)}</p>
                        </div>
                        <span className="text-textMain font-bold text-sm tabular-nums">{j.valor}cr</span>
                        <button onClick={() => editar(j)} className={botonGris} title="Editar"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => onBorrar(j)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </section>
    )
}

// ── Selecciones ──────────────────────────────────────────────────────────────

function SeccionEquipos({ equipos, onBorrar, onCambio }) {
    const showToast = useUiStore(state => state.showToast)
    const [form, setForm] = useState(EQUIPO_VACIO)
    const [editandoId, setEditandoId] = useState(null)
    const [guardando, setGuardando] = useState(false)

    const editar = (e) => { setEditandoId(e.id); setForm({ ...e }) }
    const cancelar = () => { setEditandoId(null); setForm(EQUIPO_VACIO) }

    const guardar = async (ev) => {
        ev.preventDefault()
        setGuardando(true)
        try {
            await guardarEquipoSeleccion({ ...form, id: editandoId ?? undefined, modeloCamiseta: Number(form.modeloCamiseta) })
            showToast(editandoId ? 'Selección actualizada' : 'Selección creada', 'success')
            cancelar()
            onCambio()
        } catch (error) {
            showToast(mensajeDeError(error, 'No se pudo guardar la selección'), 'error')
        } finally {
            setGuardando(false)
        }
    }

    return (
        <section className="space-y-4">
            <h2 className="text-lg font-bold text-textMain">Selecciones</h2>

            <form onSubmit={guardar} className="bg-surface border border-border rounded-xl p-4 grid grid-cols-2 md:grid-cols-7 gap-3 items-end">
                <label className="text-xs text-textMuted font-semibold space-y-1 col-span-2">
                    <span>Nombre</span>
                    <input required value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className={input} placeholder="Argentina" />
                </label>
                <label className="text-xs text-textMuted font-semibold space-y-1">
                    <span>Sigla</span>
                    <input required maxLength={5} value={form.sigla} onChange={e => setForm({ ...form, sigla: e.target.value })} className={input} placeholder="ARG" />
                </label>
                <label className="text-xs text-textMuted font-semibold space-y-1">
                    <span>Color 1</span>
                    <input type="color" value={form.colorPrincipal} onChange={e => setForm({ ...form, colorPrincipal: e.target.value.toUpperCase() })} className="w-full h-9 bg-surface border border-border rounded-lg" />
                </label>
                <label className="text-xs text-textMuted font-semibold space-y-1">
                    <span>Color 2</span>
                    <input type="color" value={form.colorSecundario} onChange={e => setForm({ ...form, colorSecundario: e.target.value.toUpperCase() })} className="w-full h-9 bg-surface border border-border rounded-lg" />
                </label>
                <label className="text-xs text-textMuted font-semibold space-y-1">
                    <span>Modelo</span>
                    <div className="flex items-center gap-2">
                        <select value={form.modeloCamiseta} onChange={e => setForm({ ...form, modeloCamiseta: Number(e.target.value) })} className={input}>
                            {[1, 2, 3, 4, 5, 6, 7].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <CamisetaSVG colorPrincipal={form.colorPrincipal} colorSecundario={form.colorSecundario} modelo={form.modeloCamiseta} numero="" size={32} mostrarEstado={false} />
                    </div>
                </label>
                <div className="flex gap-2">
                    <button type="submit" disabled={guardando} className={`${boton} flex-1`}>
                        {guardando ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editandoId ? 'Guardar' : 'Crear'}
                    </button>
                    {editandoId && <button type="button" onClick={cancelar} className={botonGris}><X className="w-4 h-4" /></button>}
                </div>
            </form>

            <div className="flex flex-wrap gap-3">
                {equipos.map(e => (
                    <div key={e.id} className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3">
                        <CamisetaSVG colorPrincipal={e.colorPrincipal} colorSecundario={e.colorSecundario} modelo={e.modeloCamiseta} numero="" size={36} mostrarEstado={false} />
                        <div>
                            <p className="text-textMain font-bold text-sm">{e.nombre}</p>
                            <p className="text-textMuted text-xs">{e.sigla}</p>
                        </div>
                        <button onClick={() => editar(e)} className={botonGris} title="Editar"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => onBorrar(e)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </section>
    )
}
