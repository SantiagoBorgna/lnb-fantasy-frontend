import { useState, useEffect } from 'react'
import { getPlantel, getPlantelAjeno } from '../../api/plantelApi'
import { proponerTraspaso } from '../../api/mercadoApi'
import clsx from 'clsx'
import { useAuthStore } from '../../store/authStore'
import CamisetaSVG from '../jugador/CamisetaSVG'

export default function ProponerTraspasoWizard({ torneoId, equipoVirtualId, jornadaId, equipoReceptorNombre, onClose, onSuccess }) {
    const [step, setStep] = useState(1) // 1: Ajeno, 2: Propio, 3: Confirmación
    const [plantelAjeno, setPlantelAjeno] = useState(null)
    const [plantelPropio, setPlantelPropio] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const usuario = useAuthStore(state => state.usuario)
    
    const [seleccionadosAjenos, setSeleccionadosAjenos] = useState([]) // Ids
    const [seleccionadosPropios, setSeleccionadosPropios] = useState([]) // Ids
    const [dtAjeno, setDtAjeno] = useState(null) // Id
    const [dtPropio, setDtPropio] = useState(null) // Id

    const [enviando, setEnviando] = useState(false)

    useEffect(() => {
        setLoading(true)
        if (usuario?.id) {
            Promise.all([
                getPlantelAjeno(equipoVirtualId, jornadaId, torneoId),
                getPlantel(torneoId, usuario.id)
            ])
            .then(([ajenoData, propioData]) => {
                setPlantelAjeno(ajenoData)
                setPlantelPropio(propioData)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setError('Error al cargar los equipos. Verifica que el mercado esté abierto.')
                setLoading(false)
            })
        }
    }, [torneoId, equipoVirtualId, jornadaId, usuario])

    const toggleSeleccionAjena = (id) => {
        if (seleccionadosAjenos.includes(id)) {
            setSeleccionadosAjenos(prev => prev.filter(x => x !== id))
            setError('')
        } else {
            const transferenciasRestantes = plantelPropio?.transferenciasRestantes || 0;
            const currentQty = seleccionadosAjenos.length + (dtAjeno ? 1 : 0);
            if (currentQty >= transferenciasRestantes) {
                setError(`Solo tienes ${transferenciasRestantes} transferencias disponibles.`);
                return;
            }
            setError('')
            setSeleccionadosAjenos(prev => [...prev, id])
        }
    }

    const toggleDtAjeno = () => {
        if (dtAjeno) {
            setDtAjeno(null)
            setError('')
        } else {
            const transferenciasRestantes = plantelPropio?.transferenciasRestantes || 0;
            const currentQty = seleccionadosAjenos.length + (dtAjeno ? 1 : 0);
            if (currentQty >= transferenciasRestantes) {
                setError(`Solo tienes ${transferenciasRestantes} transferencias disponibles.`);
                return;
            }
            setError('')
            setDtAjeno(plantelAjeno.dt.dtId)
        }
    }

    const toggleSeleccionPropia = (id) => {
        if (seleccionadosPropios.includes(id)) {
            setSeleccionadosPropios(prev => prev.filter(x => x !== id))
            setError('')
        } else {
            const qtyAjenos = seleccionadosAjenos.length + (dtAjeno ? 1 : 0);
            const qtyPropios = seleccionadosPropios.length + (dtPropio ? 1 : 0);
            if (qtyPropios >= qtyAjenos) {
                setError(`Solo debes seleccionar ${qtyAjenos} elementos a cambio.`);
                return;
            }
            setError('')
            setSeleccionadosPropios(prev => [...prev, id])
        }
    }

    const toggleDtPropio = () => {
        if (dtPropio) {
            setDtPropio(null)
            setError('')
        } else {
            const qtyAjenos = seleccionadosAjenos.length + (dtAjeno ? 1 : 0);
            const qtyPropios = seleccionadosPropios.length + (dtPropio ? 1 : 0);
            if (qtyPropios >= qtyAjenos) {
                setError(`Solo debes seleccionar ${qtyAjenos} elementos a cambio.`);
                return;
            }
            setError('')
            setDtPropio(plantelPropio.dt.dtId)
        }
    }

    const handleRevisar = () => {
        if ((dtAjeno && !dtPropio) || (!dtAjeno && dtPropio)) {
            setError("Si incluyes un Director Técnico en el traspaso, debes recibir o dar un Director Técnico a cambio.");
            return;
        }
        setError('');
        setStep(3);
    }

    const handleEnviar = async () => {
        setEnviando(true)
        setError('')
        try {
            await proponerTraspaso(torneoId, {
                torneoId: Number(torneoId),
                equipoReceptorId: Number(equipoVirtualId),
                jugadoresOfrecidosIds: seleccionadosPropios,
                jugadoresSolicitadosIds: seleccionadosAjenos,
                dtOfrecidoId: dtPropio,
                dtSolicitadoId: dtAjeno
            })
            onSuccess()
        } catch (e) {
            setError(e.response?.data?.mensaje || 'Error al proponer traspaso')
            setEnviando(false)
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                <div className="bg-surface p-6 rounded-2xl w-full max-w-lg text-center shadow-lg border border-border">
                    <div className="w-8 h-8 mx-auto border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-textMuted mt-4">Cargando equipos...</p>
                </div>
            </div>
        )
    }

    const qtyAjenos = seleccionadosAjenos.length + (dtAjeno ? 1 : 0)
    const qtyPropios = seleccionadosPropios.length + (dtPropio ? 1 : 0)

    const canGoToStep2 = qtyAjenos > 0
    const canGoToStep3 = canGoToStep2 && qtyAjenos === qtyPropios

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <div className="bg-surface rounded-2xl w-full max-w-3xl shadow-lg border border-border flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-border flex flex-col">
                    <div className="flex items-center justify-between">
                        <h2 className="text-textMain font-bold text-lg">
                            Proponer Traspaso a {equipoReceptorNombre}
                        </h2>
                        <button onClick={onClose} className="text-textMuted hover:text-textMain text-xl leading-none">
                            &times;
                        </button>
                    </div>
                    {error && (
                        <div className="bg-red-400/10 border border-red-400/40 text-red-400 p-3 rounded-xl mt-3 text-sm font-medium shadow-sm">
                            {error}
                        </div>
                    )}
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {step === 1 && (
                        <div>
                            <p className="text-textMuted text-sm mb-4 text-center">
                                Selecciona qué jugadores o DT quieres de <strong>{equipoReceptorNombre}</strong>.
                            </p>
                            <div className="space-y-2">
                                {plantelAjeno?.jugadores?.map(j => (
                                    <div 
                                        key={j.jugadorRealId}
                                        onClick={() => toggleSeleccionAjena(j.jugadorRealId)}
                                        className={clsx(
                                            "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors",
                                            seleccionadosAjenos.includes(j.jugadorRealId) 
                                                ? "bg-primary/20 border-primary" 
                                                : "bg-card border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="shrink-0">
                                                <CamisetaSVG 
                                                    colorPrincipal={j.colorPrincipal}
                                                    colorSecundario={j.colorSecundario}
                                                    numero={j.numeroCamiseta}
                                                    estado={j.estado}
                                                    modelo={j.modeloCamiseta}
                                                    size={40}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-textMain text-sm truncate max-w-[150px] md:max-w-[200px]">{j.nombreCompleto}</p>
                                                <p className="text-xs text-textMuted">{j.posicion} · {j.equipoSigla}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">Prom</span>
                                            <span className="font-bold text-sm text-textMain">{(j.promedioPuntosUltimas3 || 0).toFixed(1)}</span>
                                        </div>
                                    </div>
                                ))}
                                {plantelAjeno?.dt && (
                                    <div 
                                        onClick={toggleDtAjeno}
                                        className={clsx(
                                            "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors mt-4",
                                            dtAjeno === plantelAjeno.dt.dtId 
                                                ? "bg-primary/20 border-primary" 
                                                : "bg-card border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="shrink-0">
                                                <CamisetaSVG 
                                                    colorPrincipal={plantelAjeno.dt.colorPrincipal}
                                                    colorSecundario={plantelAjeno.dt.colorSecundario}
                                                    numero="DT"
                                                    estado={plantelAjeno.dt.estado}
                                                    modelo={1}
                                                    size={40}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-textMain text-sm truncate max-w-[150px] md:max-w-[200px]">{plantelAjeno.dt.nombreCompleto}</p>
                                                <p className="text-xs text-textMuted">DT · {plantelAjeno.dt.equipoSigla}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">Prom</span>
                                            <span className="font-bold text-sm text-textMain">{(plantelAjeno.dt.promedioFantasy || 0).toFixed(1)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <p className="text-textMuted text-sm mb-4 text-center">
                                Selecciona qué jugadores o DT de tu equipo vas a dar a cambio.
                                Debes seleccionar exactamente <strong>{qtyAjenos}</strong> elementos. Llevas {qtyPropios}.
                            </p>
                            <div className="space-y-2">
                                {plantelPropio?.jugadores?.map(j => (
                                    <div 
                                        key={j.jugadorRealId}
                                        onClick={() => toggleSeleccionPropia(j.jugadorRealId)}
                                        className={clsx(
                                            "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors",
                                            seleccionadosPropios.includes(j.jugadorRealId) 
                                                ? "bg-primary/20 border-primary" 
                                                : "bg-card border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="shrink-0">
                                                <CamisetaSVG 
                                                    colorPrincipal={j.colorPrincipal}
                                                    colorSecundario={j.colorSecundario}
                                                    numero={j.numeroCamiseta}
                                                    estado={j.estado}
                                                    modelo={j.modeloCamiseta}
                                                    size={40}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-textMain text-sm truncate max-w-[150px] md:max-w-[200px]">{j.nombreCompleto}</p>
                                                <p className="text-xs text-textMuted">{j.posicion} · {j.equipoSigla}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">Prom</span>
                                            <span className="font-bold text-sm text-textMain">{(j.promedioPuntosUltimas3 || 0).toFixed(1)}</span>
                                        </div>
                                    </div>
                                ))}
                                {plantelPropio?.dt && (
                                    <div 
                                        onClick={toggleDtPropio}
                                        className={clsx(
                                            "p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors mt-4",
                                            dtPropio === plantelPropio.dt.dtId 
                                                ? "bg-primary/20 border-primary" 
                                                : "bg-card border-border hover:border-primary/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="shrink-0">
                                                <CamisetaSVG 
                                                    colorPrincipal={plantelPropio.dt.colorPrincipal}
                                                    colorSecundario={plantelPropio.dt.colorSecundario}
                                                    numero="DT"
                                                    estado={plantelPropio.dt.estado}
                                                    modelo={1}
                                                    size={40}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-bold text-textMain text-sm truncate max-w-[150px] md:max-w-[200px]">{plantelPropio.dt.nombreCompleto}</p>
                                                <p className="text-xs text-textMuted">DT · {plantelPropio.dt.equipoSigla}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">Prom</span>
                                            <span className="font-bold text-sm text-textMain">{(plantelPropio.dt.promedioFantasy || 0).toFixed(1)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <p className="text-textMuted text-sm mb-4 text-center">
                                Confirma la propuesta.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-textMuted uppercase tracking-wider text-center">Ofreces</p>
                                    <div className="space-y-2">
                                        {seleccionadosPropios.map(id => {
                                            const j = plantelPropio.jugadores.find(x => x.jugadorRealId === id)
                                            return (
                                                <div key={id} className="p-3 bg-card rounded-xl border border-border flex items-center gap-3">
                                                    <div className="shrink-0">
                                                        <CamisetaSVG 
                                                            colorPrincipal={j?.colorPrincipal}
                                                            colorSecundario={j?.colorSecundario}
                                                            numero={j?.numeroCamiseta}
                                                            estado={j?.estado}
                                                            modelo={j?.modeloCamiseta}
                                                            size={36}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-textMain font-bold text-sm truncate">{j?.nombreCompleto}</p>
                                                        <p className="text-textMuted text-xs">{j?.posicion} · {j?.equipoSigla}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {dtPropio && (
                                            <div className="p-3 bg-card rounded-xl border border-border flex items-center gap-3">
                                                <div className="shrink-0">
                                                    <CamisetaSVG 
                                                        colorPrincipal={plantelPropio.dt?.colorPrincipal}
                                                        colorSecundario={plantelPropio.dt?.colorSecundario}
                                                        numero="DT"
                                                        estado={plantelPropio.dt?.estado}
                                                        modelo={1}
                                                        size={36}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-textMain font-bold text-sm truncate">{plantelPropio.dt?.nombreCompleto}</p>
                                                    <p className="text-textMuted text-xs">DT · {plantelPropio.dt?.equipoSigla}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 mt-4 md:mt-0">
                                    <p className="text-xs font-bold text-textMuted uppercase tracking-wider text-center">Recibes</p>
                                    <div className="space-y-2">
                                        {seleccionadosAjenos.map(id => {
                                            const j = plantelAjeno.jugadores.find(x => x.jugadorRealId === id)
                                            return (
                                                <div key={id} className="p-3 bg-card rounded-xl border border-border flex items-center gap-3 shadow-sm">
                                                    <div className="shrink-0">
                                                        <CamisetaSVG 
                                                            colorPrincipal={j?.colorPrincipal}
                                                            colorSecundario={j?.colorSecundario}
                                                            numero={j?.numeroCamiseta}
                                                            estado={j?.estado}
                                                            modelo={j?.modeloCamiseta}
                                                            size={36}
                                                        />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-textMain font-bold text-sm truncate">{j?.nombreCompleto}</p>
                                                        <p className="text-textMuted text-xs">{j?.posicion} · {j?.equipoSigla}</p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {dtAjeno && (
                                            <div className="p-3 bg-card rounded-xl border border-border flex items-center gap-3 shadow-sm">
                                                <div className="shrink-0">
                                                    <CamisetaSVG 
                                                        colorPrincipal={plantelAjeno.dt?.colorPrincipal}
                                                        colorSecundario={plantelAjeno.dt?.colorSecundario}
                                                        numero="DT"
                                                        estado={plantelAjeno.dt?.estado}
                                                        modelo={1}
                                                        size={36}
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-textMain font-bold text-sm truncate">{plantelAjeno.dt?.nombreCompleto}</p>
                                                    <p className="text-textMuted text-xs">DT · {plantelAjeno.dt?.equipoSigla}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-border flex justify-between">
                    {step > 1 ? (
                        <button 
                            onClick={() => setStep(step - 1)}
                            className="px-4 py-2 text-sm text-textMain bg-card border border-border rounded-xl hover:bg-surface"
                        >
                            Atrás
                        </button>
                    ) : <div></div>}
                    
                    {step === 1 && (
                        <button 
                            onClick={() => setStep(2)}
                            disabled={!canGoToStep2}
                            className="px-4 py-2 text-sm text-white bg-primary rounded-xl font-bold disabled:opacity-50"
                        >
                            Siguiente ({qtyAjenos})
                        </button>
                    )}
                    {step === 2 && (
                        <button 
                            onClick={handleRevisar}
                            disabled={!canGoToStep3}
                            className="px-4 py-2 text-sm text-white bg-primary rounded-xl font-bold disabled:opacity-50"
                        >
                            Revisar
                        </button>
                    )}
                    {step === 3 && (
                        <button 
                            onClick={handleEnviar}
                            disabled={enviando}
                            className="px-4 py-2 text-sm text-white bg-primary rounded-xl font-bold disabled:opacity-50"
                        >
                            {enviando ? 'Enviando...' : 'Confirmar y Enviar'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
