import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Star } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { getPlanillaSeleccion, guardarPlanillaSeleccion, mensajeDeError } from '../../api/seleccionApi'

// Columnas que se cargan del box score (mismo criterio que la planilla de GES)
const COLUMNAS = [
    { key: 'puntos', label: 'PTS', ayuda: 'Puntos' },
    { key: 'tirosCampoFallados', label: 'TCF', ayuda: 'Tiros de campo fallados (dobles + triples): intentados - convertidos' },
    { key: 'tirosLibresFallados', label: 'TLF', ayuda: 'Tiros libres fallados' },
    { key: 'rebotesOfensivos', label: 'RO', ayuda: 'Rebotes ofensivos' },
    { key: 'rebotesDefensivos', label: 'RD', ayuda: 'Rebotes defensivos' },
    { key: 'asistencias', label: 'AS', ayuda: 'Asistencias' },
    { key: 'recuperaciones', label: 'REC', ayuda: 'Recuperos' },
    { key: 'perdidas', label: 'PER', ayuda: 'Pérdidas' },
    { key: 'taponesRealizados', label: 'TAP', ayuda: 'Tapones realizados' },
    { key: 'taponesRecibidos', label: 'TAPR', ayuda: 'Tapones recibidos' },
    { key: 'faltasCometidas', label: 'FC', ayuda: 'Faltas cometidas' },
    { key: 'faltasRecibidas', label: 'FR', ayuda: 'Faltas recibidas' },
]

const celda = 'w-12 bg-surface border border-border rounded-md px-1 py-1 text-center text-sm text-textMain tabular-nums focus:outline-none focus:border-primary'

/**
 * Carga manual del box score de un partido de la Selección. Al guardar, el backend calcula
 * valoración, MVP y puntaje fantasy (mismas reglas que la liga), recalcula el ranking y deja
 * el Relámpago finalizado. Se puede volver a abrir y guardar para corregir.
 */
