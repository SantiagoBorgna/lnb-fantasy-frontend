import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { waiverApi } from '../../api/waiverApi'
import { realizarTransferencia } from '../../api/plantelApi'
import { useUiStore } from '../../store/uiStore'

export default function SeleccionarSalienteModal({ 
    torneoId, 
    jugadorEntrante, 
    plantelActivo,
    onCerrar, 
    onExito 
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

    const handleConfirmar = async (saliente) => {
        try {
            if (esFaseRestringida) {
                if (isDT) {
                    await waiverApi.registrarReclamo({
                        torneoId,
                        dtEntranteId: jugadorEntrante.id || jugadorEntrante.jugadorRealId,
                        dtSalienteId: saliente.dtId || saliente.id
                    })
                } else {
                    await waiverApi.registrarReclamo({
                        torneoId,
                        jugadorEntranteId: jugadorEntrante.id || jugadorEntrante.jugadorRealId,
                        jugadorSalienteId: saliente.jugadorRealId || saliente.id
                    })
                }
                showToast("Se creó tu reclamo exitosamente.");
            } else {
                if (isDT) {
                    const { cambiarDt } = await import('../../api/plantelApi')
                    await cambiarDt(jugadorEntrante.id || jugadorEntrante.jugadorRealId, torneoId)
                } else {
                    await realizarTransferencia({
                        jugadorSaleId: saliente.jugadorRealId || saliente.id,
                        jugadorEntraId: jugadorEntrante.id || jugadorEntrante.jugadorRealId,
                        torneoId: torneoId,
                        rolEntrante: saliente.rol
                    })
                }
                showToast("Fichaje exitoso.");
            }
            onExito()
        } catch (e) {
            showToast(e.response?.data?.mensaje || "Error al realizar el traspaso", "error")
            onCerrar()
        }
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
                            <div key={j.id ? `${j.id}-${i}` : i} className="bg-card border border-border rounded-xl p-3 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-sm text-textMain">{j.nombreCompleto || j.nombre}</p>
                                    <p className="text-xs text-textMuted">{j.posicion} · {j.equipoSigla}</p>
                                </div>
                                <button 
                                    onClick={() => handleConfirmar(j)}
                                    className="bg-red-500/20 text-red-400 border border-red-500/50 px-3 py-1.5 rounded-lg text-sm font-semibold active:scale-95 transition-transform"
                                >
                                    {esFaseRestringida ? 'Soltar y reclamar' : 'Soltar y fichar'}
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
