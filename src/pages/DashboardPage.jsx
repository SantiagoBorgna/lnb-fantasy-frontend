import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { useCountdown } from '../hooks/useCountdown'
import { getJornadaProxima, getJornadaActiva, getJornadas } from '../api/jornadaApi'
import { getPlantel } from '../api/plantelApi'
import {
    getRankingGlobal, getMiPosicion
} from '../api/rankingApi'
import { getTablaTorneo } from '../api/torneoApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import CamisetaSVG from '../components/jugador/CamisetaSVG'
import { useAyuda } from '../hooks/useAyuda'
import ModalAyuda from '../components/ui/ModalAyuda'
import BotonAyuda from '../components/ui/BotonAyuda'
import PerfilModal from '../components/ui/PerfilModal'
import { AYUDA } from '../components/ui/ayudaContenido'
import DashboardClasicoGlobal from '../components/dashboard/DashboardClasicoGlobal'
import DashboardDraftClasico from '../components/dashboard/DashboardDraftClasico'
import DashboardDraftH2H from '../components/dashboard/DashboardDraftH2H'
import SponsorsBanner from '../components/ui/SponsorsBanner'

export default function DashboardPage() {
    const usuario = useAuthStore(state => state.usuario)
    const { contextoActual, misLigasDraft } = useGameStore()

    const torneoActual = misLigasDraft?.find(t => t.id === contextoActual)

    const { abierto, abrir, cerrar } = useAyuda('dashboard')
    const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false)

    // ── Consultas Base ──
    const { data: activaData } = useQuery({ queryKey: ['jornadaActiva'], queryFn: getJornadaActiva })
    const { data: proximaData } = useQuery({ queryKey: ['jornadaProxima'], queryFn: getJornadaProxima })
    
    const { data: plantel, isFetching: loadingPlantel } = useQuery({ 
        queryKey: ['plantel', torneoActual?.id], 
        queryFn: () => getPlantel(torneoActual?.id)
    })

    const { data: jornadasRes } = useQuery({ queryKey: ['jornadas'], queryFn: getJornadas })
    
    const { data: rankGlobalRes, isFetching: loadingRank } = useQuery({
        queryKey: ['rankingGlobal', torneoActual?.id],
        queryFn: () => torneoActual ? getTablaTorneo(torneoActual.id) : getRankingGlobal(100)
    })

    const { data: miPosRes } = useQuery({
        queryKey: ['miPosicion'],
        queryFn: () => getMiPosicion(),
        enabled: !torneoActual
    })

    const jornadas = useMemo(() => {
        if (!jornadasRes) return [];
        return jornadasRes.filter(j => j.estado === 'FINALIZADA').sort((a, b) => b.numero - a.numero)
    }, [jornadasRes]);

    // ── Derivación de Datos ──
    const jornada = useMemo(() => {
        if (activaData && plantel && plantel.jornadaNumero === activaData.numero) return activaData;
        if (proximaData) return proximaData;
        if (activaData) return activaData;
        return null;
    }, [activaData, proximaData, plantel])

    const countdown = useCountdown(jornada?.fechaInicio)

    const [rankingGlobal, miPosicion] = useMemo(() => {
        if (!rankGlobalRes) return [[], null];
        
        if (torneoActual) {
            const miFila = rankGlobalRes.find(f => f.nombreUsuario === usuario?.nombreDisplay);
            return [rankGlobalRes, miFila || null];
        } else {
            const todos = rankGlobalRes;
            const top5 = todos.slice(0, 5);
            const yo = todos.find(f => f.nombreUsuario === usuario?.nombreDisplay);
            let resultRank = todos.slice(0, 6);
            if (yo && yo.posicion > 5) {
                resultRank = [...top5, yo];
            }
            return [resultRank, miPosRes || null];
        }
    }, [rankGlobalRes, miPosRes, torneoActual, usuario]);

    if (loadingPlantel && !plantel && loadingRank && !rankGlobalRes) {
        return <LoadingSpinner mensaje="Cargando dashboard..." />
    }

    return (
        <div className="space-y-4">
            {/* Banner Sponsors: Móvil (Arriba del perfil) */}
            <div className="md:hidden">
                <SponsorsBanner />
            </div>

            {/* ── Header ── */}
            <div className="flex items-center gap-3 !mt-0 md:!mt-2 cursor-pointer md:hover:opacity-80" onClick={() => setModalPerfilAbierto(true)}>
                <div className="w-12 h-12 rounded-full bg-primary flex items-center
                        justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
                    {usuario?.avatarUrl ? (
                        <img src={usuario.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                        usuario?.nombreDisplay?.charAt(0).toUpperCase() ?? '?'
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-textMuted text-xs">Bienvenido/a</p>
                    <h2 className="text-textMain font-bold text-lg truncate">
                        {usuario?.nombreDisplay ?? 'Mánager'}
                    </h2>
                </div>
                {usuario?.equipoFavoritoId && (
                    <div className="ml-auto shrink-0">
                        <CamisetaSVG
                            colorPrincipal={usuario.colorPrincipal}
                            colorSecundario={usuario.colorSecundario}
                            modelo={usuario.modeloCamiseta}
                            numero=""
                            size={44}
                            mostrarEstado={false}
                        />
                    </div>
                )}
                <div className="pl-2" onClick={e => e.stopPropagation()}>
                    <BotonAyuda onClick={abrir} />
                </div>
            </div>

            {/* ── Jornada + Countdown (Full Width) ── */}
            {jornada ? (
                <div className="card space-y-4 py-8">
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
                        <div className="text-center">
                            <h2 className="text-textMain font-black text-lg md:text-xl lg:text-3xl uppercase tracking-wider">
                                {jornada.estado === 'EN_JUEGO' ? `SE ESTÁ JUGANDO LA JORNADA ${jornada.numero}` : `LA PRÓXIMA JORNADA COMIENZA EN:`}
                            </h2>
                        </div>

                        {jornada.estado !== 'EN_JUEGO' && countdown && (
                            <div className="flex items-center gap-4">
                                {[
                                    { valor: countdown.dias, label: 'd' },
                                    { valor: countdown.horas, label: 'h' },
                                    { valor: countdown.minutos, label: 'm' },
                                    { valor: countdown.segundos, label: 's' },
                                ].map(({ valor, label }) => (
                                    <div key={label} className="flex items-baseline gap-1">
                                        <span className="text-accent font-black text-3xl lg:text-4xl tabular-nums">
                                            {String(valor).padStart(2, '0')}
                                        </span>
                                        <span className="text-accent font-bold text-xl lg:text-2xl">{label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="card text-center py-6">
                    <h2 className="text-textMain font-bold">No hay próximas jornadas</h2>
                    <p className="text-textMuted text-sm">El torneo aún no comenzó o ya finalizó.</p>
                </div>
            )}

            {/* 🏆 CONTENIDO DINÁMICO SEGÚN EL MODO DEL TORNEO 🏆 */}
            {!torneoActual ? (
                <DashboardClasicoGlobal
                    plantel={plantel}
                    miPosicion={miPosicion}
                    rankingGlobal={rankingGlobal}
                    jornadas={jornadas}
                    jornadaSelInicial={jornadas[0]?.id}
                />
            ) : torneoActual.tipoPuntuacion === 'H2H' ? (
                <DashboardDraftH2H
                    rankingGlobal={rankingGlobal}
                    contextoActual={torneoActual}
                />
            ) : (
                <DashboardDraftClasico
                    plantel={plantel}
                    miPosicion={miPosicion}
                    rankingGlobal={rankingGlobal}
                    contextoActual={torneoActual}
                />
            )}

            {/* Banner Sponsors: PC (Al fondo del dashboard) */}
            <div className="hidden md:block">
                <SponsorsBanner />
            </div>

            <ModalAyuda
                pagina="dashboard"
                contenido={AYUDA.dashboard}
                onCerrar={cerrar}
                abierto={abierto}
            />

            <PerfilModal 
                isOpen={modalPerfilAbierto} 
                onClose={() => setModalPerfilAbierto(false)} 
            />
        </div>
    )
}