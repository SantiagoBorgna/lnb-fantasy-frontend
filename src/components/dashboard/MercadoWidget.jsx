import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { waiverApi } from '../../api/waiverApi'
import { obtenerMisPropuestas } from '../../api/mercadoApi'
import { getPlantel } from '../../api/plantelApi'
import { getJornadaActiva } from '../../api/jornadaApi'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../ui/LoadingSpinner'

export default function MercadoWidget({ torneoId, miEquipoId }) {
    const navigate = useNavigate()
    const usuario = useAuthStore(state => state.usuario)
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!torneoId || !miEquipoId || !usuario?.id) return

        setLoading(true)
        Promise.allSettled([
            waiverApi.obtenerFaseRestringida(),
            waiverApi.obtenerMisReclamos(torneoId),
            obtenerMisPropuestas(torneoId, 0),
            waiverApi.obtenerOrdenPrioridad(torneoId),
            getPlantel(torneoId, usuario.id),
            getJornadaActiva()
        ]).then(([faseRes, reclamosRes, propuestasRes, prioridadRes, plantelRes, jornadaRes]) => {
            const fase = faseRes.status === 'fulfilled' ? faseRes.value : false;
            const reclamos = reclamosRes.status === 'fulfilled' ? reclamosRes.value : [];
            const propuestas = propuestasRes.status === 'fulfilled' ? (propuestasRes.value.content || propuestasRes.value || []) : [];
            const prioridadList = prioridadRes.status === 'fulfilled' ? prioridadRes.value : [];
            const plantel = plantelRes.status === 'fulfilled' ? plantelRes.value : null;
            const jornada = (jornadaRes && jornadaRes.status === 'fulfilled') ? jornadaRes.value : null;
            
            const isMercadoCerrado = jornada && (jornada.estado === 'EN_JUEGO' || jornada.estado === 'EN_CURSO');

            const miPrioridadIndex = prioridadList.findIndex(p => p.equipoVirtualId === miEquipoId);
            const miPrioridad = miPrioridadIndex !== -1 ? miPrioridadIndex + 1 : '-';

            const activas = propuestas.filter(p => p.estado === 'PENDIENTE');
            const enviadas = activas.filter(p => p.equipoProponenteId === miEquipoId).length;
            const recibidas = activas.filter(p => p.equipoReceptorId === miEquipoId).length;

            setStats({
                faseRestringida: fase,
                mercadoCerrado: isMercadoCerrado,
                reclamosActivos: reclamos.length,
                propuestasEnviadas: enviadas,
                propuestasRecibidas: recibidas,
                prioridad: miPrioridad,
                transferenciasRestantes: plantel ? plantel.transferenciasRestantes : 0
            });
        }).finally(() => setLoading(false))

    }, [torneoId, miEquipoId, usuario?.id])

    return (
        <div className="card space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
                <h3 className="text-textMain font-bold">Estado del Mercado</h3>
                {stats && (
                    <span className="text-xs font-semibold px-2 py-1 bg-surface border border-border rounded-lg text-textMuted">
                        {stats.mercadoCerrado ? 'Mercado cerrado' : stats.faseRestringida ? 'Agencia restringida' : 'Agencia libre'}
                    </span>
                )}
            </div>
            
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <LoadingSpinner />
                </div>
            ) : stats ? (
                <div className="flex-1 space-y-3 flex flex-col justify-center">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface rounded-xl p-3 border border-border flex flex-col items-center justify-center text-center">
                            <p className="text-textMain text-xl font-black">{stats.prioridad !== '-' ? `#${stats.prioridad}` : '-'}</p>
                            <p className="text-textMuted text-xs">Prioridad para reclamos</p>
                        </div>
                        <div className="bg-surface rounded-xl p-3 border border-border flex flex-col items-center justify-center text-center">
                            <p className="text-textMain text-xl font-black">{stats.reclamosActivos !== undefined ? stats.reclamosActivos : 0}<span className="text-sm text-textMuted font-bold">/3</span></p>
                            <p className="text-textMuted text-xs">Reclamos enviados</p>
                        </div>
                        
                        <div className="bg-surface rounded-xl p-3 border border-border flex flex-col items-center justify-center text-center">
                            <p className="text-textMain text-xl font-black">{stats.propuestasEnviadas !== undefined ? stats.propuestasEnviadas : 0}</p>
                            <p className="text-textMuted text-xs">Traspasos enviados</p>
                        </div>
                        <div className="bg-surface rounded-xl p-3 border border-border flex flex-col items-center justify-center text-center">
                            <p className="text-textMain text-xl font-black">{stats.propuestasRecibidas !== undefined ? stats.propuestasRecibidas : 0}</p>
                            <p className="text-textMuted text-xs">Traspasos recibidos</p>
                        </div>
                    </div>
                    
                    <div className="bg-surface rounded-xl p-3 border border-border flex flex-col items-center justify-center text-center">
                        <p className="text-textMain text-xl font-black">{stats.transferenciasRestantes !== undefined ? stats.transferenciasRestantes : 0} <span className="text-sm text-textMuted font-bold">/ 4</span></p>
                        <p className="text-textMuted text-xs">Transferencias restantes</p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-textMuted text-sm">
                    Información no disponible
                </div>
            )}

            <div className="mt-auto pt-4 shrink-0">
                <button onClick={() => navigate('/mercado')} className="btn-primary w-full">
                    Ver mercado
                </button>
            </div>
        </div>
    )
}
