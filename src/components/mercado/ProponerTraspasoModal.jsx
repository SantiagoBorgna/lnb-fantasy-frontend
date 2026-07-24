import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getMercadoLibres } from '../../api/mercadoApi'
import { waiverApi } from '../../api/waiverApi'
import { realizarTransferencia } from '../../api/plantelApi'
import LoadingSpinner from '../ui/LoadingSpinner'
import { useUiStore } from '../../store/uiStore'

export default function ProponerTraspasoModal({ 
    torneoId, 
    jugadorSaliente, 
    onCerrar, 
    onExito 
}) {
    const { showToast } = useUiStore()
    const [libres, setLibres] = useState([])
    const [loading, setLoading] = useState(true)
    const [esFaseRestringida, setEsFaseRestringida] = useState(false)
    const [busqueda, setBusqueda] = useState('')

    useEffect(() => {
        const fetchDatos = async () => {
            try {
                const [faseRes, libresRes] = await Promise.all([
                    waiverApi.obtenerFaseRestringida(),
                    getMercadoLibres(torneoId, { posicion: jugadorSaliente.posicion })
                ])
                setEsFaseRestringida(faseRes)
                setLibres(libresRes)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchDatos()
    }, [torneoId, jugadorSaliente])

    const filtrados = libres.filter(j => 
        j.nombreCompleto?.toLowerCase().includes(busqueda.toLowerCase())
    ).slice(0, 50)

    const handleConfirmar = async (entrante) => {
        try {
            if (esFaseRestringida) {
                await waiverApi.registrarReclamo({
                    torneoId,
                    jugadorEntranteId: entrante.id || entrante.jugadorRealId,
                    jugadorSalienteId: jugadorSaliente.jugadorRealId
                })
                showToast("Se creó tu reclamo exitosamente.");
            } else {
                await realizarTransferencia({
                    torneoId: torneoId,
                    jugadorSaleId: jugadorSaliente.jugadorRealId,
                    jugadorEntraId: entrante.id || entrante.jugadorRealId,
                    rolEntrante: jugadorSaliente.rol || 'SUPLENTE'
                })
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
            <div className="fixed bottom-0 left-0 right-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto max-w-md mx-auto bg-card rounded-t-3xl md:rounded-3xl z-50 flex flex-col h-[80vh] md:h-[600px] max-h-[100dvh]">
                <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-textMain">Proponer traspaso</h2>
                        <p className="text-sm text-textMuted mt-1">Sale: <span className="text-white font-semibold">{jugadorSaliente.nombreCompleto}</span></p>
                    </div>
                    <button onClick={onCerrar} className="text-textMuted text-2xl px-2">&times;</button>
                </div>
                
                <div className="p-4 shrink-0">
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre..." 
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl px-4 py-2.5 text-textMain outline-none focus:border-primary"
                    />
                </div>

                <div className="p-4 overflow-y-auto space-y-3 flex-1 scrollbar-hide bg-surface/30">
                    {loading ? (
                        <LoadingSpinner mensaje="Buscando agentes libres..." />
                    ) : filtrados.length === 0 ? (
                        <p className="text-center text-textMuted text-sm mt-4">No se encontraron agentes libres.</p>
                    ) : (
                        filtrados.map((j, i) => (
                            <div key={j.id ? `${j.id}-${i}` : i} className="bg-card border border-border rounded-xl p-3 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-sm text-textMain">{j.nombreCompleto}</p>
                                    <p className="text-xs text-textMuted">{j.posicion} · {j.equipoSigla}</p>
                                </div>
                                <button 
                                    onClick={() => handleConfirmar(j)}
                                    className="bg-primary/20 text-primary border border-primary px-3 py-1.5 rounded-lg text-sm font-semibold active:scale-95 transition-transform"
                                >
                                    {esFaseRestringida ? 'Reclamar' : 'Fichar libre'}
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
