import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { waiverApi } from '../../api/waiverApi'
import { realizarTransferencia } from '../../api/plantelApi'
import { useUiStore } from '../../store/uiStore'
import CamisetaSVG from '../jugador/CamisetaSVG'
import clsx from 'clsx'
export default function SeleccionarSalienteModal({ 
    torneoId, 
    jugadorEntrante, 
    plantelActivo,
    onCerrar, 
    onElegir 
}) {
    const [esFaseRestringida, setEsFaseRestringida] = useState(false)
    const [loading, setLoading] = useState(true)
    const { showToast } = useUiStore()

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const faseRes = await waiverApi.obtenerFaseRestringida()
                setEsFaseRestringida(faseRes)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchDatos()
    }, [])

    const isDT = jugadorEntrante.esDT;
    let jugadoresCompatibles = []
    
    if (isDT) {
        if (plantelActivo?.dt) {
            jugadoresCompatibles = [{
                ...plantelActivo.dt,
                id: plantelActivo.dt.dtId || plantelActivo.dt.id,
                jugadorRealId: plantelActivo.dt.dtId || plantelActivo.dt.id,
                posicion: 'DT'
            }]
        }
    } else {
        const ZONA_POS = {
            BASE: 'GUARD', ESCOLTA: 'GUARD',
            ALERO: 'FORWARD', ALA_PIVOT: 'FORWARD',
            PIVOT: 'CENTER'
        }
        const zonaEntrante = ZONA_POS[jugadorEntrante.posicion]
        jugadoresCompatibles = plantelActivo.jugadores.filter(j => ZONA_POS[j.posicion] === zonaEntrante)
    }

    const handleConfirmar = (saliente) => {
        onElegir(saliente);
    }

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/60 z-50" onClick={onCerrar} />
            <div className="fixed bottom-0 left-0 right-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto max-w-md mx-auto bg-card rounded-t-3xl md:rounded-3xl z-50 flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-textMain">Elegí a quién soltar</h2>
                        <p className="text-sm text-textMuted mt-1">
                            Entra: <span className="text-accent font-semibold">{jugadorEntrante.nombreCompleto}</span>
                        </p>
                    </div>
                    <button onClick={onCerrar} className="text-textMuted text-2xl px-2">&times;</button>
                </div>

                <div className="p-4 overflow-y-auto space-y-3 bg-surface/30">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : jugadoresCompatibles.length === 0 ? (
                        <p className="text-center text-textMuted text-sm mt-4">No tenés jugadores compatibles para soltar.</p>
                    ) : (
                        jugadoresCompatibles.map((j, i) => (
                            <div key={j.id ? `${j.id}-${i}` : i} className="p-3 bg-card rounded-xl border border-border flex items-center justify-between gap-3 shadow-sm hover:border-white/20 transition-colors">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="shrink-0">
                                        <CamisetaSVG 
                                            colorPrincipal={j.colorPrincipal}
                                            colorSecundario={j.colorSecundario}
                                            numero={isDT ? "DT" : j.numeroCamiseta}
                                            estado={j.estado}
                                            modelo={isDT ? 1 : j.modeloCamiseta}
                                            size={36}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-textMain font-bold text-sm truncate">{j.nombreCompleto || j.nombre}</p>
                                        <p className="text-textMuted text-xs truncate">{j.posicion} · {j.equipoSigla}</p>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0 md:mr-2">
                                        <span className="text-[10px] text-textMuted uppercase font-bold tracking-wider">Prom</span>
                                        <span className="font-bold text-sm text-textMain">{isDT ? (j.promedioFantasy || 0).toFixed(1) : (j.promedioPuntosUltimas3 || 0).toFixed(1)}</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleConfirmar(j)}
                                    className="bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1.5 rounded-lg text-sm font-semibold active:scale-95 transition-transform whitespace-nowrap shrink-0"
                                >
                                    Soltar
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>,
        document.body
    )
}
