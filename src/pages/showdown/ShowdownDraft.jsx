import { useState, useEffect } from 'react'
import { getShowdownMercado, participarShowdown } from '../../api/showdownApi'
import { Loader2, X, Plus, Users } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'

const POSICIONES = ['Base', 'Escolta', 'Alero', 'AlaPivot', 'Pivot']

export default function ShowdownDraft({ evento, codigo, uuidDispositivo, onParticiparSuccess }) {
    const showToast = useUiStore(state => state.showToast)
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [step, setStep] = useState(1) // 1: Datos, 2: Draft
    const [mercado, setMercado] = useState([])
    const [loadingMercado, setLoadingMercado] = useState(false)
    const [plantel, setPlantel] = useState({
        Base: null,
        Escolta: null,
        Alero: null,
        AlaPivot: null,
        Pivot: null
    })
    
    // Modal de selección
    const [posicionSeleccionando, setPosicionSeleccionando] = useState(null) // 'Base', 'Escolta', etc
    const [isSubmitting, setIsSubmitting] = useState(false)

    const presupuestoInicial = 50.0
    const presupuestoGastado = Object.values(plantel).reduce((acc, jug) => acc + (jug ? jug.valorMercadoActual : 0), 0)
    const presupuestoDisponible = presupuestoInicial - presupuestoGastado

    useEffect(() => {
        if (step === 2 && mercado.length === 0) {
            setLoadingMercado(true)
            getShowdownMercado(codigo)
                .then(setMercado)
                .catch(console.error)
                .finally(() => setLoadingMercado(false))
        }
    }, [step, codigo, mercado.length])

    const handleContinuar = (e) => {
        e.preventDefault()
        if (nombre.trim() && apellido.trim()) {
            setStep(2)
        }
    }

    const seleccionarJugador = (jugador) => {
        if (presupuestoDisponible < jugador.valorMercadoActual && !plantel[posicionSeleccionando]) {
            showToast("Presupuesto insuficiente", "error")
            return
        }
        
        // Si ya hay alguien en esa posicion, se suma el presupuesto del que sale
        const presupuestoRestanteConReemplazo = presupuestoDisponible + (plantel[posicionSeleccionando]?.valorMercadoActual || 0)
        if (presupuestoRestanteConReemplazo < jugador.valorMercadoActual) {
            showToast("Presupuesto insuficiente", "error")
            return
        }

        setPlantel(prev => ({
            ...prev,
            [posicionSeleccionando]: jugador
        }))
        setPosicionSeleccionando(null)
    }

    const removerJugador = (posicion) => {
        setPlantel(prev => ({
            ...prev,
            [posicion]: null
        }))
    }

    const guardarEquipo = async () => {
        if (Object.values(plantel).some(j => !j)) {
            showToast("Faltan jugadores en tu alineación", "error")
            return
        }

        setIsSubmitting(true)
        try {
            await participarShowdown(codigo, {
                nombre,
                apellido,
                uuidDispositivo,
                baseId: plantel.Base.id,
                escoltaId: plantel.Escolta.id,
                aleroId: plantel.Alero.id,
                alapivotId: plantel.AlaPivot.id,
                pivotId: plantel.Pivot.id
            })
            showToast("¡Alineación guardada!", "success")
            onParticiparSuccess()
        } catch (error) {
            showToast(error.response?.data?.message || "Error al guardar la alineación", "error")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Modal de selección
    const renderModalMercado = () => {
        if (!posicionSeleccionando) return null

        const jugadoresFiltrados = mercado.filter(j => j.posicion.toUpperCase() === posicionSeleccionando.toUpperCase())

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <div className="bg-surface border border-border w-full max-w-md rounded-2xl flex flex-col max-h-[80vh]">
                    <div className="p-4 border-b border-border flex items-center justify-between">
                        <h3 className="font-bold text-textMain text-lg">Elegir {posicionSeleccionando}</h3>
                        <button onClick={() => setPosicionSeleccionando(null)} className="text-textMuted hover:text-textMain">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="overflow-y-auto p-4 flex-1 space-y-2">
                        {loadingMercado ? (
                            <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                        ) : (
                            jugadoresFiltrados.map(jugador => {
                                // Calculamos si alcanza la plata (sumando lo que sale si reemplazamos)
                                const presupuestoReal = presupuestoDisponible + (plantel[posicionSeleccionando]?.valorMercadoActual || 0)
                                const alcanza = presupuestoReal >= jugador.valorMercadoActual
                                const yaElegido = Object.values(plantel).some(j => j?.id === jugador.id)

                                return (
                                    <div key={jugador.id} className="flex items-center bg-bg rounded-xl p-3 border border-border">
                                        <div className="flex-1">
                                            <div className="font-bold text-textMain">{jugador.nombreCompleto}</div>
                                            <div className="text-sm text-textMuted">{jugador.equipoReal.sigla}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="font-mono text-textMain font-medium">${jugador.valorMercadoActual}m</div>
                                            <button 
                                                disabled={!alcanza || yaElegido}
                                                onClick={() => seleccionarJugador(jugador)}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                                    yaElegido 
                                                    ? 'bg-border text-textMuted cursor-not-allowed'
                                                    : alcanza 
                                                        ? 'bg-primary text-bg hover:bg-primary/90' 
                                                        : 'bg-danger/20 text-danger cursor-not-allowed'
                                                }`}
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        )
    }

    if (step === 1) {
        return (
            <div className="min-h-screen bg-bg dark flex flex-col items-center justify-start pt-12 pb-4">
                <div className="w-full max-w-sm px-6">
                    <div className="flex justify-center mb-6">
                        <img src="/icons/logo-cuadrado.jpg" alt="Sexto Hombre Fantasy" className="w-40 h-40 object-cover rounded-3xl drop-shadow-xl" />
                    </div>
                    
                    <h1 className="text-3xl font-bold text-textMain text-center mb-2 tracking-tight">
                        Sexto Hombre Fantasy
                    </h1>
                    <p className="text-textMuted text-center mb-10 text-sm">
                        Ingresá tus datos para participar. ¡El mejor equipo de la noche tiene premio!
                    </p>

                    <form onSubmit={handleContinuar} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Nombre</label>
                            <input 
                                required
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors shadow-sm"
                                placeholder="Tu nombre"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Apellido</label>
                            <input 
                                required
                                value={apellido}
                                onChange={e => setApellido(e.target.value)}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors shadow-sm"
                                placeholder="Tu apellido"
                            />
                        </div>
                        <button type="submit" className="w-full bg-primary text-bg font-bold rounded-xl py-3.5 mt-6 hover:bg-primary/90 transition-colors shadow-md">
                            Continuar
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    // Step 2: Draft
    const isCompleto = Object.values(plantel).every(j => j !== null)

    return (
        <div className="min-h-screen bg-bg dark flex flex-col items-center p-4">
            {renderModalMercado()}
            
            <div className="w-full max-w-md flex flex-col min-h-full pb-20">
                {/* Header */}
                <div className="bg-surface rounded-2xl p-4 border border-border mb-4 flex items-center justify-between sticky top-4 z-10 shadow-lg">
                    <div>
                        <div className="text-xs text-textMuted uppercase tracking-wider font-bold mb-1">Presupuesto</div>
                        <div className="text-2xl font-mono font-bold text-textMain">${presupuestoDisponible.toFixed(1)}m</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs text-textMuted uppercase tracking-wider font-bold mb-1">Alineación</div>
                        <div className="text-sm font-medium text-textMain">{Object.values(plantel).filter(j=>j).length}/5</div>
                    </div>
                </div>

                {/* Slots */}
                <div className="space-y-3 flex-1">
                    {POSICIONES.map(posicion => {
                        const jugador = plantel[posicion]
                        return (
                            <div key={posicion} className="bg-surface border border-border rounded-2xl overflow-hidden">
                                {jugador ? (
                                    <div className="flex items-center p-3 relative">
                                        <button 
                                            onClick={() => removerJugador(posicion)}
                                            className="absolute top-2 right-2 text-textMuted hover:text-danger p-1 bg-bg/50 rounded-full"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                        <div className="w-12 h-12 bg-bg rounded-full flex items-center justify-center mr-4 shrink-0 overflow-hidden border border-border">
                                            {/* Si tuvieramos foto, aca va */}
                                            <span className="font-bold text-textMuted text-xs">{posicion.substring(0,3).toUpperCase()}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-xs text-primary font-bold uppercase tracking-wide">{posicion}</div>
                                            <div className="font-bold text-textMain text-lg leading-tight">{jugador.nombreCompleto}</div>
                                            <div className="text-sm text-textMuted">{jugador.equipoReal.sigla} • ${jugador.valorMercadoActual}m</div>
                                        </div>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setPosicionSeleccionando(posicion)}
                                        className="w-full flex items-center p-4 hover:bg-border/20 transition-colors text-left"
                                    >
                                        <div className="w-12 h-12 border-2 border-dashed border-border rounded-full flex items-center justify-center mr-4 text-textMuted shrink-0">
                                            <Plus className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="text-xs text-textMuted font-bold uppercase tracking-wide">{posicion}</div>
                                            <div className="font-medium text-textMain mt-0.5">Tocar para seleccionar</div>
                                        </div>
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Footer Action */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg/80 backdrop-blur-md border-t border-border flex justify-center">
                    <button 
                        disabled={!isCompleto || isSubmitting}
                        onClick={guardarEquipo}
                        className={`w-full max-w-md py-4 rounded-2xl font-bold text-lg flex items-center justify-center transition-all ${
                            isCompleto 
                                ? 'bg-primary text-bg shadow-lg shadow-primary/20 hover:bg-primary/90' 
                                : 'bg-surface text-textMuted border border-border'
                        }`}
                    >
                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Guardar Equipo"}
                    </button>
                </div>
            </div>
        </div>
    )
}
