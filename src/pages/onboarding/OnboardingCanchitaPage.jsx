import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useDraftStore } from '../../store/draftStore'
import { guardarPlantel } from '../../api/plantelApi'
import { getMe } from '../../api/authApi'
import CamisetaSVG from '../../components/jugador/CamisetaSVG'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

const FORMACIONES = ['1-2-2', '1-3-1', '2-1-2', '2-2-1', '3-1-1']

const ZONA_LABEL = {
    GUARD: 'Base / Escolta',
    FORWARD: 'Alero / Ala-Pivot',
    CENTER: 'Pivot',
}

const PRESUPUESTO_INICIAL = 100.0 // <-- Presupuesto fijo inicial

export default function OnboardingCanchitaPage() {
    const navigate = useNavigate()
    const { token, setAuth } = useAuthStore()
    const {
        formacion, slots, dt,
        setFormacion, setSlotPendiente,
        hacerCapitan, setDt, quitarJugador,
        estaCompleto, motivoIncompleto, resetDraft,
    } = useDraftStore()

    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')
    const [modalJugador, setModalJugador] = useState(null)
    const [modalDt, setModalDt] = useState(false)

    // ── Cálculo del Presupuesto ──
    const presupuestoGastado = slots.reduce((acc, slot) => {
        return acc + (slot?.jugador?.valorMercadoActual || 0)
    }, 0)
    const presupuestoRestante = PRESUPUESTO_INICIAL - presupuestoGastado
    const excedePresupuesto = presupuestoRestante < 0

    const titulares = slots.slice(0, 5)
    const banco = slots.slice(5)

    const filas = []
    let cursor = 0
    formacion.split('-').forEach(n => {
        filas.push(titulares.slice(cursor, cursor + Number(n)))
        cursor += Number(n)
    })

    const bancofila1 = banco.slice(0, 3)
    const bancofila2 = banco.slice(3)

    const handleSlotVacio = (slot) => {
        setSlotPendiente({ index: slot.index, zona: slot.zona })
        navigate('/onboarding/mercado')
    }

    const handleSlotLleno = (slot) => setModalJugador(slot)

    const handleGuardar = async () => {
        if (!estaCompleto() || excedePresupuesto) return
        setGuardando(true)
        setError('')

        try {
            await guardarPlantel({
                dtId: dt.id,
                formacion,
                jugadores: slots.map(s => ({
                    jugadorRealId: s.jugador.id,
                    rol: s.rol,
                }))
            })

            resetDraft()
            const usuarioActualizado = await getMe()
            setAuth(token, usuarioActualizado)
            navigate('/', { replace: true })
        } catch (e) {
            setError(e.response?.data?.mensaje ?? 'Error al guardar el equipo.')
        } finally {
            setGuardando(false)
        }
    }

    // Unimos los motivos del store con la validación de presupuesto local
    const motivos = motivoIncompleto() || []
    if (excedePresupuesto) {
        motivos.push(`Te excediste del presupuesto por ${Math.abs(presupuestoRestante).toFixed(1)} cr.`)
    }

    return (
        <div className="min-h-screen bg-surface flex flex-col">

            <div className="flex gap-2 px-6 pt-6 max-w-md mx-auto w-full">
                {[1, 2, 3].map(n => (
                    <div key={n} className="h-1 flex-1 rounded-full bg-accent" />
                ))}
            </div>

            <div className="px-4 pt-4 pb-2 max-w-md mx-auto w-full space-y-3">

                {/* Header Actualizado con Presupuesto */}
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-textMain font-black text-xl">Armá tu equipo 🏀</h2>
                        <p className="text-textMuted text-xs mt-0.5">
                            Tocá los slots vacíos para agregar jugadores.
                        </p>
                    </div>
                    <div className="text-right">
                        <p className={clsx(
                            "font-bold text-lg",
                            excedePresupuesto ? "text-red-400" : "text-accent"
                        )}>
                            {presupuestoRestante.toFixed(1)} cr
                        </p>
                        <p className="text-textMuted text-xs">disponibles</p>
                    </div>
                </div>

                <div>
                    <p className="text-textMuted text-xs font-semibold uppercase tracking-wide mb-2">
                        Formación
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {FORMACIONES.map(f => (
                            <button
                                key={f}
                                onClick={() => setFormacion(f)}
                                className={clsx(
                                    'pill shrink-0 transition-colors',
                                    formacion === f && 'pill-active'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => setModalDt(true)}
                    className={clsx(
                        'w-full flex items-center gap-3 p-3 rounded-2xl border',
                        'transition-colors',
                        dt ? 'bg-card border-border' : 'bg-primary/10 border-primary border-dashed'
                    )}
                >
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                        DT
                    </div>
                    <div className="flex-1 text-left">
                        {dt ? (
                            <>
                                <p className="text-textMain font-semibold text-sm">{dt.nombreCompleto}</p>
                                <p className="text-textMuted text-xs">{dt.equipoSigla}</p>
                            </>
                        ) : (
                            <p className="text-primary text-sm font-semibold">
                                + Elegir Director Técnico
                            </p>
                        )}
                    </div>
                    {dt && <span className="text-textMuted text-xs">cambiar</span>}
                </button>
            </div>

            {/* Cancha */}
            <div className="px-4 max-w-md mx-auto w-full">
                <div
                    className="relative rounded-3xl overflow-hidden h-[500px] shadow-inner border border-black/10"
                    style={{
                        backgroundColor: '#e29b5a',
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.06) 40px, rgba(0,0,0,0.06) 80px)'
                    }}
                >
                    <div className="absolute inset-0 pointer-events-none border-2 border-black/50 m-2 rotate-180">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[88%] max-w-[340px] h-[280px] border-x-2 border-b-2 border-black/50 rounded-b-[150px]" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[130px] h-[190px] border-x-2 border-b-2 border-black/50 bg-black/5" />
                        <div className="absolute top-[190px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] border-2 border-black/50 rounded-full" />
                        <div className="absolute top-[80px] left-1/2 -translate-x-[73px] w-2 h-[2px] bg-black/50" />
                        <div className="absolute top-[110px] left-1/2 -translate-x-[73px] w-2 h-[2px] bg-black/50" />
                        <div className="absolute top-[140px] left-1/2 -translate-x-[73px] w-2 h-[2px] bg-black/50" />
                        <div className="absolute top-[80px] left-1/2 translate-x-[65px] w-2 h-[2px] bg-black/50" />
                        <div className="absolute top-[110px] left-1/2 translate-x-[65px] w-2 h-[2px] bg-black/50" />
                        <div className="absolute top-[140px] left-1/2 translate-x-[65px] w-2 h-[2px] bg-black/50" />
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-14 h-1 bg-black/60" />
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-5 h-5 border-2 border-black/60 rounded-full" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140px] h-[70px] border-x-2 border-t-2 border-black/50 rounded-t-[70px]" />
                    </div>

                    <div className="relative z-10 py-6 px-1 flex flex-col justify-between h-full">
                        {filas.map((fila, filaIdx) => (
                            <div key={filaIdx} className="flex justify-center gap-x-8 items-start">
                                {fila.map(slot => (
                                    slot.jugador
                                        ? <SlotLleno key={slot.index} slot={slot} onTap={() => handleSlotLleno(slot)} />
                                        : <SlotVacio key={slot.index} slot={slot} onTap={() => handleSlotVacio(slot)} />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Banco */}
            <div className="px-4 pt-4 max-w-md mx-auto w-full space-y-6">
                <p className="text-textMuted text-xs font-semibold uppercase tracking-wide text-center">
                    Banco de Suplentes
                </p>

                {[bancofila1, bancofila2].map((fila, fi) => (
                    <div key={fi} className="flex justify-center gap-x-8">
                        {fila.map(slot => (
                            slot.jugador
                                ? <SlotLleno key={slot.index} slot={slot} onTap={() => handleSlotLleno(slot)} />
                                : <SlotVacio key={slot.index} slot={slot} onTap={() => handleSlotVacio(slot)} />
                        ))}
                    </div>
                ))}
            </div>

            {/* Validaciones + Guardar */}
            <div className="px-4 pb-8 pt-6 max-w-md mx-auto w-full space-y-3">
                {motivos.length > 0 && (
                    <div className="space-y-1 mb-2">
                        {motivos.map(m => (
                            <div key={m} className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                                <p className={clsx("text-xs font-medium", m.includes('presupuesto') ? "text-red-400" : "text-textMuted")}>
                                    {m}
                                </p>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                )}

                <button
                    onClick={handleGuardar}
                    disabled={!estaCompleto() || guardando || excedePresupuesto}
                    className="btn-accent w-full disabled:opacity-40 disabled:cursor-not-allowed h-12 text-base font-bold shadow-lg"
                >
                    {guardando ? 'Guardando...' : 'Comenzar a jugar'}
                </button>
            </div>

            {/* Modales (Jugador y DT) siguen igual */}
            {modalJugador && createPortal(
                <>
                    <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setModalJugador(null)} />
                    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border rounded-t-3xl z-50 p-6 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                        <div className="flex items-center gap-4">
                            <CamisetaSVG
                                colorPrincipal={modalJugador.jugador.colorPrincipal}
                                colorSecundario={modalJugador.jugador.colorSecundario}
                                modelo={modalJugador.jugador.modeloCamiseta}
                                numero={modalJugador.jugador.numeroCamiseta}
                                estado={modalJugador.jugador.estado}
                                size={56}
                            />
                            <div>
                                <p className="text-textMain font-bold">{modalJugador.jugador.nombreCompleto}</p>
                                <p className="text-textMuted text-sm">{modalJugador.jugador.equipoSigla} · {modalJugador.jugador.posicion}</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {['TITULAR', 'CAPITAN'].includes(modalJugador.rol) && modalJugador.rol !== 'CAPITAN' && (
                                <button
                                    onClick={() => { hacerCapitan(modalJugador.jugador.id); setModalJugador(null) }}
                                    className="w-full py-3 px-4 rounded-xl font-bold bg-transparent border-2 border-yellow-400 text-yellow-400 active:scale-95 transition-transform"
                                >
                                    Hacer Capitán
                                </button>
                            )}
                            <button
                                onClick={() => { quitarJugador(modalJugador.index); setModalJugador(null) }}
                                className="w-full py-3 px-4 rounded-xl font-bold bg-transparent border-2 border-accent text-accent active:scale-95 transition-transform"
                            >
                                Quitar del equipo
                            </button>
                            <button onClick={() => setModalJugador(null)} className="w-full py-2 text-textMuted text-sm font-medium">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {modalDt && (
                <ModalDt onElegir={(dtElegido) => { setDt(dtElegido); setModalDt(false) }} onCerrar={() => setModalDt(false)} />
            )}
        </div>
    )
}

function SlotVacio({ slot, onTap }) {
    return (
        <button onClick={onTap} className="w-[90px] h-[105px] rounded-2xl bg-white/10 border-2 border-white/30 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:bg-white/20">
            <span className="text-white/60 text-2xl">+</span>
            <span className="text-white/50 text-xs text-center leading-tight px-1 font-medium">{ZONA_LABEL[slot.zona]}</span>
        </button>
    )
}

function SlotLleno({ slot, onTap }) {
    const { jugador, rol } = slot
    const esCap = rol === 'CAPITAN'
    const esSexto = rol === 'SEXTO_HOMBRE'

    const partes = jugador.nombreCompleto?.split(',') ?? ['?']
    const apellido = partes[0].trim()
    const inicial = partes[1]?.trim().charAt(0) ?? ''
    const etiqueta = inicial ? `${apellido}, ${inicial}.` : apellido

    return (
        <div onClick={onTap} className={clsx('relative w-[90px] h-[105px] rounded-2xl flex flex-col items-center justify-between p-2 cursor-pointer', esSexto ? 'bg-accent/25 ring-1 ring-accent/60' : 'bg-white/15')}>
            {esCap && (
                <div className="absolute -top-1.5 -right-1.5 z-10 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center ring-2 ring-surface shadow-md">
                    <span className="text-surface text-xs font-black">C</span>
                </div>
            )}
            <CamisetaSVG
                colorPrincipal={jugador.colorPrincipal}
                colorSecundario={jugador.colorSecundario}
                modelo={jugador.modeloCamiseta}
                numero={jugador.numeroCamiseta}
                estado={jugador.estado}
                size={56}
            />
            <span className="text-white text-[11px] font-bold text-center w-full truncate leading-tight drop-shadow-md">{etiqueta}</span>
            <span className="text-white/70 text-[10px] font-medium">{jugador.valorMercadoActual?.toFixed(1)} cr</span>
        </div>
    )
}

import { useEffect, useState as useStateLocal } from 'react'
import { getDts } from '../../api/dtApi'

function ModalDt({ onElegir, onCerrar }) {
    const [dts, setDts] = useStateLocal([])
    const [loading, setLoading] = useStateLocal(true)

    useEffect(() => {
        getDts().then(setDts).finally(() => setLoading(false))
    }, [])

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-40" onClick={onCerrar} />
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border rounded-t-3xl z-50 p-6 space-y-4 animate-slide-up max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-border rounded-full mx-auto" />
                <h3 className="text-textMain font-bold text-lg">Elegir Director Técnico</h3>
                {loading ? <LoadingSpinner /> : (
                    <div className="space-y-2">
                        {dts.map(dt => (
                            <button key={dt.id} onClick={() => onElegir(dt)} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border hover:border-primary transition-colors text-left active:scale-[0.98]">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0">DT</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-textMain font-semibold text-sm truncate">{dt.nombreCompleto}</p>
                                    <p className="text-textMuted text-xs">{dt.equipoNombre} · {dt.nacionalidad}</p>
                                </div>
                                <span className="text-accent text-sm font-semibold">Elegir</span>
                            </button>
                        ))}
                    </div>
                )}
                <button onClick={onCerrar} className="w-full py-2 text-textMuted text-sm font-medium">Cancelar</button>
            </div>
        </>,
        document.body
    )
}