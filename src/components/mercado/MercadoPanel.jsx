import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getMercadoJugadores, getMercadoLibres, getJugadorStats } from '../../api/mercadoApi'
import { getPlantel, realizarTransferencia } from '../../api/plantelApi'
import LoadingSpinner from '../ui/LoadingSpinner'
import EmptyState from '../ui/EmptyState'
import CamisetaSVG from '../jugador/CamisetaSVG'
import { useDraftStore } from '../../store/draftStore'
import { useTransferenciaStore } from '../../store/transferenciaStore'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import { useAyuda } from '../../hooks/useAyuda'
import ModalAyuda from '../ui/ModalAyuda'
import BotonAyuda from '../ui/BotonAyuda'
import { AYUDA } from '../ui/ayudaContenido'
import { useGameStore } from '../../store/gameStore'
import { useAuthStore } from '../../store/authStore'
import SeleccionarSalienteModal from './SeleccionarSalienteModal'
import ConfirmarTransferenciaModal from './ConfirmarTransferenciaModal'
import AlertModal from '../ui/AlertModal'

const ZONA_LABEL = {
    GUARD: 'Base / Escolta',
    FORWARD: 'Alero / Ala-Pívot',
    CENTER: 'Pívot',
    BASE: 'Base',
    ESCOLTA: 'Escolta',
    ALERO: 'Alero',
    ALA_PIVOT: 'Ala-Pívot',
    PIVOT: 'Pívot'
}

import { useUiStore } from '../../store/uiStore'

const POSICIONES = [
    { label: 'Todos', valor: null },
    { label: 'Bases', valor: 'BASE' },
    { label: 'Escoltas', valor: 'ESCOLTA' },
    { label: 'Aleros', valor: 'ALERO' },
    { label: 'Ala-Pivot', valor: 'ALA_PIVOT' },
    { label: 'Pivots', valor: 'PIVOT' },
    { label: 'DT', valor: 'DT' }
]

const ESTADO_CONFIG = {
    DISPONIBLE: { label: 'Disponible', color: 'text-green-400' },
    DUDA: { label: 'Duda', color: 'text-yellow-400' },
    LESIONADO: { label: 'Lesionado', color: 'text-red-400' },
    SUSPENDIDO: { label: 'Suspendido', color: 'text-purple-400' },
}

