import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getTorneo, getTorneoPorCodigo, getTablaTorneo, getFixtureTorneo, salirDeTorneo, unirseTorneo, editarTorneo, expulsarParticipante } from '../api/torneoApi'
import { getRankingJornada, getRankingJornadaTorneo } from '../api/rankingApi'
import { getJornadas } from '../api/jornadaApi'
import { encodeId, decodeId, encodeMultiple } from '../utils/urlParams'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import JornadaSelector from '../components/ui/JornadaSelector'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

export default function TorneoDetallePage() {
    const { hashId, torneoId: oldTorneoId, codigo } = useParams()
    const rawTorneoId = hashId || oldTorneoId;
    const torneoId = decodeId(rawTorneoId)
    const navigate = useNavigate()
    const usuario = useAuthStore(state => state.usuario)

    const [torneo, setTorneo] = useState(null)
    const [tablaGeneral, setTablaGeneral] = useState([])
    const [tablaJornada, setTablaJornada] = useState([])
    const [jornadas, setJornadas] = useState([])
    const [jornadaSel, setJornadaSel] = useState(null)
    const [fixture, setFixture] = useState([])
    const [todasJornadas, setTodasJornadas] = useState([])
    const [jornadaFixtureSel, setJornadaFixtureSel] = useState(null)
    const [tab, setTab] = useState('general')
    const [busqueda, setBusqueda] = useState('')
    const [loading, setLoading] = useState(true)
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [modalSalir, setModalSalir] = useState(false)
    const [modalInvitar, setModalInvitar] = useState(false)
    const [copiado, setCopiado] = useState(false)
    const [copiadoCodigo, setCopiadoCodigo] = useState(false)
    const [modalAjustes, setModalAjustes] = useState(false)
    const [ajustesNombre, setAjustesNombre] = useState('')
    const [ajustesDesc, setAjustesDesc] = useState('')
    const [ajustesTipo, setAjustesTipo] = useState('PUBLICO')
    const [guardandoAjustes, setGuardandoAjustes] = useState(false)
    const [modalExpulsar, setModalExpulsar] = useState(false)
    const [jugadorAExpulsar, setJugadorAExpulsar] = useState(null)
    const [errorGlobal, setErrorGlobal] = useState('')

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
            : getTorneo(Number(torneoId));

        fetchTorneo.then(torneoData => {
            setTorneo(torneoData)
            
            // 2. Una vez que tenemos el torneo, ya sabemos su ID. 
            // Ahora sí buscamos la tabla y las jornadas.
                        Promise.allSettled([
                getTablaTorneo(torneoData.id),
                getJornadas(),
                torneoData.tipoPuntuacion === 'H2H' ? getFixtureTorneo(torneoData.id) : Promise.resolve([])
            ]).then(([tablaRes, jornadasRes, fixtureRes]) => {
                if (tablaRes.status === 'fulfilled') {
                    const deduplicated = tablaRes.value.filter((v,i,a)=>a.findIndex(t=>(t.equipoVirtualId === v.equipoVirtualId))===i);
                    setTablaGeneral(deduplicated);
                }
                let fetchedTodas = []
                let fetchedFixture = []
                
                if (jornadasRes.status === 'fulfilled') {
                    let validJornadas = jornadasRes.value
                    if (torneoData.creadoEn) {
                        const creado = new Date(torneoData.creadoEn)
                        validJornadas = validJornadas.filter(j => {
                            if (!j.fechaInicio || !j.fechaFin) return true
                            return new Date(j.fechaInicio) >= creado || new Date(j.fechaFin) >= creado
                        })
                    }
                    fetchedTodas = validJornadas
                    setTodasJornadas(fetchedTodas)
                    const finalizadas = fetchedTodas
                        .filter(j => j.estado === 'FINALIZADA')
                        .sort((a, b) => b.numero - a.numero)
                    setJornadas(finalizadas)
                    if (finalizadas.length > 0) {
                        setJornadaSel(finalizadas[0].id)
                    }
                }
                
                if (fixtureRes && fixtureRes.status === 'fulfilled') {
                    fetchedFixture = fixtureRes.value
                    setFixture(fetchedFixture)
                }

                if (fetchedFixture.length > 0) {
                    const jornadasDelFixture = fetchedTodas.filter(j => fetchedFixture.some(f => f.jornadaId === j.id));
                    const noFinalizadas = jornadasDelFixture
                        .filter(j => j.estado !== 'FINALIZADA')
                        .sort((a, b) => a.numero - b.numero)
                    if (noFinalizadas.length > 0) {
                        setJornadaFixtureSel(noFinalizadas[0].id)
                    } else if (jornadasDelFixture.length > 0) {
                        const finalizadas = jornadasDelFixture
                            .filter(j => j.estado === 'FINALIZADA')
                            .sort((a, b) => b.numero - a.numero)
                        if (finalizadas.length > 0) setJornadaFixtureSel(finalizadas[0].id)
                    }
                } else if (fetchedTodas.length > 0) {
                    const noFinalizadas = fetchedTodas
                        .filter(j => j.estado !== 'FINALIZADA')
                        .sort((a, b) => a.numero - b.numero)
                    if (noFinalizadas.length > 0) {
                        setJornadaFixtureSel(noFinalizadas[0].id)
                    } else {
                        const finalizadas = fetchedTodas
                            .filter(j => j.estado === 'FINALIZADA')
                            .sort((a, b) => b.numero - a.numero)
                        if (finalizadas.length > 0) setJornadaFixtureSel(finalizadas[0].id)
                    }
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
        if (!jornadaSel || !torneo) return
        
        getRankingJornadaTorneo(torneo.id, jornadaSel, 500).then(rankingFiltrado => {
            // El backend ya filtra y ordena correctamente los puntos según la modalidad del torneo
            setTablaJornada(rankingFiltrado.filter((v,i,a)=>a.findIndex(t=>(t.equipoVirtualId === v.equipoVirtualId))===i))
        }).catch(() => { })
    }, [jornadaSel, torneo])

    // Busqueda en las tablas
    const tablaGeneralFiltrada = useMemo(() => {
        if (!busqueda.trim()) return tablaGeneral
        const q = busqueda.toLowerCase()
        return tablaGeneral.filter(f =>
            f.nombreEquipo.toLowerCase().includes(q) ||
            f.nombreUsuario.toLowerCase().includes(q)
        )
    }, [tablaGeneral, busqueda])

    const tablaJornadaFiltrada = useMemo(() => {
        if (!busqueda.trim()) return tablaJornada
        const q = busqueda.toLowerCase()
        return tablaJornada.filter(f =>
            f.nombreEquipo.toLowerCase().includes(q) ||
            f.nombreUsuario.toLowerCase().includes(q)
        )
    }, [tablaJornada, busqueda])

    // Mi fila en la tabla activa (solo para mostrar el banner de posición, se basará en el tab en movil o general en PC)
    const miFila = useMemo(() => {
        const tabla = tab === 'jornada' ? tablaJornada : tablaGeneral
        return tabla.find(f => f.nombreUsuario === usuario?.nombreDisplay)
    }, [tab, tablaGeneral, tablaJornada, usuario])

    const handleSalir = async () => {
        try {
            await salirDeTorneo(torneo.id)
            setModalSalir(false)
            navigate('/torneos', { replace: true })
        } catch (e) {
            setErrorGlobal(e.response?.data?.mensaje ?? 'No pudiste salir del torneo.')
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

    const copiarCodigo = () => {
        navigator.clipboard.writeText(torneo?.codigoInvitacion || torneo?.codigo || '')
        setCopiadoCodigo(true)
        setTimeout(() => setCopiadoCodigo(false), 2500)
    }

    if (loading) return <LoadingSpinner mensaje="Cargando torneo..." />
    if (!torneo) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-textMuted">Torneo no encontrado.</p>
        </div>
    )

    const renderTabla = (tablaArr, isJornada) => (
        <div className="space-y-2">
            {tablaArr.length === 0 ? (
                <p className="text-textMuted text-xs text-center py-6">
                    Sin resultados.
                </p>
            ) : (
                tablaArr.map(fila => {
                    const esMiEquipo = fila.nombreUsuario === usuario?.nombreDisplay;
                    
                    // Solo son clickeables en la tabla general
                    const esClickeable = !esMiEquipo && !isJornada;
                    
                    // A dónde mandamos
                    let idJornadaLink = 'actual';
                    if (torneo?.modalidad === 'CLASICO' && jornadas.length > 0 && torneo?.tipoPuntuacion !== 'H2H') {
                        idJornadaLink = jornadas[0].id;
                    }
                    return (
                        <div
                            key={fila.equipoVirtualId}
                            onClick={() => {
                                if (esClickeable) {
                                    const idJornadaLink = torneo?.modalidad === 'DRAFT' ? 999999 : (torneo.jornadaActualId || 999999);
                                    navigate(`/v/${encodeMultiple([torneo.id, fila.equipoVirtualId, idJornadaLink])}`);
                                }
                            }}
                            className={clsx(
                                'flex items-center gap-3 p-3 rounded-2xl border',
                                esClickeable ? 'cursor-pointer hover:border-primary/50 transition-colors' : '',
                                esMiEquipo
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
                                {torneo?.tipoPuntuacion === 'H2H' && fila.puntajeGlobal !== undefined ? Math.round(fila.puntajeGlobal) : (fila.puntajeGlobal !== undefined ? fila.puntajeGlobal.toFixed(1) : (fila.puntos !== undefined ? fila.puntos.toFixed(1) : '0.0'))}
                            </span>
                        </div>
                    )
                })
            )}
        </div>
    )


        const renderFixture = (enfrentamientos) => (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
            {enfrentamientos.length === 0 ? (
                <p className="text-textMuted text-xs text-center py-6">
                    Sin partidos.
                </p>
            ) : (
                <div className="flex flex-col">
                    {enfrentamientos.map((e, index) => {
                        const localMio = e.equipoLocalId === miFila?.equipoVirtualId
                        const visitaMio = e.equipoVisitanteId === miFila?.equipoVirtualId
                        const miEnfrentamiento = localMio || visitaMio
                        
                        const handleEquipoClick = (equipoId, esMio) => {
                            if (esMio) return;
                            const idJornadaLink = torneo?.modalidad === 'DRAFT' ? 999999 : e.jornadaId;
                            navigate(`/v/${encodeMultiple([torneo.id, equipoId, idJornadaLink])}`);
                        }

                        const ganaLocal = e.procesado && e.puntajeLocal > (e.equipoVisitanteId ? e.puntajeVisitante : 0);
                        const ganaVisita = e.procesado && e.equipoVisitanteId && e.puntajeVisitante > e.puntajeLocal;

                        return (
                            <div key={e.id} className={clsx("px-3 py-2 flex flex-col gap-2 rounded-xl transition-colors", miEnfrentamiento ? "bg-primary/10 border border-primary/30" : "")}>
                                <div className="flex items-center justify-between mt-1">
                                    <div className="flex-1 flex justify-end gap-3 items-center">
                                        <span 
                                            onClick={() => handleEquipoClick(e.equipoLocalId, localMio)}
                                            className={clsx(
                                                "text-sm font-semibold text-right transition-colors",
                                                localMio ? "text-primary cursor-default" : "text-textMain hover:text-textMain/80 cursor-pointer"
                                            )}
                                        >
                                            {e.equipoLocalNombre}
                                        </span>
                                    </div>
                                      <div className="w-24 md:w-32 shrink-0">
                                          {e.procesado ? (
                                              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 md:gap-2 w-full">
                                                  <span className={clsx("text-right text-sm font-black", ganaLocal ? "text-accent" : "text-textMain")}>{Math.round(e.puntajeLocal)}</span>
                                                  <span className="text-center text-textMuted text-xs font-semibold mx-1">-</span>
                                                  <span className={clsx("text-left text-sm font-black", ganaVisita ? "text-accent" : "text-textMain")}>{e.equipoVisitanteId ? Math.round(e.puntajeVisitante) : '0'}</span>
                                              </div>
                                          ) : (
                                              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 md:gap-2 w-full">
                                                  <span className="text-right text-sm font-black text-textMuted">-</span>
                                                  <span className="text-center text-textMuted text-xs font-semibold mx-1">vs</span>
                                                  <span className="text-left text-sm font-black text-textMuted">-</span>
                                              </div>
                                          )}
                                      </div>
                                    <div className="flex-1 flex justify-start gap-3 items-center">
                                        {e.equipoVisitanteId ? (
                                            <span 
                                                onClick={() => handleEquipoClick(e.equipoVisitanteId, visitaMio)}
                                                className={clsx(
                                                    "text-sm font-semibold text-left transition-colors",
                                                    visitaMio ? "text-primary cursor-default" : "text-textMain hover:text-textMain/80 cursor-pointer"
                                                )}
                                            >
                                                {e.equipoVisitanteNombre}
                                            </span>
                                        ) : (
                                            <span className="text-sm font-semibold text-textMuted italic text-left">Fecha Libre</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
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
                    {errorGlobal && (
                        <div className="mt-2 mb-2 p-2 bg-red-500/20 border border-red-500 text-red-400 text-sm font-semibold rounded-lg">
                            {errorGlobal}
                        </div>
                    )}
                    {torneo.descripcion && (
                        <p className="text-textMuted text-xs mt-0.5 line-clamp-2">
                            {torneo.descripcion}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 overflow-x-auto no-scrollbar">
                        <span className="text-textMuted text-xs whitespace-nowrap shrink-0">
                            {torneo.cantidadParticipantes}{torneo.maxParticipantes ? `/${torneo.maxParticipantes}` : ''} participantes
                        </span>
                        <span className={clsx(
                            'text-xs font-semibold whitespace-nowrap shrink-0',
                            torneo.tipo === 'PRIVADO' ? 'text-accent' : 'text-green-400'
                        )}>
                            {torneo.tipo === 'PRIVADO' ? '🔒 Privado' : '🌐 Público'}
                        </span>
                        {torneo.modalidad === 'DRAFT' && yaParticipa && (
                            <button
                                onClick={() => {
                                    if (torneo.cantidadParticipantes < torneo.maxParticipantes) {
                                        setErrorGlobal('Los cupos del torneo deben estar llenos para entrar a la Sala de Draft.')
                                    } else {
                                        navigate(`/d/${encodeId(torneo.id)}`)
                                    }
                                }}
                                className="bg-accent text-white font-bold py-1 px-3 rounded-lg text-xs hover:bg-accent/80 transition-colors whitespace-nowrap shrink-0"
                            >
                                Entrar a Sala Draft
                            </button>
                        )}
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
                                        <>
                                            <button
                                                onClick={() => abrirAjustes()}
                                                className="w-full flex items-center gap-3 px-4 py-3
                                       text-textMain text-sm hover:bg-surface
                                       transition-colors text-left"
                                            > Ajustes
                                            </button>
                                            
                                            {/* Añadir Bot - testing draft */}
                                            {torneo.modalidad === 'DRAFT' && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            setMenuAbierto(false);
                                                            const { agregarBot } = await import('../api/torneoApi');
                                                            await agregarBot(torneo.id);
                                                            const tabla = await getTablaTorneo(torneo.id);
                                                            setTablaGeneral(tabla);
                                                            setTorneo(prev => ({
                                                                ...prev,
                                                                cantidadParticipantes: prev.cantidadParticipantes + 1
                                                            }));
                                                        } catch (e) {
                                                            setErrorGlobal(e.response?.data?.mensaje ?? "Error al añadir bot");
                                                        }
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3
                                       text-textMain text-sm hover:bg-surface
                                       transition-colors text-left border-t border-border"
                                                > Añadir Bot
                                                </button>
                                            )}
                                        </>
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
                                    > Invitar amigos
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
                                        > Salir del torneo
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
                            // Validar limite
                            if (torneo.maxParticipantes && torneo.cantidadParticipantes >= torneo.maxParticipantes) {
                                setErrorGlobal("El torneo ya está lleno.")
                                return
                            }

                            const codigo = torneo.codigo || torneo.codigoInvitacion;
                            if (!codigo) throw new Error("No se encontró el código del torneo.");

                            await unirseTorneo(codigo)
                            navigate(`/t/${encodeId(torneo.id)}`, { replace: true })
                        } catch (e) {
                            setErrorGlobal(e.response?.data?.mensaje ?? e.message ?? 'No se pudo unir al torneo.')
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
                        {torneo.tipoPuntuacion === 'H2H' ? Math.round(miFila.puntajeGlobal) : miFila.puntajeGlobal?.toFixed(1)}
                    </span>
                </div>
            )}

            {/* ── Tabs (Solo Móvil) ──────────────────── */}
            <div className="flex bg-surface rounded-xl p-1 border border-border md:hidden mb-4">
                {(torneo.tipoPuntuacion === 'H2H' ? [
                    { key: 'general', label: 'Posiciones' },
                    { key: 'fixture', label: 'Fixture' },
                ] : [
                    { key: 'general', label: 'General' },
                    { key: 'jornada', label: 'Jornada' },
                ]).map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={clsx(
                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors",
                            tab === key ? "bg-card shadow text-textMain" : "text-textMuted"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Buscador ─────────────────────────────────────────────── */}
            {torneo?.modalidad !== 'DRAFT' && (
                <input
                    type="text"
                    placeholder="Buscar por usuario o equipo..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl
                   px-4 py-2.5 text-textMain text-sm
                   placeholder-textMuted focus:outline-none focus:border-primary mb-2"
                />
            )}

            {/* ── Rankings (Desktop / Mobile Tabs) ───────────────── */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                
                {/* Columna General */}
                <div className={clsx("space-y-3", tab === 'general' ? 'block' : 'hidden md:block')}>
                    <h2 className="hidden md:block text-textMain font-bold text-lg px-1">{torneo.tipoPuntuacion === 'H2H' ? 'Tabla General' : 'Ranking General'}</h2>
                    {renderTabla(tablaGeneralFiltrada, false)}
                </div>

                {/* Columnas para Clásico / Draft (Por Puntos) */}
                {torneo.tipoPuntuacion !== 'H2H' && (
                    <div className={clsx("space-y-3", tab === 'jornada' ? 'block' : 'hidden md:block')}>
                        <h2 className="hidden md:block text-textMain font-bold text-lg px-1">Ranking Jornada</h2>
                        {todasJornadas.filter(j => j.estado === 'FINALIZADA').length > 0 ? (
                            <>
                                <JornadaSelector
                                    jornadas={todasJornadas.filter(j => j.estado === 'FINALIZADA')}
                                    selectedId={jornadaSel}
                                    onSelect={setJornadaSel}
                                />
                                {renderTabla(tablaJornadaFiltrada, true)}
                            </>
                        ) : (
                            <p className="text-textMuted text-xs text-center py-3">
                                No hay jornadas finalizadas todavía.
                            </p>
                        )}
                    </div>
                )}

                {/* Columnas para H2H */}
                {torneo.tipoPuntuacion === 'H2H' && (
                    <div className={clsx("space-y-3", tab === 'fixture' ? 'block' : 'hidden md:block')}>
                        <h2 className="hidden md:block text-textMain font-bold text-lg px-1">Fixture</h2>
                        {(() => {
                            const jornadasDelFixture = todasJornadas.filter(j => fixture.some(f => f.jornadaId === j.id));
                            if (jornadasDelFixture.length === 0) return (
                                <p className="text-textMuted text-xs text-center py-3">
                                    No hay fixture programado.
                                </p>
                            );
                            return (
                                <>
                                    <JornadaSelector
                                        jornadas={jornadasDelFixture}
                                        selectedId={jornadaFixtureSel}
                                        onSelect={setJornadaFixtureSel}
                                    />
                                    {renderFixture(fixture.filter(f => f.jornadaId === jornadaFixtureSel))}
                                </>
                            );
                        })()}
                    </div>
                )}

            </div>

            {/* ── Modal: Confirmar salir ───────────────────────────────── */}
            {modalSalir && createPortal(
                <>
                    <div className="fixed inset-0 bg-black/60 z-40"
                        onClick={() => setModalSalir(false)} />
                    <div className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md mx-auto
                          bg-card border-t border-border rounded-t-3xl md:rounded-3xl
                          z-50 p-6 space-y-4 animate-slide-up md:animate-none"
                        onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />
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
                    <div className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md mx-auto
                          bg-card border-t border-border rounded-t-3xl md:rounded-3xl
                          z-50 p-6 space-y-4 animate-slide-up md:animate-none"
                        onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />
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
                        <p className="text-textMuted text-sm pt-2">
                            O pasales este código.
                        </p>
                        <div className="bg-surface border border-border rounded-xl
                             px-4 py-3 flex items-center gap-3">
                            <p className="flex-1 text-textMuted text-xs truncate">
                                {torneo.codigoInvitacion || torneo.codigo}
                            </p>
                            <button
                                onClick={copiarCodigo}
                                className="text-primary text-sm font-semibold shrink-0"
                            >
                                {copiadoCodigo ? '✓ Copiado' : 'Copiar'}
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
                        className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md mx-auto
                 bg-card border-t border-border rounded-t-3xl md:rounded-3xl
                 z-50 p-6 space-y-4 animate-slide-up md:animate-none"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />
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
                                {torneo.modalidad === 'DRAFT' ? (
                                      <div className="w-full py-2 rounded-xl text-sm font-semibold border bg-primary/20 border-primary/40 text-primary text-center cursor-not-allowed">
                                          PRIVADO
                                      </div>
                                  ) : (
                                      ['PUBLICO', 'PRIVADO'].map(t => (
                                          <button
                                              key={t}
                                              onClick={() => setAjustesTipo(t)}
                                              className={`flex-1 py-2 rounded-xl text-sm font-semibold
                  border transition-colors
                  ${ajustesTipo === t
                                                      ? 'bg-primary border-primary text-white'
                                                      : 'bg-surface border-border text-textMuted hover:text-textMain'
                                                  }`}
                                          >
                                              {t === 'PUBLICO' ? '🌐 Público' : '🔒 Privado'}
                                          </button>
                                      ))
                                  )}
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
                    <div className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md mx-auto
                          bg-card border-t border-border rounded-t-3xl md:rounded-3xl
                          z-[70] p-6 space-y-4 animate-slide-up md:animate-none"
                        onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />
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
