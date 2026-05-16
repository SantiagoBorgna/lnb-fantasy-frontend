import { useEffect, useState, useRef } from 'react'
import { getPlantel, guardarPlantel, getEstadisticasJornada, cambiarDt, realizarTransferencia } from '../api/plantelApi'
import { getJornadaActiva, getJornadas, getPartidosJornada, getJornadaProxima } from '../api/jornadaApi'
import { getDts } from '../api/dtApi'
import SlotJugador from '../components/plantel/SlotJugador'
import JugadorModal from '../components/jugador/JugadorModal'
import JugadorStatsModal from '../components/jugador/JugadorStatsModal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import CamisetaSVG from '../components/jugador/CamisetaSVG'
import { useNavigate } from 'react-router-dom'
import { useTransferenciaStore } from '../store/transferenciaStore'
import {
    esTitular, esBanco,
    zonasDeFormacion, esCompatible
} from '../components/plantel/plantelUtils'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useAyuda } from '../hooks/useAyuda'
import ModalAyuda from '../components/ui/ModalAyuda'
import BotonAyuda from '../components/ui/BotonAyuda'
import { AYUDA } from '../components/ui/ayudaContenido'

export default function CanchitaPage() {
    const navigate = useNavigate()
    const iniciarTransferencia = useTransferenciaStore(s => s.iniciarTransferencia)

    // ── Estado principal ─────────────────────────────────────────────────────
    const [plantel, setPlantel] = useState(null)
    const [jugadores, setJugadores] = useState([])
    const [jornadaEstado, setJornadaEstado] = useState('ABIERTA_A_CAMBIOS')
    const [jornadaActiva, setJornadaActiva] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // ── Modales ──────────────────────────────────────────────────────────────
    const [jugadorModal, setJugadorModal] = useState(null)
    const [jugadorParaCambio, setJugadorParaCambio] = useState(null)
    const [jugadorStats, setJugadorStats] = useState(null)
    const [dtModal, setDtModal] = useState(false)
    const [selectorDtAberto, setSelectorDtAberto] = useState(false)

    // ── Switch de jornada (Última Fecha) ─────────────────────────────────────
    const [jornadaAnterior, setJornadaAnterior] = useState(null)
    const [jornadaVista, setJornadaVista] = useState(null)
    const [plantelVista, setPlantelVista] = useState(null)
    const [estadisticas, setEstadisticas] = useState({})
    const [loadingVista, setLoadingVista] = useState(false)

    // ── DnD ──────────────────────────────────────────────────────────────────
    const [draggingId, setDraggingId] = useState(null)
    const isDragging = useRef(false)

    const { pendienteEntrada, cancelarEntrada } = useTransferenciaStore()
    const { abierto, abrir, cerrar } = useAyuda('canchita')

    const [partidosFixture, setPartidosFixture] = useState([])

    const handleTransferenciaDesdeEntrada = async (jugadorSale) => {
        if (!pendienteEntrada) return

        if (esTitular(jugadorSale.rol)) {
            const zonas = zonasDeFormacion(plantel?.formacion)
            const titularesOrdenados = getTitularesOrdenados()
            const idxEnTitular = titularesOrdenados.findIndex(j => j.jugadorRealId === jugadorSale.jugadorRealId)

            if (!esCompatible(pendienteEntrada.posicion, zonas[idxEnTitular])) {
                setError(`${pendienteEntrada.nombreCompleto.split(',')[0]} no puede jugar como ${zonas[idxEnTitular]}.`)
                setTimeout(() => setError(''), 4500)
                cancelarEntrada()
                return
            }
        }

        try {
            await realizarTransferencia({
                jugadorSaleId: jugadorSale.jugadorRealId,
                jugadorEntraId: pendienteEntrada.id || pendienteEntrada.jugadorRealId,
                rolEntrante: jugadorSale.rol,
            })
            cancelarEntrada()
            const actualizado = await getPlantel()
            setPlantel(actualizado)
            setJugadores(actualizado.jugadores ?? [])
        } catch (e) {
            const mensajeBackend = typeof e.response?.data === 'string'
                ? e.response.data
                : (e.response?.data?.mensaje || 'Error al transferir.');
            setError(mensajeBackend)
            setTimeout(() => setError(''), 4500)
            cancelarEntrada()
        }
    }

    // ── Carga inicial ────────────────────────────────────────────────────────
    const cargarDatos = () => {
        setLoading(true)
        Promise.allSettled([
            getPlantel(),
            getJornadaActiva(),
            getJornadaProxima(), // <-- Agregamos esta llamada
            getJornadas(),
        ]).then(([plantelRes, activaRes, proximaRes, jornadasRes]) => {
            if (plantelRes.status === 'fulfilled' && plantelRes.value) {
                setPlantel(plantelRes.value)
                setJugadores(plantelRes.value.jugadores ?? [])
            }

            // Lógica inteligente: Si no hay activa, usamos la próxima
            const jornadaActualData = (activaRes.status === 'fulfilled' && activaRes.value)
                ? activaRes.value
                : (proximaRes.status === 'fulfilled' ? proximaRes.value : null);

            if (jornadaActualData) {
                setJornadaEstado(jornadaActualData.estado)
                setJornadaActiva(jornadaActualData)
            }

            if (jornadasRes.status === 'fulfilled') {
                const jActivaId = jornadaActualData?.id
                const anterior = jornadasRes.value
                    .filter(j => j.estado === 'FINALIZADA' && j.id !== jActivaId)
                    .sort((a, b) => b.numero - a.numero)[0]
                setJornadaAnterior(anterior ?? null)
            }
        }).finally(() => setLoading(false))
    }

    useEffect(() => { cargarDatos() }, [])

    useEffect(() => {
        const recargarAlVolver = () => {
            if (!useTransferenciaStore.getState().pendiente) cargarDatos()
        }
        window.addEventListener('focus', recargarAlVolver)
        return () => window.removeEventListener('focus', recargarAlVolver)
    }, [])

    useEffect(() => {
        const jid = jornadaVista ?? jornadaActiva?.id
        if (!jid) return

        // Traer estadísticas
        if (jornadaEstado !== 'ABIERTA_A_CAMBIOS' || jornadaVista !== null) {
            getEstadisticasJornada(jid).then(lista => {
                const mapa = {}
                lista.forEach(e => { mapa[e.jugadorRealId] = e })
                setEstadisticas(mapa)
            }).catch(() => { })
        }

        // Traer el fixture de esta jornada
        getPartidosJornada(jid)
            .then(setPartidosFixture)
            .catch(() => setPartidosFixture([]))

    }, [jornadaVista, jornadaActiva, jornadaEstado])

    useEffect(() => {
        if (jornadaVista === null) {
            setPlantelVista(null)
            return
        }
        setLoadingVista(true)
        import('../api/plantelApi').then(({ getPlantelJornada }) => {
            getPlantelJornada(jornadaVista)
                .then(data => setPlantelVista(data))
                .catch(() => setPlantelVista(null))
                .finally(() => setLoadingVista(false))
        })
    }, [jornadaVista])

    // ── Autoguardado silencioso ──────────────────────────────────────────────
    // ── Autoguardado silencioso ──────────────────────────────────────────────
    const autoGuardar = async (nuevosJugadores, nuevaFormacion) => {
        const formacionFinal = nuevaFormacion || plantel.formacion;
        try {
            if (nuevaFormacion) setPlantel(prev => ({ ...prev, formacion: formacionFinal }));

            await guardarPlantel({
                dtId: plantel.dt?.dtId,
                formacion: formacionFinal,
                jugadores: nuevosJugadores.map(j => ({
                    jugadorRealId: j.jugadorRealId,
                    rol: j.rol,
                }))
            })
        } catch (e) {
            // ¡ACÁ ESTÁ EL FIX! Ahora leemos el error real de tu Spring Boot
            const mensajeBackend = typeof e.response?.data === 'string'
                ? e.response.data
                : (e.response?.data?.mensaje || 'Error al guardar la alineación en el servidor.');

            setError(mensajeBackend);
            setTimeout(() => setError(''), 4500);
            cargarDatos(); // Revertimos al estado válido si el backend rebotó la formación
        }
    }

    // ── MAGIA: Cambio de formación inteligente ───────────────────────────────
    const handleCambiarFormacion = (nuevaForm) => {
        if (nuevaForm === plantel.formacion) return;

        const zonas = zonasDeFormacion(nuevaForm);
        let disponibles = [...jugadores];
        let nuevosTitulares = [];

        // 1. Intentamos llenar las 5 posiciones que pide la nueva formación
        let esPosible = true;
        for (let zona of zonas) {
            const idx = disponibles.findIndex(j => esCompatible(j.posicion, zona));
            if (idx !== -1) {
                nuevosTitulares.push(disponibles[idx]);
                disponibles.splice(idx, 1); // Lo sacamos del pool
            } else {
                esPosible = false;
                break;
            }
        }

        // Si no tenemos jugadores compatibles (ej: pide 3 bases y tenemos 2), tiramos error
        if (!esPosible) {
            setError(`No tenés los jugadores necesarios en tu plantel para formar un ${nuevaForm}.`);
            setTimeout(() => setError(''), 4500);
            return;
        }

        // 2. Éxito: reasignamos los roles (respetando al capitán si quedó titular)
        let capitanAsignado = false;
        nuevosTitulares = nuevosTitulares.map(j => {
            if (j.rol === 'CAPITAN') {
                capitanAsignado = true;
                return { ...j, rol: 'CAPITAN' };
            }
            return { ...j, rol: 'TITULAR' };
        });

        // Si el capitán anterior se fue al banco, nombramos a uno nuevo al azar
        if (!capitanAsignado && nuevosTitulares.length > 0) {
            nuevosTitulares[0].rol = 'CAPITAN';
        }

        // 3. Los 5 restantes van al banco
        let sextoAsignado = false;
        let nuevosSuplentes = disponibles.map(j => {
            if (j.rol === 'SEXTO_HOMBRE') {
                sextoAsignado = true;
                return { ...j, rol: 'SEXTO_HOMBRE' };
            }
            return { ...j, rol: 'SUPLENTE' };
        });

        if (!sextoAsignado && nuevosSuplentes.length > 0) {
            nuevosSuplentes[0].rol = 'SEXTO_HOMBRE';
        }

        const nuevoPlantel = [...nuevosTitulares, ...nuevosSuplentes];
        setJugadores(nuevoPlantel);
        autoGuardar(nuevoPlantel, nuevaForm);
    }

    const handleCambiarDt = async (nuevoDt) => {
        try {
            await cambiarDt(nuevoDt.id)
            cargarDatos()
        } catch (e) {
            setError(e.response?.data?.mensaje ?? 'Error al cambiar de DT.')
            setTimeout(() => setError(''), 3000)
        } finally {
            setSelectorDtAberto(false)
        }
    }

    // ── Funciones Core ───────────────────────────────────────────────────────
    const esPlantelAdelantado = plantel && jornadaActiva && plantel.jornadaNumero > jornadaActiva.numero;
    const modoLectura = (jornadaEstado !== 'ABIERTA_A_CAMBIOS' && !esPlantelAdelantado) || jornadaVista !== null;
    const plantelActual = jornadaVista !== null ? plantelVista : plantel
    const jugadoresActuales = jornadaVista !== null ? (plantelVista?.jugadores ?? []) : jugadores

    const getTitularesOrdenados = () => {
        const titularesSinOrdenar = jugadoresActuales.filter(j => esTitular(j.rol))
        const zonas = zonasDeFormacion(plantelActual?.formacion) || []
        const ordenados = []
        const disponibles = [...titularesSinOrdenar]

        zonas.forEach(zona => {
            const index = disponibles.findIndex(j => esCompatible(j.posicion, zona))
            if (index !== -1) {
                ordenados.push(disponibles[index])
                disponibles.splice(index, 1)
            }
        })
        ordenados.push(...disponibles)
        return ordenados
    }

    const handleDragStart = (id) => {
        if (modoLectura) return
        isDragging.current = true
        setDraggingId(id)
    }

    const handleDrop = (targetId) => {
        if (modoLectura || !draggingId || draggingId === targetId) {
            setDraggingId(null)
            return
        }

        const origenIdx = jugadores.findIndex(j => j.jugadorRealId === draggingId)
        const destinoIdx = jugadores.findIndex(j => j.jugadorRealId === targetId)
        const origen = jugadores[origenIdx]
        const destino = jugadores[destinoIdx]

        if (esTitular(destino.rol)) {
            const zonas = zonasDeFormacion(plantel?.formacion)
            const titularesOrdenados = getTitularesOrdenados()
            const idxEnTitular = titularesOrdenados.findIndex(j => j.jugadorRealId === targetId)
            if (!esCompatible(origen.posicion, zonas[idxEnTitular])) {
                setError(`${origen.nombreCompleto.split(',')[0]} no puede jugar en esa posición.`)
                setTimeout(() => setError(''), 3000)
                setDraggingId(null)
                setTimeout(() => { isDragging.current = false }, 100)
                return
            }
        }

        const nueva = [...jugadores]
        if (esTitular(origen.rol) && esTitular(destino.rol)) {
            nueva[origenIdx] = { ...destino, rol: destino.rol }
            nueva[destinoIdx] = { ...origen, rol: origen.rol }
        } else {
            nueva[origenIdx] = { ...destino, rol: origen.rol }
            nueva[destinoIdx] = { ...origen, rol: destino.rol }
        }

        setJugadores(nueva)
        setDraggingId(null)
        setTimeout(() => { isDragging.current = false }, 100)
        autoGuardar(nueva)
    }

    const debeOpacar = (targetId) => {
        if (modoLectura) return false

        if (pendienteEntrada) {
            const destino = jugadoresActuales.find(j => j.jugadorRealId === targetId)
            if (!destino) return false
            if (esTitular(destino.rol)) {
                const zonas = zonasDeFormacion(plantel?.formacion)
                const titularesOrdenados = getTitularesOrdenados()
                const idxEnTitular = titularesOrdenados.findIndex(j => j.jugadorRealId === targetId)
                return !esCompatible(pendienteEntrada.posicion, zonas[idxEnTitular])
            }
            return false
        }

        if (!draggingId || draggingId === targetId) return false
        const origen = jugadoresActuales.find(j => j.jugadorRealId === draggingId)
        const destino = jugadoresActuales.find(j => j.jugadorRealId === targetId)
        if (!origen || !destino) return false

        if (esTitular(destino.rol)) {
            const zonas = zonasDeFormacion(plantel?.formacion)
            const titularesOrdenados = getTitularesOrdenados()
            const idxEnTitular = titularesOrdenados.findIndex(j => j.jugadorRealId === targetId)
            return !esCompatible(origen.posicion, zonas[idxEnTitular])
        }

        if (esTitular(origen.rol) && esBanco(destino.rol)) {
            const zonas = zonasDeFormacion(plantel?.formacion)
            const titularesOrdenados = getTitularesOrdenados()
            const idx = titularesOrdenados.findIndex(j => j.jugadorRealId === draggingId)
            return !esCompatible(destino.posicion, zonas[idx])
        }
        return false
    }

    const handleClickSlot = (jugador) => {
        // En celulares evitamos que se dispare si venían arrastrando (falso positivo)
        if (isDragging.current) {
            setTimeout(() => { isDragging.current = false }, 100)
            return
        }

        if (pendienteEntrada && !modoLectura) {
            handleTransferenciaDesdeEntrada(jugador)
            return
        }

        if (modoLectura) {
            const stats = estadisticas[jugador.jugadorRealId] ?? null
            setJugadorStats({ jugador, stats })
        } else {
            setJugadorModal(jugador)
        }
    }

    const hacerCapitan = (elegido) => {
        if (!esTitular(elegido.rol)) return
        const nueva = jugadores.map(j => {
            if (j.jugadorRealId === elegido.jugadorRealId) return { ...j, rol: 'CAPITAN' }
            if (j.rol === 'CAPITAN') return { ...j, rol: 'TITULAR' }
            return j
        })
        setJugadores(nueva)
        autoGuardar(nueva)
    }

    const abrirCambio = (jugador) => {
        setJugadorModal(null)
        setJugadorParaCambio(jugador)
    }

    const ejecutarCambio = (destino) => {
        const nueva = jugadores.map(j => {
            if (j.jugadorRealId === jugadorParaCambio.jugadorRealId) return { ...destino, rol: jugadorParaCambio.rol }
            if (j.jugadorRealId === destino.jugadorRealId) return { ...jugadorParaCambio, rol: destino.rol }
            return j
        })
        setJugadores(nueva)
        setJugadorParaCambio(null)
        autoGuardar(nueva)
    }

    const handleTransferir = (jugador) => {
        const zonas = zonasDeFormacion(plantel?.formacion)
        const titulares = getTitularesOrdenados()
        const idxTitular = titulares.findIndex(
            j => j.jugadorRealId === jugador.jugadorRealId
        )
        const zona = esTitular(jugador.rol)
            ? (zonas[idxTitular] ?? null)
            : null

        iniciarTransferencia({
            jugadorSaleId: jugador.jugadorRealId,
            rolSaliente: jugador.rol,
            posicion: jugador.posicion,
            zona,
            nombreSale: jugador.nombreCompleto,
            valorSale: jugador.valorMercadoActual
        })
        navigate('/mercado')
    }

    // ── Render ───────────────────────────────────────────────────────────────
    if (loading) return <LoadingSpinner mensaje="Cargando tu plantel..." />

    // 1. Extraemos los Tabs a una constante para que no desaparezcan en los estados vacíos
    const TabsJornada = jornadaAnterior && (
        <div className="flex bg-surface rounded-xl p-1 border border-border mx-auto mb-2">
            <button onClick={() => setJornadaVista(null)} className={clsx("flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors", !jornadaVista ? "bg-card shadow text-textMain" : "text-textMuted")}>
                Jornada Actual
            </button>
            <button onClick={() => setJornadaVista(jornadaAnterior.id)} className={clsx("flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors", jornadaVista ? "bg-card shadow text-textMain" : "text-textMuted")}>
                Última Fecha
            </button>
        </div>
    );

    // 2. Manejamos los estados vacíos de forma inteligente
    if (!plantelActual) {
        return (
            <div className="max-w-md mx-auto w-full px-4 space-y-3 pb-6 min-h-screen pt-4">
                {TabsJornada}

                <div className="pt-16">
                    {jornadaVista !== null ? (
                        <EmptyState
                            titulo="Sin participación"
                            descripcion="No jugaste en la jornada anterior."
                        // Sin botón de acción
                        />
                    ) : (
                        <EmptyState
                            titulo="Sin plantel"
                            descripcion="Todavía no armaste tu equipo."
                            accion={{ label: 'Ir al Mercado', onClick: () => navigate('/mercado') }}
                        />
                    )}
                </div>
            </div>
        )
    }

    const titulares = getTitularesOrdenados()
    const banco = jugadoresActuales.filter(j => esBanco(j.rol))
    const sexto = banco.find(j => j.rol === 'SEXTO_HOMBRE')
    const suplentes = banco.filter(j => j.rol === 'SUPLENTE')
    const bancofila1 = [sexto, ...suplentes.slice(0, 2)].filter(Boolean)
    const bancofila2 = suplentes.slice(2, 4)

    const filas = []
    let cursor = 0
    plantelActual.formacion?.split('-').forEach(n => {
        filas.push(titulares.slice(cursor, cursor + Number(n)))
        cursor += Number(n)
    })

    let puntajeEnVivo = plantelActual.puntajeObtenidoFecha ?? 0
    if (modoLectura && Object.keys(estadisticas).length > 0) {
        let sum = 0
        jugadoresActuales.forEach(j => {
            const s = estadisticas[j.jugadorRealId]
            if (s && s.jugó) {
                sum += (s.puntajeFantasy * j.multiplicador)
            }
        })
        if (plantelActual.puntajeDt != null) {
            sum += plantelActual.puntajeDt
        }
        puntajeEnVivo = sum
    }

    return (
        <div className="max-w-md mx-auto w-full px-4 space-y-3 pb-6 min-h-screen pt-4">

            {TabsJornada}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-textMain font-bold text-xl truncate max-w-[180px]">
                        {plantelActual.nombreEquipo ?? 'Mi Equipo'}
                    </h1>

                    {/* Selector de formación con auto-alineación */}
                    <div className="flex items-center gap-2 mt-1">
                        {!modoLectura ? (
                            <select
                                className="bg-surface border border-border text-xs text-textMain rounded pl-2 pr-6 py-1 outline-none cursor-pointer focus:border-primary"
                                value={plantelActual.formacion}
                                onChange={(e) => handleCambiarFormacion(e.target.value)}
                            >
                                <option value="1-2-2">1-2-2</option>
                                <option value="1-3-1">1-3-1</option>
                                <option value="2-1-2">2-1-2</option>
                                <option value="2-2-1">2-2-1</option>
                                <option value="3-1-1">3-1-1</option>
                            </select>
                        ) : (
                            <span className="text-textMuted text-xs">{plantelActual.formacion}</span>
                        )}
                        {!modoLectura && (
                            <span className="text-textMuted text-xs">· {plantelActual.transferenciasRestantes} transferencias</span>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    {modoLectura ? (
                        <div className="text-right">
                            <p className="text-accent font-bold text-lg">
                                {puntajeEnVivo.toFixed(1)} pts
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-accent font-bold text-lg">{plantel?.presupuestoRestante?.toFixed(1)} cr</p>
                            <p className="text-textMuted text-xs">disponibles</p>
                        </>
                    )}
                </div>
                <BotonAyuda onClick={abrir} />
            </div>

            {/* ── Banners de estado de la jornada ── */}
            {modoLectura && jornadaVista === null && (
                <div className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-center mt-2 bg-red-900/30 border border-red-700/50 text-red-400">
                    🔴 Jornada en juego — no se permiten cambios
                </div>
            )}

            {modoLectura && jornadaVista !== null && (
                <div className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-center mt-2 bg-surface border border-border text-textMuted">
                    📋 Mostrando estadísticas de la Jornada {jornadaAnterior?.numero ?? ''}
                </div>
            )}

            {!modoLectura && esPlantelAdelantado && jornadaVista === null && (
                <div className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-center mt-2 bg-green-900/30 border border-green-700/50 text-green-400">
                    🟢 Mercado abierto para tu debut (Jornada {plantel.jornadaNumero})
                </div>
            )}

            {plantelActual.dt && (
                <div
                    className={clsx("card flex items-center gap-3 py-2", !modoLectura && "cursor-pointer active:scale-95 transition-transform hover:border-primary")}
                    onClick={() => !modoLectura && setDtModal(true)}
                >
                    <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">DT</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-textMain font-semibold text-sm truncate">{plantelActual.dt.nombreCompleto}</p>
                        <p className="text-textMuted text-xs">{plantelActual.dt.equipoSigla}</p>
                    </div>
                    {modoLectura && plantelActual?.puntajeDt != null && (
                        <div className="flex flex-col items-end shrink-0">
                            <span className={`font-black text-lg tabular-nums ${plantelActual.puntajeDt >= 0 ? 'text-accent' : 'text-red-400'
                                }`}>
                                {plantelActual.puntajeDt > 0 ? '+' : ''}
                                {plantelActual.puntajeDt?.toFixed(1)}
                            </span>
                            <span className="text-textMuted text-xs">pts DT</span>
                        </div>
                    )}
                    {!modoLectura && <span className="text-xs text-primary font-semibold pr-2">Cambiar →</span>}
                </div>
            )}

            {pendienteEntrada && (
                <div className="bg-primary/20 border border-primary rounded-2xl
                 px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">👇</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-primary font-semibold text-sm">
                            ¿Quién sale por {pendienteEntrada.nombreCompleto.split(',')[0]}? <span className="opacity-75 font-normal text-xs ml-1">({pendienteEntrada.posicion})</span>
                        </p>
                        <p className="text-textMuted text-xs">
                            Tocá el jugador que querés reemplazar
                        </p>
                    </div>
                    <button
                        onClick={cancelarEntrada}
                        className="text-textMuted text-sm shrink-0"
                    >
                        Cancelar
                    </button>
                </div>
            )}

            {loadingVista ? <LoadingSpinner mensaje="Cargando jornada..." /> : (
                <div className="relative rounded-3xl overflow-hidden shadow-inner border border-black/10" style={{ backgroundColor: '#e29b5a', backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.06) 40px, rgba(0,0,0,0.06) 80px)' }}>

                    <div className="absolute inset-0 pointer-events-none border-2 border-black/50 m-2">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[88%] max-w-[340px] h-[280px] border-x-2 border-t-2 border-black/50 rounded-t-[150px]" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[130px] h-[190px] border-x-2 border-t-2 border-black/50 bg-black/5" />
                        <div className="absolute bottom-[190px] left-1/2 -translate-x-1/2 translate-y-1/2 w-[120px] h-[120px] border-2 border-black/50 rounded-full" />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-1 bg-black/60" />
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-5 h-5 border-2 border-black/60 rounded-full" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140px] h-[70px] border-x-2 border-b-2 border-black/50 rounded-b-[70px]" />
                    </div>

                    <div className="relative z-10 py-6 px-1 flex flex-col justify-between h-[500px]">
                        {filas.map((fila, filaIdx) => (
                            <div key={filaIdx} className="flex justify-center gap-x-8 items-start">
                                {fila.map((jugador) => {
                                    const stats = estadisticas[jugador.jugadorRealId]
                                    return (
                                        <SlotJugador
                                            key={jugador.jugadorRealId}
                                            jugador={jugador}
                                            opaco={debeOpacar(jugador.jugadorRealId)}
                                            puntosJornada={modoLectura
                                                ? (stats?.jugó ? (stats.puntajeFantasy * jugador.multiplicador) : null)
                                                : undefined
                                            }
                                            onClick={() => handleClickSlot(jugador)} // <-- ¡ACÁ ESTÁ EL FIX MÓVIL!
                                            onDragStart={() => handleDragStart(jugador.jugadorRealId)}
                                            onDrop={() => handleDrop(jugador.jugadorRealId)}
                                        />
                                    )
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-textMuted text-xs font-semibold uppercase tracking-wider mb-4 pl-2 text-center">Banco de Suplentes</h2>
                <div className="space-y-6">
                    <div className="flex justify-center gap-x-8">
                        {bancofila1.map((jugador) => {
                            const stats = estadisticas[jugador.jugadorRealId]
                            return (
                                <SlotJugador
                                    key={jugador.jugadorRealId}
                                    jugador={jugador}
                                    esSexto={jugador.rol === 'SEXTO_HOMBRE'}
                                    opaco={debeOpacar(jugador.jugadorRealId)}
                                    puntosJornada={modoLectura
                                        ? (stats?.jugó ? (stats.puntajeFantasy * jugador.multiplicador) : null)
                                        : undefined
                                    }
                                    onClick={() => handleClickSlot(jugador)} // <-- ¡ACÁ TAMBIÉN!
                                    onDragStart={() => handleDragStart(jugador.jugadorRealId)}
                                    onDrop={() => handleDrop(jugador.jugadorRealId)}
                                />)
                        })}
                    </div>
                    {bancofila2.length > 0 && (
                        <div className="flex justify-center gap-x-8">
                            {bancofila2.map((jugador) => {
                                const stats = estadisticas[jugador.jugadorRealId]
                                return (
                                    <SlotJugador
                                        key={jugador.jugadorRealId}
                                        jugador={jugador}
                                        esSexto={jugador.rol === 'SEXTO_HOMBRE'}
                                        opaco={debeOpacar(jugador.jugadorRealId)}
                                        puntosJornada={modoLectura
                                            ? (stats?.jugó ? (stats.puntajeFantasy * jugador.multiplicador) : null)
                                            : undefined
                                        }
                                        onClick={() => handleClickSlot(jugador)} // <-- ¡Y ACÁ!
                                        onDragStart={() => handleDragStart(jugador.jugadorRealId)}
                                        onDrop={() => handleDrop(jugador.jugadorRealId)}
                                    />)
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Fixture de la Jornada ── */}
            {partidosFixture.length > 0 && (
                <div className="mt-12 mb-6">
                    <h2 className="text-textMuted text-sm font-bold uppercase tracking-wider mb-5 pl-2 text-center">
                        Fixture de la Jornada {jornadaVista ? jornadaAnterior?.numero : (plantelActual.jornadaNumero ?? '')}
                    </h2>
                    <div className="space-y-2">
                        {partidosFixture.map(partido => {
                            // 1. Creamos la fecha base tal cual viene de la DB
                            const fecha = new Date(partido.fechaHora)

                            // 2. Le sumamos las 3 horas de desfasaje de tu servidor
                            fecha.setHours(fecha.getHours() + 3)

                            const diaStr = fecha.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' }).replace(',', '')

                            // 3. Forzamos formato 24hs apagando el 'hour12'
                            const horaStr = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })

                            const terminado = partido.estado === 'FINALIZADO' || partido.estado === 'PROCESADO'

                            return (
                                <div key={partido.id} className="bg-surface border border-border rounded-xl p-3 flex flex-col gap-2">
                                    <div className="flex justify-between items-center text-[10px] font-bold text-textMuted uppercase tracking-wider">
                                        <span>{diaStr} - {horaStr} hs</span>
                                        <span className={terminado ? 'text-accent' : 'text-primary'}>
                                            {terminado ? 'Finalizado' : 'Programado'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex-1 flex justify-end gap-3 items-center">
                                            <span className="text-sm font-semibold text-textMain">{partido.siglaLocal}</span>
                                        </div>
                                        <div className="w-16 text-center shrink-0">
                                            {terminado ? (
                                                <span className="text-sm font-black text-accent tracking-widest">
                                                    {partido.puntosLocal} - {partido.puntosVisitante}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-textMuted px-2 py-1 bg-card rounded-md">VS</span>
                                            )}
                                        </div>
                                        <div className="flex-1 flex justify-start gap-3 items-center">
                                            <span className="text-sm font-semibold text-textMain">{partido.siglaVisitante}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {error && <div className="bg-red-900/40 border border-red-700 text-red-400 rounded-2xl px-4 py-3 text-sm text-center">{error}</div>}

            <JugadorModal
                jugador={jugadorModal}
                esTitularActual={jugadorModal ? ['TITULAR', 'CAPITAN'].includes(jugadorModal.rol) : false}
                onCerrar={() => setJugadorModal(null)}
                onHacerCapitan={jugadorModal && esTitular(jugadorModal.rol) ? hacerCapitan : null}
                onCambiar={jugadorModal ? abrirCambio : null}
                onTransferir={jugadorModal && !modoLectura ? handleTransferir : null}
            />

            {jugadorStats && (
                <JugadorStatsModal jugador={jugadorStats.jugador} stats={jugadorStats.stats} onCerrar={() => setJugadorStats(null)} />
            )}

            {jugadorParaCambio && (
                <CambioModal
                    jugadorOrigen={jugadorParaCambio}
                    titulares={titulares}
                    banco={banco}
                    onElegir={ejecutarCambio}
                    onCerrar={() => setJugadorParaCambio(null)}
                />
            )}

            {dtModal && (
                <DtOpcionesModal
                    dt={plantel.dt}
                    onCerrar={() => setDtModal(false)}
                    onTransferir={() => { setDtModal(false); setSelectorDtAberto(true); }}
                />
            )}

            {selectorDtAberto && (
                <ListaDtsModal dtActualId={plantel.dt?.dtId} onElegir={handleCambiarDt} onCerrar={() => setSelectorDtAberto(false)} />
            )}

            <ModalAyuda pagina="canchita" contenido={AYUDA.canchita} onCerrar={cerrar} abierto={abierto} />
        </div>
    )
}

function CambioModal({ jugadorOrigen, titulares, banco, onElegir, onCerrar }) {
    const esOrigenTitular = ['TITULAR', 'CAPITAN'].includes(jugadorOrigen.rol)
    const candidatos = esOrigenTitular ? banco : titulares

    const compatibles = candidatos.filter(candidato => {
        const t = esOrigenTitular ? jugadorOrigen : candidato
        const s = esOrigenTitular ? candidato : jugadorOrigen
        return s.posicion === t.posicion ||
            (t.posicion === 'BASE' && s.posicion === 'ESCOLTA') ||
            (t.posicion === 'ESCOLTA' && s.posicion === 'BASE') ||
            (t.posicion === 'ALERO' && s.posicion === 'ALA_PIVOT') ||
            (t.posicion === 'ALA_PIVOT' && s.posicion === 'ALERO')
    })

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onCerrar} />
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border rounded-t-3xl z-50 p-6 space-y-4 animate-slide-up">
                <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                <h3 className="text-textMain font-bold text-lg">Cambiar a {jugadorOrigen.nombreCompleto.split(',')[0]}</h3>
                {compatibles.length === 0 ? (
                    <p className="text-textMuted text-sm text-center py-4">No hay jugadores compatibles para este cambio.</p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {compatibles.map(s => (
                            <button key={s.jugadorRealId} onClick={() => onElegir(s)} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border hover:border-primary transition-colors text-left">
                                <CamisetaSVG colorPrincipal={s.colorPrincipal} colorSecundario={s.colorSecundario} numero={s.numeroCamiseta} estado={s.estado} modelo={s.modeloCamiseta} size={40} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-textMain font-semibold text-sm truncate">{s.nombreCompleto}</p>
                                    <p className="text-textMuted text-xs">{s.equipoSigla} · {s.posicion}</p>
                                </div>
                                <span className="text-accent text-sm font-semibold shrink-0">Entrar →</span>
                            </button>
                        ))}
                    </div>
                )}
                <button onClick={onCerrar} className="w-full py-2 text-textMuted text-sm">Cancelar</button>
            </div>
        </>
    )
}

// ... las demás funciones (DtOpcionesModal y ListaDtsModal) quedan exactamente igual
function DtOpcionesModal({ dt, onCerrar, onTransferir }) { /* ... código intacto ... */
    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onCerrar} />
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border rounded-t-3xl z-50 p-6 space-y-5 animate-slide-up">
                <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md">DT</div>
                    <h3 className="text-textMain font-bold text-lg">{dt?.nombreCompleto}</h3>
                    <p className="text-textMuted text-sm">{dt?.equipoSigla}</p>
                </div>
                <div className="space-y-3 pt-2">
                    <button onClick={onTransferir} className="w-full py-3 px-4 rounded-xl font-bold bg-transparent border-2 border-accent text-accent active:scale-95 transition-transform flex justify-center items-center gap-2">
                        Transferir DT
                    </button>
                    <p className="text-textMuted text-xs text-center pb-2">Consume 1 transferencia</p>
                    <button onClick={onCerrar} className="w-full py-2 text-textMuted text-sm font-medium">Cancelar</button>
                </div>
            </div>
        </>
    )
}

function ListaDtsModal({ dtActualId, onElegir, onCerrar }) { /* ... código intacto ... */
    const [dts, setDts] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getDts().then(data => {
            setDts(data.filter(dt => dt.id !== dtActualId))
        }).finally(() => setLoading(false))
    }, [dtActualId])

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onCerrar} />
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border rounded-t-3xl z-50 p-6 space-y-4 animate-slide-up max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="shrink-0 space-y-4 pb-2 border-b border-border">
                    <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                    <div><h3 className="text-textMain font-bold text-lg">Elegir reemplazo</h3><p className="text-textMuted text-xs">Seleccioná un nuevo DT para tu equipo.</p></div>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0 space-y-2 py-2 pr-1">
                    {loading ? <LoadingSpinner /> : dts.map(dt => (
                        <button key={dt.id} onClick={() => onElegir(dt)} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border hover:border-primary transition-colors text-left active:scale-[0.98]">
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">DT</div>
                            <div className="flex-1 min-w-0"><p className="text-textMain font-semibold text-sm truncate">{dt.nombreCompleto}</p><p className="text-textMuted text-xs">{dt.equipoNombre} · {dt.nacionalidad}</p></div>
                            <span className="text-accent text-sm font-semibold">Contratar</span>
                        </button>
                    ))}
                </div>
                <div className="shrink-0 pt-2 border-t border-border"><button onClick={onCerrar} className="w-full py-2 text-textMuted text-sm font-medium">Cancelar</button></div>
            </div>
        </>,
        document.body
    )
}