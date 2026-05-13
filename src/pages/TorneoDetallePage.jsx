import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getTorneo, getTorneoPorCodigo, getTablaTorneo, salirDeTorneo, unirseTorneo, editarTorneo, expulsarParticipante } from '../api/torneoApi'
import { getRankingJornada } from '../api/rankingApi'
import { getJornadas } from '../api/jornadaApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

export default function TorneoDetallePage() {
    const { torneoId, codigo } = useParams()
    const navigate = useNavigate()
    const usuario = useAuthStore(state => state.usuario)

    const [torneo, setTorneo] = useState(null)
    const [tablaGeneral, setTablaGeneral] = useState([])
    const [tablaJornada, setTablaJornada] = useState([])
    const [jornadas, setJornadas] = useState([])
    const [jornadaSel, setJornadaSel] = useState(null)
    const [tab, setTab] = useState('general')
    const [busqueda, setBusqueda] = useState('')
    const [loading, setLoading] = useState(true)
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [modalSalir, setModalSalir] = useState(false)
    const [modalInvitar, setModalInvitar] = useState(false)
    const [copiado, setCopiado] = useState(false)
    const [modalAjustes, setModalAjustes] = useState(false)
    const [ajustesNombre, setAjustesNombre] = useState('')
    const [ajustesDesc, setAjustesDesc] = useState('')
    const [ajustesTipo, setAjustesTipo] = useState('PUBLICO')
    const [guardandoAjustes, setGuardandoAjustes] = useState(false)
    const [modalExpulsar, setModalExpulsar] = useState(false)
    const [jugadorAExpulsar, setJugadorAExpulsar] = useState(null)

    const yaParticipa = tablaGeneral.some(
        f => f.nombreUsuario === usuario?.nombreDisplay
    )

    const abrirAjustes = () => {
        setAjustesNombre(torneo.nombre)
        setAjustesDesc(torneo.descripcion ?? '')
        setAjustesTipo(torneo.tipo)
        setMenuAbierto(false)
        setModalAjustes(true)
    }

    useEffect(() => {
        setLoading(true)
        
        // 1. Primero buscamos el torneo (por ID o por Código)
        const fetchTorneo = codigo 
            ? getTorneoPorCodigo(codigo) 
            : getTorneo(torneo.id);

        fetchTorneo.then(torneoData => {
            setTorneo(torneoData)
            
            // 2. Una vez que tenemos el torneo, ya sabemos su ID. 
            // Ahora sí buscamos la tabla y las jornadas.
            Promise.allSettled([
                getTablaTorneo(torneoData.id),
                getJornadas()
            ]).then(([tablaRes, jornadasRes]) => {
                if (tablaRes.status === 'fulfilled') setTablaGeneral(tablaRes.value)
                if (jornadasRes.status === 'fulfilled') {
                    const finalizadas = jornadasRes.value
                        .filter(j => j.estado === 'FINALIZADA')
                        .sort((a, b) => b.numero - a.numero)
                    setJornadas(finalizadas)
                    if (finalizadas.length > 0) setJornadaSel(finalizadas[0].id)
                }
                setLoading(false)
            })
        }).catch((e) => {
            console.error(e)
            setLoading(false)
            // Si el link es inválido, lo pateamos a la lista de torneos
            navigate('/torneos', { replace: true }) 
        })
    }, [torneoId, codigo, navigate])

    // Cargar ranking de jornada cuando cambia el selector
    useEffect(() => {
        if (!jornadaSel) return
        // Filtramos del ranking global de la jornada solo los que están en este torneo
        getRankingJornada(jornadaSel, 500).then(rankingCompleto => {
            const idsEnTorneo = new Set(tablaGeneral.map(f => f.equipoVirtualId))
            const filtrado = rankingCompleto
                .filter(f => idsEnTorneo.has(f.equipoVirtualId))
                .map((f, i) => ({ ...f, posicion: i + 1 }))
            setTablaJornada(filtrado)
        }).catch(() => { })
    }, [jornadaSel, tablaGeneral])

    // Busqueda en la tabla activa
    const tablaFiltrada = useMemo(() => {
        const tabla = tab === 'general' ? tablaGeneral : tablaJornada
        if (!busqueda.trim()) return tabla
        const q = busqueda.toLowerCase()
        return tabla.filter(f =>
            f.nombreEquipo.toLowerCase().includes(q) ||
            f.nombreUsuario.toLowerCase().includes(q)
        )
    }, [tab, tablaGeneral, tablaJornada, busqueda])

    // Mi fila en la tabla activa
    const miFila = useMemo(() => {
        const tabla = tab === 'general' ? tablaGeneral : tablaJornada
        return tabla.find(f => f.nombreUsuario === usuario?.nombreDisplay)
    }, [tab, tablaGeneral, tablaJornada, usuario])

    const handleSalir = async () => {
        try {
            await salirDeTorneo(torneo.id)
            navigate('/torneos', { replace: true })
        } catch (e) {
            alert(e.response?.data?.mensaje ?? 'No pudiste salir del torneo.')
        }
    }

    const handleGuardarAjustes = async () => {
        setGuardandoAjustes(true)
        try {
            const actualizado = await editarTorneo(torneo.id, {
                nombre: ajustesNombre,
                descripcion: ajustesDesc,
                tipo: ajustesTipo,
            })
            setTorneo(actualizado)
            setModalAjustes(false)
        } catch (e) {
            console.error(e)
        } finally {
            setGuardandoAjustes(false)
        }
    }

    const iniciarExpulsion = (equipoVirtualId, nombreEquipo) => {
        setJugadorAExpulsar({ equipoVirtualId, nombreEquipo })
        setModalExpulsar(true)
    }

    const confirmarExpulsion = async () => {
        if (!jugadorAExpulsar) return
        try {
            await expulsarParticipante(torneo.id, jugadorAExpulsar.equipoVirtualId)

            // Recargamos la tabla
            const tabla = await getTablaTorneo(torneo.id)
            setTablaGeneral(tabla)

            setTorneo(prev => ({
                ...prev,
                cantidadParticipantes: prev.cantidadParticipantes - 1
            }))
        } catch (e) {
            console.error(e)
        } finally {
            setModalExpulsar(false)
            setJugadorAExpulsar(null)
        }
    }

    const copiarLink = () => {
        navigator.clipboard.writeText(torneo?.urlInvitacion ?? '')
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2500)
    }

    if (loading) return <LoadingSpinner mensaje="Cargando torneo..." />
    if (!torneo) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-textMuted">Torneo no encontrado.</p>
        </div>
    )

    return (
        <div className="space-y-4 pb-6">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-start justify-between pt-2 gap-3">
                <div className="min-w-0 flex-1">
                    {/* Botón volver */}
                    <button
                        onClick={() => navigate('/torneos')}
                        className="text-textMuted text-sm mb-1 flex items-center gap-1
                        hover:text-textMain transition-colors"
                    >
                        ← Torneos
                    </button>
                    <h1 className="text-textMain font-black text-xl truncate">
                        {torneo.nombre}
                    </h1>
                    {torneo.descripcion && (
                        <p className="text-textMuted text-xs mt-0.5 line-clamp-2">
                            {torneo.descripcion}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-textMuted text-xs">
                            {torneo.cantidadParticipantes} participantes
                        </span>
                        <span className={clsx(
                            'text-xs font-semibold',
                            torneo.tipo === 'PRIVADO' ? 'text-accent' : 'text-green-400'
                        )}>
                            {torneo.tipo === 'PRIVADO' ? '🔒 Privado' : '🌐 Público'}
                        </span>
                    </div>
                </div>

                {/* Menú ⋮ oculto si no participa */}
                {yaParticipa && (
                    <div className="relative shrink-0">
                        <button
                            onClick={() => setMenuAbierto(v => !v)}
                            className="w-9 h-9 rounded-full bg-card border border-border
                           flex items-center justify-center text-textMuted
                           hover:text-textMain transition-colors text-lg"
                        >
                            ⋮
                        </button>

                        {menuAbierto && (
                            <>
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setMenuAbierto(false)}
                                />
                                <div className="absolute right-0 top-10 bg-card border border-border
                                  rounded-2xl z-40 min-w-[180px] overflow-hidden
                                  shadow-xl">

                                    {/* Ajustes — solo admin */}
                                    {torneo.esAdmin && (
                                        <button
                                            onClick={() => abrirAjustes()}
                                            className="w-full flex items-center gap-3 px-4 py-3
                                   text-textMain text-sm hover:bg-surface
                                   transition-colors text-left"
                                        >
                                            ⚙️ Ajustes
                                        </button>
                                    )}

                                    {/* Invitar amigos */}
                                    <button
                                        onClick={() => {
                                            setMenuAbierto(false)
                                            setModalInvitar(true)
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-3
                                 text-textMain text-sm hover:bg-surface
                                 transition-colors text-left"
                                    >
                                        👥 Invitar amigos
                                    </button>

                                    {/* Salir — no disponible para el creador */}
                                    {!torneo.esAdmin && (
                                        <button
                                            onClick={() => {
                                                setMenuAbierto(false)
                                                setModalSalir(true)
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3
                                   text-red-400 text-sm hover:bg-surface
                                   transition-colors text-left border-t border-border"
                                        >
                                            🚪 Salir del torneo
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Botón Unirse */}
            {!yaParticipa && (
                <button
                    onClick={async () => {
                        try {
                            const codigo = torneo.codigo || torneo.codigoInvitacion;
                            if (!codigo) throw new Error("No se encontró el código del torneo.");

                            await unirseTorneo(codigo)

                            // Recargar la tabla si tuvo éxito
                            const tabla = await getTablaTorneo(torneo.id);
                            setTablaGeneral(tabla)
                        } catch (e) {
                            alert(e.response?.data?.mensaje ?? e.message ?? 'No se pudo unir al torneo.')
                        }
                    }}
                    className="btn-accent w-full"
                >
                    Unirse al torneo
                </button>
            )}

            {/* ── Mi posición en este torneo ───────────────────────────── */}
            {miFila && (
                <div className="bg-primary/20 border border-primary rounded-2xl
                        p-3 flex items-center gap-3">
                    <PodioIcon posicion={miFila.posicion} size="md" />
                    <div className="flex-1 min-w-0">
                        <p className="text-textMain font-semibold text-sm truncate">
                            {miFila.nombreEquipo}
                        </p>
                        <p className="text-textMuted text-xs">Tu posición en este torneo</p>
                    </div>
                    <span className="text-accent font-black text-lg tabular-nums">
                        {miFila.puntajeGlobal?.toFixed(1)}
                    </span>
                </div>
            )}

            {/* ── Tabs General / Jornada ───────────────────────────────── */}
            <div className="flex gap-2 bg-card rounded-2xl p-1">
                {[
                    { key: 'general', label: '🏆 General' },
                    { key: 'jornada', label: '📅 Jornada' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={clsx(
                            'flex-1 py-2 rounded-xl text-sm font-semibold transition-colors',
                            tab === key
                                ? 'bg-primary text-white'
                                : 'text-textMuted hover:text-textMain'
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Selector de jornada */}
            {tab === 'jornada' && jornadas.length > 0 && (
                <select
                    value={jornadaSel ?? ''}
                    onChange={e => setJornadaSel(Number(e.target.value))}
                    className="w-full bg-card border border-border rounded-xl
                     px-3 py-2 text-textMain text-sm
                     focus:outline-none focus:border-primary"
                >
                    {jornadas.map(j => (
                        <option key={j.id} value={j.id}>
                            Jornada {j.numero}
                        </option>
                    ))}
                </select>
            )}

            {tab === 'jornada' && jornadas.length === 0 && (
                <p className="text-textMuted text-xs text-center py-3">
                    No hay jornadas finalizadas todavía.
                </p>
            )}

            {/* ── Buscador ─────────────────────────────────────────────── */}
            <input
                type="text"
                placeholder="Buscar por usuario o equipo..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="w-full bg-card border border-border rounded-xl
                   px-4 py-2.5 text-textMain text-sm
                   placeholder-textMuted focus:outline-none focus:border-primary"
            />

            {/* ── Tabla ────────────────────────────────────────────────── */}
            <div className="space-y-2">
                {tablaFiltrada.length === 0 ? (
                    <p className="text-textMuted text-xs text-center py-6">
                        Sin resultados.
                    </p>
                ) : (
                    tablaFiltrada.map(fila => (
                        <div
                            key={fila.equipoVirtualId}
                            className={clsx(
                                'flex items-center gap-3 p-3 rounded-2xl border',
                                fila.nombreUsuario === usuario?.nombreDisplay
                                    ? 'bg-primary/15 border-primary/40'
                                    : 'bg-card border-border'
                            )}
                        >
                            <PodioIcon posicion={fila.posicion} size="sm" />
                            <div className="flex-1 min-w-0">
                                <p className="text-textMain font-semibold text-sm truncate">
                                    {fila.nombreEquipo}
                                </p>
                                <p className="text-textMuted text-xs truncate">
                                    {fila.nombreUsuario}
                                </p>
                            </div>
                            <span className="text-accent font-black text-base tabular-nums shrink-0">
                                {fila.puntajeGlobal?.toFixed(1)}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* ── Modal: Confirmar salir ───────────────────────────────── */}
            {modalSalir && createPortal(
                <>
                    <div className="fixed inset-0 bg-black/60 z-40"
                        onClick={() => setModalSalir(false)} />
                    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto
                          bg-card border-t border-border rounded-t-3xl
                          z-50 p-6 space-y-4 animate-slide-up"
                        onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                        <h3 className="text-textMain font-bold text-lg">¿Salir del torneo?</h3>
                        <p className="text-textMuted text-sm">
                            Vas a dejar de participar en <strong className="text-textMain">
                                {torneo.nombre}</strong>. Tu historial de puntos se perderá.
                        </p>
                        <div className="space-y-2">
                            <button
                                onClick={handleSalir}
                                className="w-full py-3 rounded-xl font-semibold
                           bg-red-500/20 border border-red-500 text-red-400"
                            >
                                Sí, salir del torneo
                            </button>
                            <button
                                onClick={() => setModalSalir(false)}
                                className="w-full py-2 text-textMuted text-sm"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* ── Modal: Invitar amigos ────────────────────────────────── */}
            {modalInvitar && createPortal(
                <>
                    <div className="fixed inset-0 bg-black/60 z-40"
                        onClick={() => setModalInvitar(false)} />
                    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto
                          bg-card border-t border-border rounded-t-3xl
                          z-50 p-6 space-y-4 animate-slide-up"
                        onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                        <h3 className="text-textMain font-bold text-lg">Invitar amigos</h3>
                        <p className="text-textMuted text-sm">
                            Compartí este link para que se unan al torneo.
                        </p>
                        <div className="bg-surface border border-border rounded-xl
                             px-4 py-3 flex items-center gap-3">
                            <p className="flex-1 text-textMuted text-xs truncate">
                                {torneo.urlInvitacion}
                            </p>
                            <button
                                onClick={copiarLink}
                                className="text-primary text-sm font-semibold shrink-0"
                            >
                                {copiado ? '✓ Copiado' : 'Copiar'}
                            </button>
                        </div>
                        <button
                            onClick={() => setModalInvitar(false)}
                            className="w-full py-2 text-textMuted text-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </>,
                document.body
            )}

            {/* ── Modal: Ajustes ────────────────────────────────── */}
            {modalAjustes && createPortal(
                <>
                    <div className="fixed inset-0 bg-black/60 z-40"
                        onClick={() => setModalAjustes(false)} />
                    <div
                        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto
                 bg-card border-t border-border rounded-t-3xl
                 z-50 p-6 space-y-4 animate-slide-up"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                        <h3 className="text-textMain font-bold text-lg">Ajustes del torneo</h3>

                        {/* Editar datos */}
                        <div className="space-y-3">
                            <input
                                type="text"
                                value={ajustesNombre}
                                onChange={e => setAjustesNombre(e.target.value)}
                                placeholder="Nombre del torneo"
                                className="w-full bg-surface border border-border rounded-xl
                     px-4 py-2.5 text-textMain text-sm
                     focus:outline-none focus:border-primary"
                            />
                            <input
                                type="text"
                                value={ajustesDesc}
                                onChange={e => setAjustesDesc(e.target.value)}
                                placeholder="Descripción (opcional)"
                                className="w-full bg-surface border border-border rounded-xl
                     px-4 py-2.5 text-textMain text-sm
                     focus:outline-none focus:border-primary"
                            />
                            <div className="flex gap-2">
                                {['PUBLICO', 'PRIVADO'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setAjustesTipo(t)}
                                        className={`flex-1 py-2 rounded-xl text-sm font-semibold
                border transition-colors
                ${ajustesTipo === t
                                                ? 'bg-primary border-primary text-white'
                                                : 'border-border text-textMuted'}`}
                                    >
                                        {t === 'PUBLICO' ? '🌐 Público' : '🔒 Privado'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGuardarAjustes}
                            disabled={guardandoAjustes}
                            className="btn-primary w-full disabled:opacity-50"
                        >
                            {guardandoAjustes ? 'Guardando...' : 'Guardar cambios'}
                        </button>

                        {/* Participantes con opción de expulsar */}
                        <div className="space-y-2">
                            <p className="text-textMuted text-xs font-semibold uppercase tracking-wide">
                                Participantes
                            </p>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {tablaGeneral.map(fila => {
                                    const esAdmin = fila.nombreUsuario === torneo.creadorNombre
                                    return (
                                        <div
                                            key={fila.equipoVirtualId}
                                            className="flex items-center gap-3 p-2.5 rounded-xl
                           bg-surface border border-border"
                                        >
                                            <div className="flex-1 min-w-0">
                                                <p className="text-textMain text-sm font-semibold truncate">
                                                    {fila.nombreEquipo}
                                                </p>
                                                <p className="text-textMuted text-xs truncate">
                                                    {fila.nombreUsuario}
                                                    {esAdmin && (
                                                        <span className="ml-1 text-accent text-xs">· Admin</span>
                                                    )}
                                                </p>
                                            </div>
                                            {!esAdmin && (
                                                <button
                                                    onClick={() => iniciarExpulsion(fila.equipoVirtualId, fila.nombreEquipo)}
                                                    className="text-red-400 text-xs border border-red-400/40
         rounded-lg px-2 py-1 hover:bg-red-400/10
         transition-colors shrink-0"
                                                >
                                                    Expulsar
                                                </button>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <button
                            onClick={() => setModalAjustes(false)}
                            className="w-full py-2 text-textMuted text-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </>,
                document.body
            )}

            {/* ── Modal: Confirmar Expulsión ────────────────────────────────── */}
            {modalExpulsar && jugadorAExpulsar && createPortal(
                <>
                    <div className="fixed inset-0 bg-black/70 z-[60]"
                        onClick={() => setModalExpulsar(false)} />
                    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto
                          bg-card border-t border-border rounded-t-3xl
                          z-[70] p-6 space-y-4 animate-slide-up"
                        onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                        <h3 className="text-textMain font-bold text-lg">¿Expulsar participante?</h3>
                        <p className="text-textMuted text-sm">
                            Estás por eliminar a <strong className="text-textMain">{jugadorAExpulsar.nombreEquipo}</strong> del torneo. Esta acción no se puede deshacer.
                        </p>
                        <div className="space-y-2 mt-4">
                            <button
                                onClick={confirmarExpulsion}
                                className="w-full py-3 rounded-xl font-semibold bg-red-500/20 border border-red-500 text-red-400 active:scale-95 transition-transform"
                            >
                                Sí, expulsar
                            </button>
                            <button
                                onClick={() => setModalExpulsar(false)}
                                className="w-full py-2 text-textMuted text-sm font-medium"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}

        </div>
    )
}

// ── Helper componente de podio ───────────────────────────────────────────────
function PodioIcon({ posicion, size = 'sm' }) {
    const dim = size === 'md' ? 'w-10 h-10 text-base' : 'w-7 h-7 text-xs'
    return (
        <span className={clsx(
            dim,
            'rounded-full flex items-center justify-center font-black shrink-0',
            posicion === 1 && 'bg-yellow-500 text-white',
            posicion === 2 && 'bg-gray-400 text-white',
            posicion === 3 && 'bg-amber-700 text-white',
            posicion >= 4 && 'bg-border text-textMuted',
        )}>
            {posicion}
        </span>
    )
}