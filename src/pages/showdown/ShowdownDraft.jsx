import { useState, useEffect } from 'react'
import { getShowdownMercado, participarShowdown } from '../../api/showdownApi'
import { HelpCircle, X, Loader2, Star, Trash2 } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import ShowdownCanchita from '../../components/showdown/ShowdownCanchita'
import ShowdownSlotAccionesModal from '../../components/showdown/ShowdownSlotAccionesModal'
import ShowdownReglasModal from '../../components/showdown/ShowdownReglasModal'
import CamisetaSVG from '../../components/jugador/CamisetaSVG'

const POSICIONES = ['Base', 'Escolta', 'Alero', 'AlaPivot', 'Pivot']

export default function ShowdownDraft({ evento, codigo, uuidDispositivo, onParticiparSuccess }) {
    const showToast = useUiStore(state => state.showToast)
    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [email, setEmail] = useState('')
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
    const [capitanId, setCapitanId] = useState(null)
    const [jugadorAFichar, setJugadorAFichar] = useState(null)
    const [slotSeleccionado, setSlotSeleccionado] = useState(null)
    const [modalReglasOpen, setModalReglasOpen] = useState(false)

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
        if (plantel[posicion]?.id === capitanId) {
            setCapitanId(null)
        }
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

        if (!capitanId) {
            showToast("Debés elegir un capitán", "error")
            return
        }

        setIsSubmitting(true)
        try {
            await participarShowdown(codigo, {
                nombre,
                apellido,
                email,
                capitanId,
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

        const jugadoresFiltrados = mercado.filter(j => j.posicion.toUpperCase().replace('_', '') === posicionSeleccionando.toUpperCase())

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-bg border border-border w-full max-w-md rounded-[32px] flex flex-col max-h-[80vh] shadow-2xl overflow-hidden relative">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between bg-surface">
                        <div>
                            <h3 className="font-bold text-white text-xl">Elegir jugador</h3>
                            <p className="text-sm text-textMuted uppercase tracking-wider font-semibold">{posicionSeleccionando.replace('AlaPivot', 'Ala Pivot')}</p>
                        </div>
                        <button onClick={() => setPosicionSeleccionando(null)} className="text-textMuted hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="p-4 bg-surface-lighter flex justify-between items-center text-base">
                        <span className="text-textMuted font-bold">Presupuesto</span>
                        <span className="font-bold text-accent text-lg">{(presupuestoDisponible + (plantel[posicionSeleccionando]?.valorMercadoActual || 0)).toFixed(1)}cr</span>
                    </div>

                    <div className="overflow-y-auto p-4 flex-1 space-y-3 custom-scrollbar bg-bg">
                        {loadingMercado ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
                        ) : (
                            jugadoresFiltrados.map(jugador => {
                                const presupuestoReal = presupuestoDisponible + (plantel[posicionSeleccionando]?.valorMercadoActual || 0)
                                const alcanza = presupuestoReal >= jugador.valorMercadoActual
                                const yaElegido = Object.values(plantel).some(j => j?.id === jugador.id)

                                return (
                                    <div 
                                        key={jugador.id} 
                                        onClick={() => {
                                            if (alcanza && !yaElegido) setJugadorAFichar(jugador);
                                        }}
                                        className={`p-3 bg-card rounded-xl border flex items-center justify-between gap-3 shadow-sm transition-colors ${alcanza && !yaElegido ? 'border-border hover:border-white/20 cursor-pointer' : 'border-red-500/10 opacity-60 cursor-not-allowed'}`}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className="shrink-0">
                                                <CamisetaSVG 
                                                    colorPrincipal={jugador.equipoReal?.colorPrincipal}
                                                    colorSecundario={jugador.equipoReal?.colorSecundario}
                                                    numero={jugador.numeroCamiseta}
                                                    estado={jugador.estado}
                                                    modelo={jugador.equipoReal?.modeloCamiseta}
                                                    size={36}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-textMain font-bold text-sm truncate">{jugador.nombreCompleto}</p>
                                                <p className="text-textMuted text-xs truncate">{jugador.posicion.replace('_', ' ')} · {jugador.equipoReal?.sigla || jugador.equipoSigla}</p>
                                            </div>
                                            <div className="flex flex-col items-end shrink-0 md:mr-2">
                                                <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">Valor</span>
                                                <span className="font-bold text-sm text-textMain">{jugador.valorMercadoActual}cr</span>
                                            </div>
                                        </div>
                                        {yaElegido && <span className="text-[10px] font-bold text-textMuted bg-white/5 px-2 py-1 rounded shrink-0 uppercase tracking-wider">En Equipo</span>}
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {jugadorAFichar && (
                        <div className="absolute inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200" onClick={() => setJugadorAFichar(null)}>
                            <div className="bg-card border border-border w-full max-w-[280px] rounded-3xl p-6 shadow-2xl flex flex-col gap-5" onClick={e => e.stopPropagation()}>
                                <div className="text-center">
                                    <h3 className="font-bold text-white text-lg">¿Fichar a {jugadorAFichar.nombreCompleto}?</h3>
                                    <p className="text-textMuted text-sm mt-1">Se descontarán ${jugadorAFichar.valorMercadoActual}m</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button 
                                        onClick={() => {
                                            seleccionarJugador(jugadorAFichar);
                                            setJugadorAFichar(null);
                                        }}
                                        className="w-full py-3 font-semibold text-bg bg-primary rounded-xl hover:bg-primary/90 transition-colors"
                                    >
                                        Fichar
                                    </button>
                                    <button 
                                        onClick={() => setJugadorAFichar(null)}
                                        className="w-full py-3 font-semibold text-textMuted bg-transparent hover:bg-surface border border-border rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    if (step === 1) {
        return (
            <div className="min-h-[100dvh] bg-bg dark flex flex-col items-center justify-start pt-12">
                <div className="w-full max-w-sm px-6 pb-8">
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
                        <div>
                            <label className="block text-sm font-medium text-textMain mb-1.5 ml-1">Email</label>
                            <input 
                                required
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-textMain focus:outline-none focus:border-primary transition-colors shadow-sm"
                                placeholder="tu@email.com"
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
    const excedePresupuesto = presupuestoDisponible < 0
    const faltanJugadoresCount = Object.values(plantel).filter(j => j === null).length
    const faltanJugadoresText = faltanJugadoresCount > 0 ? `Faltan ${faltanJugadoresCount} jugador${faltanJugadoresCount !== 1 ? 'es' : ''}` : null
    const motivos = [faltanJugadoresText, !capitanId && 'Falta elegir capitán', excedePresupuesto && `Te excediste del presupuesto por ${Math.abs(presupuestoDisponible).toFixed(1)} cr.`].filter(Boolean)

    return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-0 md:p-8">
            {renderModalMercado()}
            
            <ShowdownReglasModal 
                isOpen={modalReglasOpen} 
                onClose={() => setModalReglasOpen(false)} 
            />

            <ShowdownSlotAccionesModal 
                isOpen={!!slotSeleccionado}
                onClose={() => setSlotSeleccionado(null)}
                posicion={slotSeleccionado?.zona}
                jugador={slotSeleccionado?.jugador}
                esCapitan={capitanId === slotSeleccionado?.jugador?.id}
                onElegirCapitan={() => setCapitanId(slotSeleccionado?.jugador?.id)}
                onQuitar={() => {
                    removerJugador(slotSeleccionado?.zona);
                }}
            />

            <div className="w-full max-w-2xl bg-surface md:bg-card border-none md:border md:border-border rounded-none md:rounded-3xl flex flex-col shadow-none md:shadow-xl min-h-screen md:min-h-0 md:h-[90vh] overflow-y-auto custom-scrollbar relative pb-6 md:pb-10">
                {/* Progress Bar simulada del onboarding o header space */}
                <div className="relative flex justify-center items-center px-6 pt-6 md:pt-10 max-w-md mx-auto w-full shrink-0">
                    <button 
                        onClick={() => setModalReglasOpen(true)}
                        className="absolute left-6 top-6 md:top-10 w-8 h-8 rounded-full bg-border flex items-center justify-center text-textMain font-bold hover:bg-border/80 transition-colors shrink-0"
                    >
                        ?
                    </button>
                    <div className="text-center">
                        <h1 className="text-textMain font-black text-lg">
                            {evento?.localNombre?.replace(' (O)', '') || 'Independiente'} vs {evento?.visitanteNombre?.replace(' (O)', '') || 'Visitante'}
                        </h1>
                        {evento?.fecha && (
                            <p className="text-textMuted text-xs font-medium mt-0.5">
                                {new Date(evento.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                        )}
                    </div>
                </div>

                <div className="px-4 pt-4 pb-2 max-w-md mx-auto w-full space-y-3">
                    {/* Header estilo Onboarding */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-textMain font-black text-xl">Armá tu equipo</h2>
                            <p className="text-textMuted text-xs mt-0.5">
                                Tocá los espacios vacíos para agregar jugadores.
                            </p>
                        </div>
                        <div className="text-right">
                            <p className={`font-bold text-lg ${excedePresupuesto ? "text-red-400" : "text-accent"}`}>
                                {presupuestoDisponible.toFixed(1)}cr
                            </p>
                            <p className="text-textMuted text-xs">disponibles</p>
                        </div>
                    </div>
                </div>

                {/* Canchita */}
                <div className="flex-1 flex flex-col items-center mt-2">
                    <ShowdownCanchita 
                        plantel={plantel}
                        capitanId={capitanId}
                        onSlotVacioTap={(slot) => setPosicionSeleccionando(slot.zona)}
                        onSlotLlenoTap={(slot) => setSlotSeleccionado(slot)}
                    />
                </div>

                {/* Footer Action (Validaciones + Guardar) */}
                <div className="px-4 pb-8 pt-6 max-w-md mx-auto w-full space-y-4">
                    <div className="space-y-2 bg-surface border border-border p-4 rounded-2xl">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${isCompleto ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-white/20"}`} />
                            <p className={`text-xs font-medium transition-colors ${isCompleto ? "text-green-400" : "text-textMuted"}`}>
                                5 jugadores seleccionados
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 transition-colors ${!!capitanId ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-white/20"}`} />
                            <p className={`text-xs font-medium transition-colors ${!!capitanId ? "text-green-400" : "text-textMuted"}`}>
                                Capitán designado
                            </p>
                        </div>
                    </div>

                    <button 
                        disabled={!isCompleto || !capitanId || excedePresupuesto || isSubmitting}
                        onClick={guardarEquipo}
                        className="btn-accent w-full disabled:opacity-40 disabled:cursor-not-allowed h-12 text-base font-bold shadow-lg flex items-center justify-center"
                    >
                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Guardar equipo"}
                    </button>
                </div>
            </div>
        </div>
    )
}