export default function MercadoPanel({ onActionComplete, layout = 'full' }) {
    const { contextoActual } = useGameStore()
    const [busqueda, setBusqueda] = useState('')
    const [debouncedBusqueda, setDebouncedBusqueda] = useState('')
    const [orden, setOrden] = useState(contextoActual ? 'promedio_desc' : 'precio_desc')
    const [filtroEstadoTraspasos, setFiltroEstadoTraspasos] = useState('TODAS')

    const [ejecutandoTransferencia, setEjecutandoTransferencia] = useState(false)
    const [errorTransferencia, setErrorTransferencia] = useState('')
    const [jugadorAConfirmar, setJugadorAConfirmar] = useState(null)

    const [listaPrioridad, setListaPrioridad] = useState([])

    const store = useDraftStore()
    const { slotPendiente, asignarJugador } = store
    const navigate = useNavigate()
    const { usuario } = useAuthStore()
    const { showToast } = useUiStore()
    const queryClient = useQueryClient()

    const [modalJugador, setModalJugador] = useState(null)  // jugadorMercadoDto
    const [statsModal, setStatsModal] = useState(null)  // JugadorStatsResumenDto
    const [alertConfig, setAlertConfig] = useState({ isOpen: false, titulo: '', mensaje: '' })

    const [jugadorEntranteParaCambio, setJugadorEntranteParaCambio] = useState(null)
    const [loadingStatsModal, setLoadingStatsModal] = useState(false)

    const { iniciarDesdeEntrada, iniciarTransferencia } = useTransferenciaStore()

    const iniciarTransferenciaDesdeEntrada = (jugador) => {
        if (contextoActual) {
            setJugadorEntranteParaCambio(jugador)
        } else {
            iniciarDesdeEntrada(jugador)
            if (onActionComplete) onActionComplete()
            else navigate('/canchita')
        }
    }

    const {
        pendiente: transferenciaPendiente,
        cancelarTransferencia,
    } = useTransferenciaStore()

    const modoAsignacion = !!slotPendiente
    const modoTransferencia = !!transferenciaPendiente

    const { abierto, abrir, cerrar } = useAyuda('mercado', layout === 'page')

    const [esFaseRestringida, setEsFaseRestringida] = useState(false)
    const [misReclamos, setMisReclamos] = useState([])
    const [transacciones, setTransacciones] = useState([])
    const [transaccionesPage, setTransaccionesPage] = useState(0)
    const [hasMoreTransacciones, setHasMoreTransacciones] = useState(false)
    const [loadingTransacciones, setLoadingTransacciones] = useState(false)
    const [ordenPrioridad, setOrdenPrioridad] = useState(null)
    const [activeTab, setActiveTab] = useState('agencia') // 'agencia', 'reclamos', 'traspasos'
    const [misPropuestas, setMisPropuestas] = useState([])
    const [propuestasPage, setPropuestasPage] = useState(0)
    const [hasMorePropuestas, setHasMorePropuestas] = useState(false)
    const [loadingPropuestas, setLoadingPropuestas] = useState(false)
    const [visibleTransacciones, setVisibleTransacciones] = useState(10)
    const [visibleRealizadas, setVisibleRealizadas] = useState(10)
    const [visibleRecibidas, setVisibleRecibidas] = useState(10)

    const { data: activaData } = useQuery({
        queryKey: ['jornadaActiva'],
        queryFn: () => import('../../api/jornadaApi').then(m => m.getJornadaActiva())
    })

    const { data: plantelActivo } = useQuery({
        queryKey: ['plantel', contextoActual, usuario?.id],
        queryFn: () => getPlantel(contextoActual, usuario?.id),
        enabled: !!usuario?.id || !!contextoActual
    })

    const idsPlantelActivo = useMemo(() => {
        if (!plantelActivo || !plantelActivo.jugadores) return []
        return plantelActivo.jugadores.map(j => String(j.jugadorRealId || j.id))
    }, [plantelActivo])

    const mercadoCerrado = useMemo(() => {
        if (activaData && activaData.estado === 'EN_JUEGO') {
            const esAdelantado = plantelActivo && plantelActivo.jornadaNumero > activaData.numero
            return !esAdelantado
        }
        return false
    }, [activaData, plantelActivo])

    useEffect(() => {
        const fetchDatos = async () => {
            try {

                if (contextoActual) {
                    const waiverApi = await import('../../api/waiverApi').then(m => m.waiverApi)
                    const [faseRes, reclamosRes, transaccionesRes, prioridadRes] = await Promise.allSettled([
                        waiverApi.obtenerFaseRestringida(),
                        waiverApi.obtenerMisReclamos(contextoActual),
                        waiverApi.obtenerHistorialTransacciones(contextoActual),
                        waiverApi.obtenerOrdenPrioridad(contextoActual)
                    ])
                    if (faseRes.status === 'fulfilled') setEsFaseRestringida(faseRes.value)
                    if (reclamosRes.status === 'fulfilled') setMisReclamos(reclamosRes.value)
                    if (transaccionesRes.status === 'fulfilled') {
                        setTransacciones(transaccionesRes.value.content || transaccionesRes.value);
                        setHasMoreTransacciones(transaccionesRes.value.last === false);
                        setTransaccionesPage(0);
                        setVisibleTransacciones(10);
                    }
                    if (prioridadRes.status === 'fulfilled') {
                        const lista = prioridadRes.value || [];
                        setListaPrioridad(lista);
                        const miPos = lista.find(p => p.nombreUsuario === usuario?.nombreDisplay);
                        if (miPos) setOrdenPrioridad(miPos.posicion);
                    }
                }
            } catch (err) {
                console.error("Error cargando mercado:", err)
            }
            if (contextoActual) {
                const { obtenerMisPropuestas } = await import('../../api/mercadoApi');
                obtenerMisPropuestas(contextoActual, 0).then(res => {
                    setMisPropuestas(res.content || res);
                    setHasMorePropuestas(res.last === false);
                    setPropuestasPage(0);
                    setVisibleRealizadas(10);
                    setVisibleRecibidas(10);
                }).catch(console.error);
            }
        }
        fetchDatos()
    }, [contextoActual, usuario?.id])

    const cargarMasRealizadas = async () => {
        if (!contextoActual || loadingPropuestas) return;
        const predicate = p => p.equipoProponenteUsuarioNombre === usuario?.nombreDisplay && (filtroEstadoTraspasos === 'TODAS' || p.estado === filtroEstadoTraspasos || (filtroEstadoTraspasos === 'CANCELADA' && p.estado.startsWith('CANCELADA')));
        
        const currentCount = misPropuestas.filter(predicate).length;
        if (visibleRealizadas < currentCount) {
            setVisibleRealizadas(prev => prev + 10);
            return;
        }
        
        if (!hasMorePropuestas) return;
        
        setLoadingPropuestas(true);
        try {
            const { obtenerMisPropuestas } = await import('../../api/mercadoApi');
            let currentPage = propuestasPage;
            let moreData = hasMorePropuestas;
            let newProposals = [];
            
            while (moreData && newProposals.filter(predicate).length === 0) {
                const res = await obtenerMisPropuestas(contextoActual, currentPage + 1);
                newProposals = [...newProposals, ...res.content];
                moreData = !res.last;
                currentPage++;
            }
            
            if (newProposals.length > 0) {
                setMisPropuestas(prev => {
                    const next = [...prev, ...newProposals];
                    const seen = new Set();
                    return next.filter(p => {
                        if (seen.has(p.id)) return false;
                        seen.add(p.id);
                        return true;
                    });
                });
                setHasMorePropuestas(moreData);
                setPropuestasPage(currentPage);
            }
            setVisibleRealizadas(prev => prev + 10);
        } catch (error) {
            console.error("Error cargando más propuestas:", error);
        } finally {
            setLoadingPropuestas(false);
        }
    };

    const cargarMasRecibidas = async () => {
        if (!contextoActual || loadingPropuestas) return;
        const predicate = p => p.equipoReceptorUsuarioNombre === usuario?.nombreDisplay && (filtroEstadoTraspasos === 'TODAS' || p.estado === filtroEstadoTraspasos || (filtroEstadoTraspasos === 'CANCELADA' && p.estado.startsWith('CANCELADA')));
        
        const currentCount = misPropuestas.filter(predicate).length;
        if (visibleRecibidas < currentCount) {
            setVisibleRecibidas(prev => prev + 10);
            return;
        }
        
        if (!hasMorePropuestas) return;
        
        setLoadingPropuestas(true);
        try {
            const { obtenerMisPropuestas } = await import('../../api/mercadoApi');
            let currentPage = propuestasPage;
            let moreData = hasMorePropuestas;
            let newProposals = [];
            
            while (moreData && newProposals.filter(predicate).length === 0) {
                const res = await obtenerMisPropuestas(contextoActual, currentPage + 1);
                newProposals = [...newProposals, ...res.content];
                moreData = !res.last;
                currentPage++;
            }
            
            if (newProposals.length > 0) {
                setMisPropuestas(prev => {
                    const next = [...prev, ...newProposals];
                    const seen = new Set();
                    return next.filter(p => {
                        if (seen.has(p.id)) return false;
                        seen.add(p.id);
                        return true;
                    });
                });
                setHasMorePropuestas(moreData);
                setPropuestasPage(currentPage);
            }
            setVisibleRecibidas(prev => prev + 10);
        } catch (error) {
            console.error("Error cargando más propuestas:", error);
        } finally {
            setLoadingPropuestas(false);
        }
    };

    const getTransaccionesVisualCount = () => {
        let count = 0;
        transacciones.forEach(t => {
            if (t.tipo !== 'TRASPASO') {
                if (t.jugadorEntranteNombre || t.dtEntranteNombre) count++;
                if (t.jugadorSalienteNombre || t.dtSalienteNombre) count++;
            }
        });
        const groupedTraspasos = {};
        transacciones.forEach(t => {
            if (t.tipo === 'TRASPASO') groupedTraspasos[`${t.fecha}-${t.equipoUsuarioNombre}`] = true;
        });
        count += Object.keys(groupedTraspasos).length;
        return count;
    };

    const cargarMasTransacciones = async () => {
        if (!contextoActual || loadingTransacciones) return;
        
        if (visibleTransacciones < getTransaccionesVisualCount()) {
            setVisibleTransacciones(prev => prev + 10);
            return;
        }

        if (!hasMoreTransacciones) return;

        setLoadingTransacciones(true);
        try {
            const { waiverApi } = await import('../../api/waiverApi');
            const res = await waiverApi.obtenerHistorialTransacciones(contextoActual, transaccionesPage + 1);
            setTransacciones(prev => [...prev, ...res.content]);
            setHasMoreTransacciones(!res.last);
            setTransaccionesPage(prev => prev + 1);
            setVisibleTransacciones(prev => prev + 10);
        } catch (error) {
            console.error("Error cargando más transacciones:", error);
        } finally {
            setLoadingTransacciones(false);
        }
    };

    // Extraemos los jugadores del draft (onboarding)
    const jugadoresDraft = store.jugadores || store.plantel?.jugadores || store.slots || []

    // Calculamos cuánto gastó el usuario hasta ahora en el Onboarding
    const presupuestoGastadoDraft = jugadoresDraft.reduce((acc, j) => {
        if (!j) return acc;
        // Dependiendo de cómo lo guarde tu store, buscamos el valor
        const valor = j.jugador?.valorMercadoActual || j.valorMercadoActual || 0;
        return acc + valor;
    }, 0);

    // Cálculo dinámico del poder de compra unificado
    const poderDeCompra = modoTransferencia
        ? (plantelActivo?.presupuestoRestante || 0) + (transferenciaPendiente?.valorSale || 0)
        : (100.0 - presupuestoGastadoDraft); // 100 cr iniciales para el Onboarding

    const limitesEquipo = useMemo(() => {
        const counts = {}
        const jugadoresAContar = (modoAsignacion && !plantelActivo) 
            ? jugadoresDraft.filter(Boolean).map(j => j.jugador || j) 
            : (plantelActivo?.jugadores || []).map(j => ({ equipoSigla: j.equipoSigla, id: String(j.jugadorRealId || j.id) }))

        jugadoresAContar.forEach(j => {
            if (modoTransferencia && String(transferenciaPendiente?.jugadorSaleId) === String(j.id || j.jugadorRealId)) {
                return // Excluimos al que sale
            }
            if (!j.equipoSigla) return
            counts[j.equipoSigla] = (counts[j.equipoSigla] || 0) + 1
        })
        return counts
    }, [modoAsignacion, plantelActivo, jugadoresDraft, modoTransferencia, transferenciaPendiente])

    const idsElegidosDraft = jugadoresDraft
        .map(j => {
            if (!j) return null
            if (j.jugador) return String(j.jugador.id || j.jugador.jugadorRealId)
            return String(j.id || j.jugadorRealId)
        })
        .filter(id => id && id !== 'undefined')

    const fetchYFiltrar = async (params) => {
        let data
        if (params.posicion === 'DT') {
            const { getDts } = await import('../../api/dtApi')
            data = await getDts(contextoActual)
            if (params.nombre) {
                const query = params.nombre.toLowerCase()
                data = data.filter(dt => dt.nombreCompleto?.toLowerCase().includes(query))
            }
        } else {
            if (contextoActual) {
                data = await getMercadoLibres(contextoActual, params)
            } else {
                data = await getMercadoJugadores(params)
            }
        }
        return data
    }

    const posicionInicialPorZona = {
        GUARD: 'BASE',
        FORWARD: 'ALERO',
        CENTER: 'PIVOT',
    }

    const posicionInicialTransferencia = useMemo(() => {
        if (!transferenciaPendiente) return null

        // Si tenemos la zona del slot, usarla para pre-filtrar
        // por las posiciones válidas para esa zona
        if (transferenciaPendiente.zona) {
            const primeraPosPorZona = {
                GUARD: 'BASE',     // Muestra bases, el usuario puede cambiar a ESCOLTA
                FORWARD: 'ALERO',   // Muestra aleros, puede cambiar a ALA_PIVOT
                CENTER: 'PIVOT',
            }
            return primeraPosPorZona[transferenciaPendiente.zona] ?? null
        }

        // Fallback: filtrar por la posición exacta del jugador
        const mapaPos = {
            BASE: 'BASE',
            ESCOLTA: 'ESCOLTA',
            ALERO: 'ALERO',
            ALA_PIVOT: 'ALA_PIVOT',
            PIVOT: 'PIVOT',
        }
        return mapaPos[transferenciaPendiente.posicion] ?? null
    }, [transferenciaPendiente])

    const [posicion, setPosicion] = useState(
        modoAsignacion
            ? posicionInicialPorZona[slotPendiente?.zona] ?? null
            : modoTransferencia
                ? posicionInicialTransferencia
                : null
    )

    useEffect(() => {
        if (modoTransferencia) {
            setPosicion(posicionInicialTransferencia)
        } else if (!modoTransferencia && !modoAsignacion) {
            setPosicion(null)
        }
    }, [modoTransferencia, posicionInicialTransferencia, modoAsignacion])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedBusqueda(busqueda)
        }, 400)
        return () => clearTimeout(timer)
    }, [busqueda])

    const { data: jugadoresRaw = [], isFetching: loadingJugadores } = useQuery({
        queryKey: ['jugadoresMercado', contextoActual, posicion, orden, debouncedBusqueda],
        queryFn: () => fetchYFiltrar({ posicion: posicion ?? undefined, orden, nombre: debouncedBusqueda.trim() }),
    })

    const jugadores = useMemo(() => {
        return jugadoresRaw.filter(j => !idsElegidosDraft.includes(String(j.id || j.jugadorRealId)))
    }, [jugadoresRaw, idsElegidosDraft])

    const limpiarBusqueda = useCallback(() => {
        setBusqueda('')
        setDebouncedBusqueda('')
    }, [])

    const handleElegirReemplazo = (jugadorEntra) => {
        setJugadorAConfirmar(jugadorEntra)
    }

    const ejecutarTransferencia = async () => {
        if (!jugadorAConfirmar) return
        setEjecutandoTransferencia(true)
        setErrorTransferencia('')
        
        const jugadorEntra = jugadorAConfirmar;
        setJugadorAConfirmar(null)

        try {
            if (contextoActual && esFaseRestringida) {
                const { waiverApi } = await import('../../api/waiverApi')
                await waiverApi.registrarReclamo({
                    torneoId: contextoActual,
                    jugadorEntranteId: jugadorEntra.id || jugadorEntra.jugadorRealId,
                    jugadorSalienteId: transferenciaPendiente.jugadorSaleId,
                })
            } else {
                await realizarTransferencia({
                    torneoId: contextoActual,
                    jugadorSaleId: transferenciaPendiente.jugadorSaleId,
                    jugadorEntraId: jugadorEntra.id || jugadorEntra.jugadorRealId,
                    rolEntrante: transferenciaPendiente.rolSaliente,
                })
            }

            cancelarTransferencia()
            setEjecutandoTransferencia(false)
            if (onActionComplete) {
                onActionComplete()
            } else {
                queryClient.invalidateQueries({ queryKey: ['plantel'] })
                navigate('/canchita')
            }

        } catch (e) {
            setErrorTransferencia(
                e.response?.data?.mensaje ?? 'Error al realizar la transferencia.'
            )
            setEjecutandoTransferencia(false)
        }
    }

    const [limiteVisible, setLimiteVisible] = useState(40)
    const observerRef = useRef(null)
    const observerTarget = useCallback(node => {
        if (observerRef.current) observerRef.current.disconnect()
        
        const scrollContainer = document.getElementById('mercado-scroll-container') || null;
        
        observerRef.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting) {
                setLimiteVisible(prev => prev + 40)
            }
        }, { root: scrollContainer, rootMargin: '200px' })
        
        if (node) observerRef.current.observe(node)
    }, [])

    useEffect(() => {
        setLimiteVisible(40)
    }, [busqueda, posicion, orden, modoTransferencia, modoAsignacion])

    const jugadoresVisiblesBase = useMemo(() => {
        return jugadores.filter(j => {
            const jId = String(j.id || j.jugadorRealId)
            if (idsPlantelActivo.includes(jId)) {
                return false
            }
            return true
        })
    }, [jugadores, idsPlantelActivo])

    const jugadoresVisibles = useMemo(() => {
        return jugadoresVisiblesBase.slice(0, limiteVisible)
    }, [jugadoresVisiblesBase, limiteVisible])

    const abrirModalJugador = async (jugador) => {
        // En modo asignación o transferencia, el tap ya tiene otra función
        // Solo abrir el modal en modo browsing normal
        if (modoAsignacion || modoTransferencia) return

        setModalJugador(jugador)
        setLoadingStatsModal(true)
        try {
            const stats = await getJugadorStats(jugador.id)
            setStatsModal(stats)
        } catch {
            setStatsModal(null)
        } finally {
            setLoadingStatsModal(false)
        }
    }

    return (
        <div className={clsx("w-full relative", layout === 'full' ? "space-y-4 min-h-screen pb-12 pt-4 px-4" : "h-full flex flex-col space-y-4")}>
            {layout === 'full' && (
                <div className="flex items-center justify-between shrink-0">
                    <h1 className="text-textMain font-bold text-2xl pt-2">Mercado</h1>
                    <BotonAyuda onClick={abrir} />
                </div>
            )}

            {mercadoCerrado && layout === 'panel' ? (
                <div className="pt-20">
                    <EmptyState
                        titulo="Mercado Cerrado"
                        descripcion="La jornada actual está en juego. No podés comprar ni vender jugadores hasta que termine."
                    />
                </div>
            ) : (
                <>
            {/* BANNER ONBOARDING*/}
            {modoAsignacion && (
                <div className="bg-primary/20 border border-primary rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-primary font-semibold text-sm">{contextoActual ? "Seleccioná un jugador" : "Elegí un jugador"}</p>
                        <p className="text-textMuted text-xs">Posición: {ZONA_LABEL[slotPendiente.zona] || slotPendiente.zona}</p>
                    </div>
                    {!contextoActual && (
                        <div className="text-right border-l border-primary/30 pl-3">
                            <p className="text-primary font-bold text-sm">{poderDeCompra.toFixed(1)}</p>
                            <p className="text-textMuted text-[10px] leading-tight">Presupuesto<br />Max</p>
                        </div>
                    )}
                    <button
                        onClick={() => { store.setSlotPendiente(null); if (onActionComplete) onActionComplete(); else navigate(-1); }}
                        className="text-textMuted text-sm shrink-0 ml-2"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* BANNER TRANSFERENCIA */}
            {modoTransferencia && !modoAsignacion && (
                <div className="bg-accent/15 border border-accent rounded-2xl px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                        <p className="text-accent font-semibold text-sm">{contextoActual ? "Proponer traspaso" : "Elegí el reemplazo"}</p>
                        <p className="text-textMuted text-xs truncate">
                            {contextoActual ? (
                                `Seleccioná un agente libre para reemplazar a ${transferenciaPendiente.nombreSale.split(',')[0]}`
                            ) : (
                                <>
                                    Sale: {transferenciaPendiente.nombreSale.split(',')[0]}
                                    {transferenciaPendiente.zona && (
                                        <span className="ml-1">
                                            · {
                                                { GUARD: 'Base/Escolta', FORWARD: 'Alero/Ala-Pivot', CENTER: 'Pivot' }
                                                [transferenciaPendiente.zona]
                                            }
                                        </span>
                                    )}
                                </>
                            )}
                        </p>
                    </div>
                    {!contextoActual && (
                        <div className="text-right border-l border-accent/30 pl-3">
                            <p className="text-accent font-bold text-sm">{poderDeCompra.toFixed(1)}</p>
                            <p className="text-textMuted text-[10px] leading-tight">Presupuesto<br />Max</p>
                        </div>
                    )}
                    <button
                        onClick={() => { cancelarTransferencia(); if (onActionComplete) onActionComplete(); else navigate('/canchita'); }}
                        className="text-textMuted text-sm shrink-0 ml-2"
                    >
                        ✕
                    </button>
                </div>
            )}

            {errorTransferencia && (
                <div className="bg-red-900/40 border border-red-700 text-red-400 rounded-2xl px-4 py-3 text-sm text-center">
                    {errorTransferencia}
                </div>
            )}

            {ejecutandoTransferencia && createPortal(
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center">
                    <div className="bg-card p-6 rounded-2xl flex flex-col items-center shadow-lg border border-border animate-scale-up">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-textMain font-semibold">Procesando transferencia...</p>
                    </div>
                </div>,
                document.body
            )}

            {contextoActual && (
                <div className="flex flex-col items-center mb-6">
                    <h2 className="text-textMain font-bold text-xl mb-3">
                        {esFaseRestringida ? "Agencia Restringida" : "Agencia Libre"}
                    </h2>
                    <div className="flex bg-surface p-1 rounded-xl w-full max-w-lg mx-auto border border-border">
                        <button
                            onClick={() => setActiveTab('agencia')}
                            className={clsx(
                                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors",
                                activeTab === 'agencia' ? "bg-card shadow text-textMain" : "text-textMuted"
                            )}
                        >
                            Agencia Libre
                        </button>
                        <button
                            onClick={() => setActiveTab('reclamos')}
                            className={clsx(
                                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors",
                                activeTab === 'reclamos' ? "bg-card shadow text-textMain" : "text-textMuted"
                            )}
                        >
                            Reclamos
                        </button>
                        <button
                            onClick={() => setActiveTab('traspasos')}
                            className={clsx(
                                "flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors",
                                activeTab === 'traspasos' ? "bg-card shadow text-textMain" : "text-textMuted"
                            )}
                        >
                            Traspasos
                        </button>
                    </div>
                    {listaPrioridad.length > 0 && (
                        <div className="mt-4 w-full max-w-sm bg-surface/50 p-3 rounded-xl border border-border/50">
                            <p className="text-textMuted text-xs font-semibold mb-2 uppercase tracking-wide text-center">Orden de prioridad para traspasos</p>
                            <div className="flex flex-col gap-1.5 mt-2">
                                {listaPrioridad.map(p => (
                                    <div key={p.equipoVirtualId || p.nombreUsuario} className={clsx("flex gap-3 text-sm items-center rounded px-2 py-1", p.nombreUsuario === usuario?.nombreDisplay ? "bg-accent/10 text-accent font-bold" : "text-textMain")}>
                                        <span className="opacity-50 min-w-[20px]">#{p.posicion}</span>
                                        <span>{p.nombreEquipo || p.nombreUsuario}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'reclamos' && (
                <div className={clsx("gap-8 w-full max-w-4xl mx-auto items-start", layout !== 'full' ? "flex flex-col" : "grid grid-cols-1 md:grid-cols-2")}>
                    <div className="flex flex-col gap-6 w-full">
                        <h2 className="text-textMain font-bold text-xl">Mis Reclamos</h2>
                        {misReclamos.length === 0 ? (
                            <EmptyState titulo="Sin reclamos" descripcion="No has hecho reclamos para esta fase." />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {misReclamos.map(r => (
                                    <div key={r.id} className="bg-card border border-border rounded-xl md:rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors hover:border-white/20">
                                        <div className="flex items-start gap-3">
                                            <div className={clsx(
                                                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                                r.estado === 'PENDIENTE' ? "bg-yellow-500/10 text-yellow-500" :
                                                r.estado === 'APROBADO' ? "bg-green-500/10 text-green-400" :
                                                "bg-red-500/10 text-red-400"
                                            )}>
                                                {r.estado === 'PENDIENTE' ? '⏳' :
                                                 r.estado === 'APROBADO' ? (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                 ) : (
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                 )}
                                            </div>
                                            <div>
                                                <p className="text-textMain text-sm leading-relaxed">
                                                    <span className="font-bold">{r.jugadorEntranteNombre || r.dtEntranteNombre}</span> por <span className="text-textMuted">{r.jugadorSalienteNombre || r.dtSalienteNombre}</span>
                                                </p>
                                                {r.estado === 'RECHAZADO' && r.motivoRechazo && (
                                                    <p className="text-red-400 text-xs mt-1.5">{r.motivoRechazo}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right sm:ml-4 shrink-0">
                                            <span className={clsx(
                                                "text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-md whitespace-nowrap",
                                                r.estado === 'PENDIENTE' ? "bg-yellow-900/40 text-yellow-500 border border-yellow-900/50" :
                                                r.estado === 'APROBADO' ? "bg-green-900/40 text-green-400 border border-green-900/50" :
                                                "bg-red-900/40 text-red-400 border border-red-900/50"
                                            )}>
                                                {r.estado}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-6 w-full">
                        <h2 className="text-textMain font-bold text-xl">Historial de traspasos</h2>
                        {transacciones.length === 0 ? (
                            <EmptyState titulo="Sin transacciones" descripcion="Nadie ha fichado recientemente." />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {(() => {
                                    const transaccionesAgrupadas = [];
                                    const traspasosTemp = {};

                                    transacciones.forEach(t => {
                                        if (t.tipo === 'TRASPASO') {
                                            const key = `${t.fecha}-${t.equipoUsuarioNombre}`;
                                            if (!traspasosTemp[key]) {
                                                traspasosTemp[key] = {
                                                    id: t.id || key,
                                                    fecha: t.fecha,
                                                    equipoUsuarioNombre: t.equipoUsuarioNombre,
                                                    tipo: 'TRASPASO',
                                                    entrantes: [],
                                                    salientes: []
                                                };
                                            }
                                            if (t.jugadorEntranteNombre) traspasosTemp[key].entrantes.push(t.jugadorEntranteNombre);
                                            if (t.dtEntranteNombre) traspasosTemp[key].entrantes.push(`${t.dtEntranteNombre} (DT)`);
                                            if (t.jugadorSalienteNombre) traspasosTemp[key].salientes.push(t.jugadorSalienteNombre);
                                            if (t.dtSalienteNombre) traspasosTemp[key].salientes.push(`${t.dtSalienteNombre} (DT)`);
                                        } else {
                                            transaccionesAgrupadas.push(t);
                                        }
                                    });

                                    Object.values(traspasosTemp).forEach(t => transaccionesAgrupadas.push(t));
                                    transaccionesAgrupadas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

                                    // Aplanar en tarjetas visuales antes de renderizar
                                    const tarjetasVisuales = [];
                                    transaccionesAgrupadas.forEach((t, i) => {
                                        if (t.tipo === 'TRASPASO' && (t.entrantes?.length > 0 || t.salientes?.length > 0)) {
                                            tarjetasVisuales.push(
                                                <div key={t.id ? `${t.id}-${i}` : i} className="bg-card border border-border rounded-xl md:rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-colors hover:border-white/20">
                                                    <div className="w-8 h-8 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-textMain text-sm leading-relaxed">
                                                            <span className="font-bold text-accent">{t.equipoUsuarioNombre}</span> dio a <span className="font-bold text-red-400/90">{t.salientes.join(', ') || 'Nadie'}</span> y recibió a <span className="font-bold text-green-400/90">{t.entrantes.join(', ') || 'Nadie'}</span>
                                                        </p>
                                                        <p className="text-textMuted text-xs mt-1.5">{new Date(t.fecha).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                            );
                                        } else if (t.tipo !== 'TRASPASO') {
                                            const entra = t.jugadorEntranteNombre || t.dtEntranteNombre;
                                            const sale = t.jugadorSalienteNombre || t.dtSalienteNombre;
                                            
                                            if (entra && sale) {
                                                tarjetasVisuales.push(
                                                    <div key={`entra-${t.id || i}`} className="bg-card border border-border rounded-xl md:rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-colors hover:border-white/20">
                                                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-textMain text-sm leading-relaxed">
                                                                <span className="font-bold">{entra}</span> es nuevo integrante de <span className="text-accent font-bold">{t.equipoUsuarioNombre}</span>
                                                            </p>
                                                            <p className="text-textMuted text-xs mt-1.5">{new Date(t.fecha).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                );
                                                tarjetasVisuales.push(
                                                    <div key={`sale-${t.id || i}`} className="bg-card border border-border rounded-xl md:rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-colors hover:border-white/20 opacity-80 hover:opacity-100">
                                                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-textMain text-sm leading-relaxed">
                                                                <span className="font-bold">{sale}</span> se convirtió en agente libre
                                                            </p>
                                                            <p className="text-textMuted text-xs mt-1.5">{new Date(t.fecha).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                );
                                            } else if (entra) {
                                                tarjetasVisuales.push(
                                                    <div key={`entra-${t.id || i}`} className="bg-card border border-border rounded-xl md:rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-colors hover:border-white/20">
                                                        <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-textMain text-sm leading-relaxed">
                                                                <span className="font-bold">{entra}</span> es nuevo integrante de <span className="text-accent font-bold">{t.equipoUsuarioNombre}</span>
                                                            </p>
                                                            <p className="text-textMuted text-xs mt-1.5">{new Date(t.fecha).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                );
                                            } else if (sale) {
                                                tarjetasVisuales.push(
                                                    <div key={`sale-${t.id || i}`} className="bg-card border border-border rounded-xl md:rounded-2xl p-4 shadow-sm flex items-start gap-3 transition-colors hover:border-white/20 opacity-80 hover:opacity-100">
                                                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                                                            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="text-textMain text-sm leading-relaxed">
                                                                <span className="font-bold">{sale}</span> se convirtió en agente libre
                                                            </p>
                                                            <p className="text-textMuted text-xs mt-1.5">{new Date(t.fecha).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        }
                                    });

                                    return tarjetasVisuales.slice(0, visibleTransacciones);
                                })()}
                            </div>
                        )}
                        {(hasMoreTransacciones || visibleTransacciones < getTransaccionesVisualCount()) && (
                            <div className="flex justify-center mt-4 mb-8">
                                <button 
                                    onClick={cargarMasTransacciones} 
                                    disabled={loadingTransacciones}
                                    className="px-6 py-2 bg-surface/80 border border-border/50 text-textMain rounded-xl hover:bg-surface disabled:opacity-50 transition-colors text-sm font-medium"
                                >
                                    {loadingTransacciones ? 'Cargando...' : 'Cargar más'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'traspasos' && (
                <>
                    <div className="gap-8 w-full max-w-7xl mx-auto items-start flex flex-col">
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full mb-4 px-1 md:justify-center">
                            {['TODAS', 'PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'CANCELADA'].map((estado) => (
                                <button
                                    key={estado}
                                    onClick={() => setFiltroEstadoTraspasos(estado)}
                                    className={clsx(
                                        'pill shrink-0 whitespace-nowrap',
                                        filtroEstadoTraspasos === estado && 'pill-active'
                                    )}
                                >
                                    {estado === 'TODAS' ? 'Todas' : estado.charAt(0) + estado.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>

                    <div className={clsx("flex flex-col gap-8 w-full", layout === 'full' ? "lg:flex-row" : "")}>
                        <div className="flex-1 flex flex-col gap-4">
                            <h2 className="text-textMain font-bold text-xl mb-2">Ofertas Realizadas</h2>
                            {misPropuestas.filter(p => p.equipoProponenteUsuarioNombre === usuario?.nombreDisplay && (filtroEstadoTraspasos === 'TODAS' || p.estado === filtroEstadoTraspasos || (filtroEstadoTraspasos === 'CANCELADA' && p.estado.startsWith('CANCELADA')))).length === 0 && (
                                <EmptyState titulo="Sin ofertas" descripcion={filtroEstadoTraspasos === 'TODAS' ? "No has realizado ninguna oferta." : "No hay ofertas realizadas con este filtro."} />
                            )}
                            {misPropuestas.filter(p => p.equipoProponenteUsuarioNombre === usuario?.nombreDisplay && (filtroEstadoTraspasos === 'TODAS' || p.estado === filtroEstadoTraspasos || (filtroEstadoTraspasos === 'CANCELADA' && p.estado.startsWith('CANCELADA')))).slice(0, visibleRealizadas).map(p => {
                                    const rivalNombre = p.equipoReceptorUsuarioNombre;
                                    const equipoRivalNombre = p.equipoReceptorNombre;
                                    const isPending = p.estado === 'PENDIENTE';
                                    
                                    const handleAccion = async (accion) => {
                                        const { cancelarTraspaso } = await import('../../api/mercadoApi');
                                        if (accion === 'CANCELAR') {
                                            try {
                                                await cancelarTraspaso(p.id);
                                                setMisPropuestas(prev => prev.map(pr => pr.id === p.id ? { ...pr, estado: 'CANCELADA_PROPONENTE' } : pr));
                                                showToast('Propuesta cancelada');
                                            } catch (e) {
                                                setAlertConfig({ isOpen: true, titulo: 'Error al cancelar', mensaje: e.response?.data?.mensaje || 'Ocurrió un error inesperado al intentar cancelar la propuesta.' });
                                            }
                                        }
                                    };

                                    return (
                                        <div key={p.id} className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-4 hover:border-white/20 transition-colors">
                                            <div className="flex justify-between items-center w-full mb-1">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <span className="text-textMuted text-xs">
                                                            {new Date(p.fechaCreacion).toLocaleDateString()}
                                                        </span>
                                                        <span className={clsx(
                                                            "text-xs font-bold",
                                                            isPending ? "text-yellow-400" : (p.estado === 'ACEPTADA' ? "text-green-400" : "text-red-400")
                                                        )}>
                                                            {p.estado.startsWith('CANCELADA') ? 'CANCELADA' : p.estado.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-textMain font-medium">
                                                        Para: <span className="text-white font-bold">{equipoRivalNombre}</span> <span className="text-textMuted">({rivalNombre})</span>
                                                    </p>
                                                </div>
                                                
                                                {isPending && (
                                                    <div className="shrink-0">
                                                        <button 
                                                            onClick={() => handleAccion('CANCELAR')}
                                                            className="bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="w-full">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-bold text-textMuted uppercase tracking-wider text-center">Ofreces</p>
                                                        <div className="space-y-2">
                                                            {p.jugadoresOfrecidos.map(j => (
                                                                <div key={j.id} className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between shadow-sm">
                                                                    <div>
                                                                        <p className="text-textMain font-bold text-sm truncate">{j.nombreCompleto}</p>
                                                                        <p className="text-textMuted text-xs">{j.posicion} · {j.equipoNombre}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {p.dtOfrecidoNombre && (
                                                                <div className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between shadow-sm">
                                                                    <div>
                                                                        <p className="text-textMain font-bold text-sm truncate">{p.dtOfrecidoNombre}</p>
                                                                        <p className="text-textMuted text-xs">DT</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-bold text-textMuted uppercase tracking-wider text-center">Recibes</p>
                                                        <div className="space-y-2">
                                                            {p.jugadoresSolicitados.map(j => (
                                                                <div key={j.id} className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between shadow-sm">
                                                                    <div>
                                                                        <p className="text-textMain font-bold text-sm truncate">{j.nombreCompleto}</p>
                                                                        <p className="text-textMuted text-xs">{j.posicion} · {j.equipoNombre}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {p.dtSolicitadoNombre && (
                                                                <div className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between shadow-sm">
                                                                    <div>
                                                                        <p className="text-textMain font-bold text-sm truncate">{p.dtSolicitadoNombre}</p>
                                                                        <p className="text-textMuted text-xs">DT</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {(() => {
                                    const count = misPropuestas.filter(p => p.equipoProponenteUsuarioNombre === usuario?.nombreDisplay && (filtroEstadoTraspasos === 'TODAS' || p.estado === filtroEstadoTraspasos || (filtroEstadoTraspasos === 'CANCELADA' && p.estado.startsWith('CANCELADA')))).length;
                                    return count > visibleRealizadas || (count === visibleRealizadas && hasMorePropuestas);
                                })() && (
                                    <div className="flex justify-center mt-4 w-full">
                                        <button 
                                            onClick={cargarMasRealizadas} 
                                            disabled={loadingPropuestas}
                                            className="px-6 py-2 bg-surface/80 border border-border/50 text-textMain rounded-xl hover:bg-surface disabled:opacity-50 transition-colors text-sm font-medium"
                                        >
                                            {loadingPropuestas ? 'Cargando...' : 'Cargar más'}
                                        </button>
                                    </div>
                                )}
                            </div>

                        <div className="flex-1 flex flex-col gap-4">
                            <h2 className="text-textMain font-bold text-xl mb-2">Ofertas Recibidas</h2>
                            {misPropuestas.filter(p => p.equipoReceptorUsuarioNombre === usuario?.nombreDisplay && (filtroEstadoTraspasos === 'TODAS' || p.estado === filtroEstadoTraspasos || (filtroEstadoTraspasos === 'CANCELADA' && p.estado.startsWith('CANCELADA')))).length === 0 && (
                                <EmptyState titulo="Sin ofertas" descripcion={filtroEstadoTraspasos === 'TODAS' ? "No has recibido ninguna oferta." : "No hay ofertas recibidas con este filtro."} />
                            )}
                            {misPropuestas.filter(p => p.equipoReceptorUsuarioNombre === usuario?.nombreDisplay && (filtroEstadoTraspasos === 'TODAS' || p.estado === filtroEstadoTraspasos || (filtroEstadoTraspasos === 'CANCELADA' && p.estado.startsWith('CANCELADA')))).slice(0, visibleRecibidas).map(p => {
                                    const rivalNombre = p.equipoProponenteUsuarioNombre;
                                    const equipoRivalNombre = p.equipoProponenteNombre;
                                    const isPending = p.estado === 'PENDIENTE';
                                    
                                    const handleAccion = async (accion) => {
                                        const { aceptarTraspaso, rechazarTraspaso } = await import('../../api/mercadoApi');
                                        try {
                                            if (accion === 'ACEPTAR') {
                                                await aceptarTraspaso(p.id);
                                                setMisPropuestas(prev => prev.map(pr => pr.id === p.id ? { ...pr, estado: 'ACEPTADA' } : pr));
                                                showToast('Propuesta aceptada exitosamente', 'success');
                                            } else if (accion === 'RECHAZAR') {
                                                await rechazarTraspaso(p.id);
                                                setMisPropuestas(prev => prev.map(pr => pr.id === p.id ? { ...pr, estado: 'RECHAZADA' } : pr));
                                                showToast('Propuesta rechazada');
                                            }
                                        } catch (e) {
                                            setAlertConfig({ isOpen: true, titulo: 'Error en el traspaso', mensaje: e.response?.data?.mensaje || 'Ocurrió un error inesperado al gestionar la propuesta.' });
                                        }
                                    };

                                    return (
                                        <div key={p.id} className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-4 hover:border-white/20 transition-colors">
                                            <div className="flex justify-between items-center w-full mb-1">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <span className="text-textMuted text-xs">
                                                            {new Date(p.fechaCreacion).toLocaleDateString()}
                                                        </span>
                                                        <span className={clsx(
                                                            "text-xs font-bold",
                                                            isPending ? "text-yellow-400" : (p.estado === 'ACEPTADA' ? "text-green-400" : "text-red-400")
                                                        )}>
                                                            {p.estado.startsWith('CANCELADA') ? 'CANCELADA' : p.estado.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-textMain font-medium">
                                                        De: <span className="text-white font-bold">{equipoRivalNombre}</span> <span className="text-textMuted">({rivalNombre})</span>
                                                    </p>
                                                </div>

                                                {isPending && (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button 
                                                            onClick={() => handleAccion('ACEPTAR')}
                                                            className="bg-green-500/20 text-green-400 border border-green-500/40 hover:bg-green-500/30 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                                                        >
                                                            Aceptar
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAccion('RECHAZAR')}
                                                            className="bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="w-full">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-bold text-textMuted uppercase tracking-wider text-center">Ofreces</p>
                                                        <div className="space-y-2">
                                                            {p.jugadoresSolicitados.map(j => (
                                                                <div key={j.id} className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between shadow-sm">
                                                                    <div>
                                                                        <p className="text-textMain font-bold text-sm truncate">{j.nombreCompleto}</p>
                                                                        <p className="text-textMuted text-xs">{j.posicion} · {j.equipoNombre}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {p.dtSolicitadoNombre && (
                                                                <div className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between shadow-sm">
                                                                    <div>
                                                                        <p className="text-textMain font-bold text-sm truncate">{p.dtSolicitadoNombre}</p>
                                                                        <p className="text-textMuted text-xs">DT</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <p className="text-xs font-bold text-textMuted uppercase tracking-wider text-center">Recibes</p>
                                                        <div className="space-y-2">
                                                            {p.jugadoresOfrecidos.map(j => (
                                                                <div key={j.id} className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between shadow-sm">
                                                                    <div>
                                                                        <p className="text-textMain font-bold text-sm truncate">{j.nombreCompleto}</p>
                                                                        <p className="text-textMuted text-xs">{j.posicion} · {j.equipoNombre}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {p.dtOfrecidoNombre && (
                                                                <div className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between shadow-sm">
                                                                    <div>
                                                                        <p className="text-textMain font-bold text-sm truncate">{p.dtOfrecidoNombre}</p>
                                                                        <p className="text-textMuted text-xs">DT</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                                {(() => {
                                    const count = misPropuestas.filter(p => p.equipoReceptorUsuarioNombre === usuario?.nombreDisplay && (filtroEstadoTraspasos === 'TODAS' || p.estado === filtroEstadoTraspasos || (filtroEstadoTraspasos === 'CANCELADA' && p.estado.startsWith('CANCELADA')))).length;
                                    return count > visibleRecibidas || (count === visibleRecibidas && hasMorePropuestas);
                                })() && (
                                    <div className="flex justify-center mt-4 w-full">
                                        <button 
                                            onClick={cargarMasRecibidas} 
                                            disabled={loadingPropuestas}
                                            className="px-6 py-2 bg-surface/80 border border-border/50 text-textMain rounded-xl hover:bg-surface disabled:opacity-50 transition-colors text-sm font-medium"
                                        >
                                            {loadingPropuestas ? 'Cargando...' : 'Cargar más'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                </div>
                </>
            )}

            {activeTab === 'agencia' && (
                <>
                <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar jugador o equipo..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-2.5 pr-10 text-textMain placeholder-textMuted text-sm focus:outline-none focus:border-primary"
                />
                {busqueda && (
                    <button onClick={limpiarBusqueda} className="absolute right-3 top-1/2 -translate-y-1/2 text-textMuted hover:text-textMain">✕</button>
                )}
            </div>

            {!busqueda && (
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full md:justify-center">
                        {POSICIONES
                            .filter(({ valor }) => {
                                if (!contextoActual && valor === 'DT') return false;
                                if (modoAsignacion && slotPendiente?.zona !== 'SUPLENTE') {
                                    const zonaAPosiciones = {
                                        GUARD: ['BASE', 'ESCOLTA'],
                                        FORWARD: ['ALERO', 'ALA_PIVOT'],
                                        CENTER: ['PIVOT']
                                    };
                                    const valid = zonaAPosiciones[slotPendiente?.zona] || [];
                                    if (valor === null || !valid.includes(valor)) return false;
                                }
                                return true;
                            })
                            .map(({ label, valor }) => (
                            <button
                                key={label}
                                onClick={() => setPosicion(valor)}
                                className={clsx('pill shrink-0 whitespace-nowrap', posicion === valor && 'pill-active')}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* ── Selector de Orden ── */}
                    <div className="shrink-0 w-full">
                        <select
                            value={orden}
                            onChange={(e) => setOrden(e.target.value)}
                            className="w-full bg-surface border border-border text-textMuted text-sm rounded-xl pl-3 pr-8 py-2 md:py-2.5 outline-none focus:border-primary cursor-pointer shadow-sm appearance-none"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23888\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.2em 1.2em' }}
                        >
                            {!contextoActual && (
                                <>
                                    <option value="precio_desc">💰 Precio Descendente</option>
                                    <option value="precio_asc">💰 Precio Ascendente</option>
                                </>
                            )}
                            <option value="promedio_desc">🔥 Promedio Descendente</option>
                            <option value="promedio_asc">❄️ Promedio Ascendente</option>
                            <option value="nombre_asc">🔤 Alfabetico (A-Z)</option>
                            <option value="nombre_desc">🔤 Alfabetico (Z-A)</option>
                        </select>
                    </div>
                </div>
            )}

            {loadingJugadores ? (
                <LoadingSpinner mensaje="Buscando jugadores..." />
            ) : jugadoresVisibles.length === 0 ? (
                <EmptyState
                    titulo="Sin resultados"
                    descripcion="No encontramos jugadores con ese criterio (o ya los elegiste a todos)."
                />
            ) : (
                <>
                    <div className={clsx("grid gap-3 pb-4", layout === 'full' ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
                        {jugadoresVisibles.map((jugador, i) => (
                            <TarjetaJugador
                                key={(jugador.id || jugador.jugadorRealId) + '-' + i}
                                jugador={jugador}
                                presupuestoMaximo={poderDeCompra}
                                modoTransferencia={modoTransferencia}
                                modoAsignacion={modoAsignacion}
                                limitesEquipo={limitesEquipo}
                                contextoActual={contextoActual}
                                onElegir={
                                    modoAsignacion ? (j) => {
                                        asignarJugador({ ...j, jugadorRealId: j.id || j.jugadorRealId })
                                        if (onActionComplete) onActionComplete()
                                        else navigate('/onboarding/canchita', { replace: true })
                                    }
                                    : modoTransferencia ? () => handleElegirReemplazo(jugador)
                                    : undefined
                                }
                                onVerDetalles={() => abrirModalJugador(jugador)}
                            />
                        ))}
                    </div>
                    {jugadoresVisibles.length < jugadoresVisiblesBase.length && (
                        <div ref={observerTarget} className="h-10 w-full" />
                    )}
                </>
            )}
            </>
            )}
            </>
            )}

            {modalJugador && createPortal(
                <>
                    <div className="fixed inset-0 bg-black/60 z-40"
                        onClick={() => { setModalJugador(null); setStatsModal(null) }} />
                    <div
                        className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md md:max-w-lg mx-auto
                 bg-card border-t border-border rounded-t-3xl md:rounded-3xl
                 z-50 p-6 md:p-8 space-y-4 md:space-y-6 animate-slide-up md:animate-none"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />

                        {/* Header jugador */}
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="md:scale-125 md:origin-left transition-transform">
                                <CamisetaSVG
                                    colorPrincipal={modalJugador.colorPrincipal}
                                    colorSecundario={modalJugador.colorSecundario}
                                    numero={modalJugador.numeroCamiseta}
                                    estado={modalJugador.estado}
                                    modelo={modalJugador.modeloCamiseta}
                                    size={56}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-textMain font-bold text-lg md:text-xl leading-tight truncate">
                                    {modalJugador.nombreCompleto}
                                </p>
                                <p className="text-textMuted text-sm md:text-base">
                                    {modalJugador.equipoNombre} {modalJugador.posicion}
                                </p>
                                {!contextoActual && (
                                    <p className="text-accent font-black text-2xl md:text-3xl mt-1">
                                        {modalJugador.valorMercadoActual?.toFixed(1)}
                                        <span className="text-base md:text-lg font-normal text-textMuted ml-1">cr</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Stats - Diseño estilo Canchita */}
                        {loadingStatsModal ? (
                            <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : statsModal && statsModal.partidosJugados > 0 ? (
                            <div className="bg-surface/50 rounded-2xl p-4 md:p-6 mt-2 border border-white/5">
                                <p className="text-textMuted text-[10px] md:text-xs font-bold uppercase tracking-wider mb-4 md:mb-5 text-center">
                                    Promedios ({statsModal.partidosJugados} {statsModal.partidosJugados === 1 ? 'partido' : 'partidos'})
                                </p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:gap-y-4">
                                    {[
                                        { label: 'Puntos', valor: statsModal.promedioPuntos },
                                        { label: 'Asistencias', valor: statsModal.promedioAsistencias },
                                        { label: 'Reb. Def.', valor: statsModal.promedioRebotesDefensivos },
                                        { label: 'Reb. Of.', valor: statsModal.promedioRebotesOfensivos },
                                        { label: 'Recuperos', valor: statsModal.promedioRobos },
                                        { label: 'Tapones', valor: statsModal.promedioTaponesRealizados },
                                        { label: 'Faltas Recibidas', valor: statsModal.promedioFaltasRecibidas },
                                        { label: 'Pérdidas', valor: statsModal.promedioPerdidas, negativo: true },
                                        { label: 'Tap. Recibidos', valor: statsModal.promedioTaponesRecibidos, negativo: true },
                                        { label: 'Faltas Cometidas', valor: statsModal.promedioFaltasCometidas, negativo: true },
                                        { label: 'TC Fallados', valor: statsModal.promedioTirosCampoFallados, negativo: true },
                                        { label: 'TL Fallados', valor: statsModal.promedioTirosLibresFallados, negativo: true },
                                    ].map(({ label, valor, negativo }) => (
                                        <div key={label} className="flex justify-between items-center border-b border-white/5 pb-1 md:pb-2">
                                            <span className="text-textMuted text-xs md:text-sm">{label}</span>
                                            <span className={clsx("font-bold text-sm md:text-base tabular-nums", negativo ? "text-red-400" : "text-textMain")}>
                                                {valor !== undefined && valor !== null ? valor.toFixed(1) : '—'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-surface/50 rounded-2xl p-6 mt-2 border border-white/5 flex flex-col items-center justify-center">
                                <p className="text-textMuted text-sm">
                                    Sin estadísticas disponibles.
                                </p>
                            </div>
                        )}

                        {/* Botón transferir */}
                        {(() => {
                            const superaLimiteModal = limitesEquipo[modalJugador?.equipoSigla] >= 2;
                            const botonBloqueado = superaLimiteModal || mercadoCerrado;
                            return (
                                <button
                                    onClick={() => {
                                        if (botonBloqueado) return;
                                        setModalJugador(null)
                                        setStatsModal(null)
                                        iniciarTransferenciaDesdeEntrada(modalJugador)
                                    }}
                                    disabled={botonBloqueado}
                                    className={clsx(
                                        "w-full py-3 rounded-xl font-semibold border transition-transform",
                                        botonBloqueado 
                                            ? "border-red-500/50 text-red-400 bg-red-950/30 opacity-50 cursor-not-allowed" 
                                            : "border-primary text-primary active:scale-95"
                                    )}
                                >
                                    {mercadoCerrado ? "Mercado cerrado" : superaLimiteModal ? "Límite de equipo alcanzado" : (contextoActual && esFaseRestringida ? "Intentar fichar" : "Transferir al equipo")}
                                </button>
                            );
                        })()}

                        <button
                            onClick={() => { setModalJugador(null); setStatsModal(null) }}
                            className="w-full py-2 text-textMuted text-sm"
                        >
                            Cerrar
                        </button>
                    </div>
                </>,
                document.body
            )}
            <ModalAyuda
                pagina="mercado"
                contenido={AYUDA.mercado}
                onCerrar={cerrar}
                abierto={abierto}
            />

            {jugadorEntranteParaCambio && plantelActivo && (
                <SeleccionarSalienteModal 
                    torneoId={contextoActual}
                    jugadorEntrante={jugadorEntranteParaCambio}
                    plantelActivo={plantelActivo}
                    onCerrar={() => setJugadorEntranteParaCambio(null)}
                    onElegir={(saliente) => {
                        const zonas = { GUARD: 'BASE', FORWARD: 'ALERO', CENTER: 'PIVOT' };
                        const esTitular = (r) => r && r.startsWith('TITULAR_');
                        const idxTitular = esTitular(saliente.rol) ? parseInt(saliente.rol.replace('TITULAR_', '')) - 1 : 0;
                        const zona = esTitular(saliente.rol) ? (zonas[idxTitular] ?? null) : null;
                        
                        iniciarTransferencia({
                            jugadorSaleId: saliente.jugadorRealId || saliente.dtId || saliente.id,
                            rolSaliente: saliente.rol,
                            posicion: saliente.posicion,
                            zona,
                            nombreSale: saliente.nombreCompleto,
                            valorSale: saliente.valorMercadoActual,
                            precioCompraSale: saliente.precioDeCompra || saliente.valorMercadoActual,
                            colorPrincipal: saliente.colorPrincipal,
                            colorSecundario: saliente.colorSecundario,
                            numeroCamiseta: saliente.numeroCamiseta,
                            modeloCamiseta: saliente.modeloCamiseta,
                            estado: saliente.estado,
                            equipoSigla: saliente.equipoSigla
                        });
                        setJugadorEntranteParaCambio(null);
                        setJugadorAConfirmar(jugadorEntranteParaCambio);
                    }}
                />
            )}
            <AlertModal 
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig({ ...alertConfig, isOpen: false })}
                titulo={alertConfig.titulo}
                mensaje={alertConfig.mensaje}
            />
            {jugadorAConfirmar && (
                <ConfirmarTransferenciaModal
                    torneoId={contextoActual}
                    jugadorSaliente={{
                        id: transferenciaPendiente.jugadorSaleId,
                        jugadorRealId: transferenciaPendiente.jugadorSaleId,
                        precioDeCompra: transferenciaPendiente.precioCompraSale,
                        valorMercadoActual: transferenciaPendiente.valorSale,
                        nombreCompleto: transferenciaPendiente.nombreSale,
                        posicion: transferenciaPendiente.posicion,
                        equipoSigla: transferenciaPendiente.equipoSigla,
                        colorPrincipal: transferenciaPendiente.colorPrincipal,
                        colorSecundario: transferenciaPendiente.colorSecundario,
                        numeroCamiseta: transferenciaPendiente.numeroCamiseta,
                        modeloCamiseta: transferenciaPendiente.modeloCamiseta,
                        estado: transferenciaPendiente.estado
                    }}
                    jugadorEntrante={jugadorAConfirmar}
                    plantelActivo={plantelActivo}
                    poderDeCompraActual={plantelActivo?.presupuestoRestante || 0}
                    esFaseRestringida={esFaseRestringida}
                    loading={ejecutandoTransferencia}
                    onConfirmar={ejecutarTransferencia}
                    onCancelar={() => setJugadorAConfirmar(null)}
                />
            )}
        </div>
    )
}

function TarjetaJugador({ jugador, onElegir, onVerDetalles, presupuestoMaximo, modoTransferencia, modoAsignacion, limitesEquipo, contextoActual }) {
    const estado = ESTADO_CONFIG[jugador.estado] ?? ESTADO_CONFIG.DISPONIBLE

    // Bloqueamos si supera el presupuesto tanto armando el equipo como haciendo un cambio
    const superaPresupuesto = (modoTransferencia || modoAsignacion) && (!contextoActual && jugador.valorMercadoActual > presupuestoMaximo);
    
    const superaLimiteEquipo = (modoTransferencia || modoAsignacion) && (limitesEquipo?.[jugador.equipoSigla] >= 2);
    const estaBloqueado = superaPresupuesto || superaLimiteEquipo;

    return (
        <div
            className={clsx(
                "card flex items-center gap-3 transition-transform py-4 md:py-5",
                estaBloqueado ? "opacity-50 grayscale" : "cursor-pointer active:scale-95 hover:border-primary/50"
            )}
            onClick={() => {
                if (estaBloqueado) return;
                if (onElegir) onElegir(jugador);
                else if (onVerDetalles) onVerDetalles(jugador);
            }}
        >
            <div className="shrink-0">
                <CamisetaSVG
                    colorPrincipal={jugador.colorPrincipal}
                    colorSecundario={jugador.colorSecundario}
                    numero={jugador.posicion ? jugador.numeroCamiseta : 'DT'}
                    estado={jugador.estado}
                    modelo={jugador.modeloCamiseta}
                    size={52}
                />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-textMain font-semibold text-sm truncate">
                    {jugador.nombreCompleto}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-textMuted text-xs">{jugador.equipoSigla}</span>
                    <span className="text-textMuted text-xs">{jugador.posicion}</span>
                    <span className={`text-xs font-medium ${estado.color} ml-1`}>
                        {estado.label}
                    </span>
                </div>
                {jugador.promedioPuntosUltimas3 > 0 && (
                    <p className="text-textMuted text-xs mt-0.5">
                        Prom. Fantasy: <span className="text-accent font-semibold">{jugador.promedioPuntosUltimas3.toFixed(1)}</span> pts
                    </p>
                )}
            </div>
            <div className="shrink-0 text-right flex flex-col items-end">
                {!contextoActual && (
                    <>
                        <p className={clsx("font-bold text-base", estaBloqueado ? "text-red-400 line-through" : "text-textMain")}>
                            {jugador.valorMercadoActual?.toFixed(1)}
                        </p>
                        <p className="text-textMuted text-xs">créditos</p>
                    </>
                )}
                {superaPresupuesto && (
                    <span className="text-[10px] text-red-400 font-bold mt-1 bg-red-950/50 px-2 py-0.5 rounded">Muy caro</span>
                )}
                {superaLimiteEquipo && (
                    <span className="text-[10px] text-red-400 font-bold mt-1 bg-red-950/50 px-2 py-0.5 rounded">Cupo lleno</span>
                )}
            </div>
        </div>
    )
}