export default function ModalPlanillaSeleccion({ evento, onCerrar, onGuardada }) {
    const showToast = useUiStore(state => state.showToast)
    const [planilla, setPlanilla] = useState(null)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        getPlanillaSeleccion(evento.id)
            .then(setPlanilla)
            .catch(error => {
                showToast(mensajeDeError(error, 'No se pudo cargar la planilla'), 'error')
                onCerrar()
            })
    }, [evento.id]) // eslint-disable-line react-hooks/exhaustive-deps

    const setFila = (jugadorId, cambios) => setPlanilla(p => ({
        ...p,
        jugadores: p.jugadores.map(f => f.jugadorId === jugadorId ? { ...f, ...cambios } : f),
    }))

    // Vacío = 0; solo enteros no negativos
    const numero = (valor) => {
        const n = parseInt(valor, 10)
        return Number.isNaN(n) || n < 0 ? 0 : n
    }

    const guardar = async () => {
        if (planilla.puntosLocal == null || planilla.puntosVisitante == null || planilla.puntosLocal === '' || planilla.puntosVisitante === '') {
            showToast('Cargá el resultado del partido', 'error')
            return
        }
        setGuardando(true)
        try {
            // Solo viajan los que jugaron (alguna stat o titular): el resto suma 0
            const jugaron = planilla.jugadores.filter(f => f.titular || f.valoracionManual != null || COLUMNAS.some(c => f[c.key] > 0))
            const guardada = await guardarPlanillaSeleccion(evento.id, {
                puntosLocal: Number(planilla.puntosLocal),
                puntosVisitante: Number(planilla.puntosVisitante),
                jugadores: jugaron,
            })
            setPlanilla(guardada)
            showToast('Planilla guardada: ranking actualizado', 'success')
            onGuardada?.()
        } catch (error) {
            showToast(mensajeDeError(error, 'No se pudo guardar la planilla'), 'error')
        } finally {
            setGuardando(false)
        }
    }

    const equipos = [
        { local: true, sigla: evento.localSigla, nombre: evento.localNombre, puntosKey: 'puntosLocal' },
        { local: false, sigla: evento.visitanteSigla, nombre: evento.visitanteNombre, puntosKey: 'puntosVisitante' },
    ]

    return createPortal(
        <>
            <div className="fixed inset-0 bg-black/70 z-40" onClick={onCerrar} />
            <div className="fixed inset-2 md:inset-8 bg-card border border-border rounded-3xl z-50 p-4 md:p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-textMain font-bold text-lg">Planilla {evento.localSigla} vs {evento.visitanteSigla}</h3>
                        <p className="text-textMuted text-xs">
                            Copiá el box score oficial. TCF = tiros de campo fallados (dobles + triples). VAL = valoración oficial (EFF de FIBA):
                            define el MVP; si la dejás vacía se calcula sola. Los que no jugaron se dejan en 0.
                        </p>
                    </div>
                    {planilla && (
                        <div className="flex items-center gap-2">
                            {equipos.map((eq, i) => (
                                <div key={eq.sigla} className="flex items-center gap-2">
                                    {i === 1 && <span className="text-textMuted font-bold">-</span>}
                                    <span className="text-textMain font-black text-sm">{eq.sigla}</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={planilla[eq.puntosKey] ?? ''}
                                        onChange={e => setPlanilla(p => ({ ...p, [eq.puntosKey]: e.target.value === '' ? '' : numero(e.target.value) }))}
                                        className={`${celda} w-16 text-base font-bold`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
                    {!planilla ? (
                        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : equipos.map(eq => (
                        <table key={eq.sigla} className="w-full text-sm mb-6">
                            <thead>
                                <tr className="text-textMuted text-[11px] uppercase tracking-wider">
                                    <th className="text-left py-2 pr-2 sticky left-0 bg-card">{eq.nombre}</th>
                                    <th className="px-1" title="Titular">Tit</th>
                                    {COLUMNAS.map(c => <th key={c.key} className="px-1" title={c.ayuda}>{c.label}</th>)}
                                    <th className="px-1" title="Valoración oficial (EFF de FIBA). Vacía = se calcula">VAL</th>
                                    <th className="px-1" title="Puntaje fantasy (calculado)">FAN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {planilla.jugadores.filter(f => f.esLocal === eq.local).map(f => (
                                    <tr key={f.jugadorId} className="border-t border-white/5">
                                        <td className="py-1.5 pr-2 sticky left-0 bg-card whitespace-nowrap">
                                            <span className="text-textMuted tabular-nums mr-2">#{f.numeroCamiseta}</span>
                                            <span className="text-textMain font-semibold">{f.nombreCompleto}</span>
                                            {f.fueMvp && <Star className="inline w-3.5 h-3.5 ml-1 text-warning fill-warning" />}
                                        </td>
                                        <td className="px-1 text-center">
                                            <input type="checkbox" checked={!!f.titular} onChange={e => setFila(f.jugadorId, { titular: e.target.checked })} className="w-4 h-4 accent-primary" />
                                        </td>
                                        {COLUMNAS.map(c => (
                                            <td key={c.key} className="px-1 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    inputMode="numeric"
                                                    value={f[c.key] || ''}
                                                    placeholder="0"
                                                    onChange={e => setFila(f.jugadorId, { [c.key]: numero(e.target.value) })}
                                                    onFocus={e => e.target.select()}
                                                    className={celda}
                                                />
                                            </td>
                                        ))}
                                        <td className="px-1 text-center">
                                            {/* Puede ser negativa. Vacía: se usa la calculada (se ve de placeholder) */}
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                value={f.valoracionManual ?? ''}
                                                placeholder={f.valoracion != null ? String(f.valoracion) : 'auto'}
                                                onChange={e => {
                                                    const n = parseInt(e.target.value, 10)
                                                    setFila(f.jugadorId, { valoracionManual: Number.isNaN(n) ? null : n })
                                                }}
                                                onFocus={e => e.target.select()}
                                                className={`${celda} border-accent/40`}
                                            />
                                        </td>
                                        <td className="px-1 text-center text-accent font-bold tabular-nums">{f.puntajeFantasy != null ? f.puntajeFantasy.toFixed(1) : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ))}
                </div>

                <div className="flex flex-col-reverse md:flex-row gap-2 md:justify-end">
                    <button onClick={onCerrar} className="px-6 py-3 text-textMuted text-sm font-medium">Cerrar</button>
                    <button
                        onClick={guardar}
                        disabled={!planilla || guardando}
                        className="px-6 py-3 bg-primary text-bg font-bold rounded-xl text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
                        Guardar y calcular puntos
                    </button>
                </div>
            </div>
        </>,
        document.body
    )
}
