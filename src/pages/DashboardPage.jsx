import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useGameStore } from '../store/gameStore'
import { useCountdown } from '../hooks/useCountdown'
import { getJornadaProxima, getJornadaActiva, getJornadas } from '../api/jornadaApi'
import { getPlantel } from '../api/plantelApi'
import {
    getRankingGlobal, getRankingJornada, getMiPosicion
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

export default function DashboardPage() {
    const usuario = useAuthStore(state => state.usuario)
    const { contextoActual, misLigasDraft } = useGameStore()
    const navigate = useNavigate()

    const torneoActual = misLigasDraft?.find(t => t.id === contextoActual)

    const [jornada, setJornada] = useState(null)
    const [plantel, setPlantel] = useState(null)
    const [rankingGlobal, setRankingGlobal] = useState([])
    const [rankingFecha, setRankingFecha] = useState([])
    const [miPosicion, setMiPosicion] = useState(null)
    const [jornadas, setJornadas] = useState([])
    const [jornadaSel, setJornadaSel] = useState(null)
    const [loading, setLoading] = useState(true)
    const { abierto, abrir, cerrar } = useAyuda('dashboard')
    const [modalPerfilAbierto, setModalPerfilAbierto] = useState(false)

    const countdown = useCountdown(jornada?.fechaInicio)

    useEffect(() => {
        if (!jornadaSel) return
        getRankingJornada(jornadaSel, 100).then(todos => {
            const top5 = todos.slice(0, 5);
            const yo = todos.find(f => f.nombreUsuario === usuario?.nombreDisplay);
            if (yo && yo.posicion > 5) {
                setRankingFecha([...top5, yo]);
            } else {
                setRankingFecha(todos.slice(0, 6));
            }
        }).catch(() => { })
    }, [jornadaSel, usuario])

    useEffect(() => {
        setLoading(true)
        Promise.allSettled([
            getJornadaActiva(),
            getJornadaProxima(),
            getPlantel(torneoActual?.id),
            torneoActual ? getTablaTorneo(torneoActual.id) : getRankingGlobal(100),
            !torneoActual ? getMiPosicion() : Promise.resolve(null),
            getJornadas(),
        ]).then(([activa, proxima, plantelRes, rankGlobal, miPos, jornadasRes]) => {

            const activaData = activa.status === 'fulfilled' && activa.value ? activa.value : null;
            const proximaData = proxima.status === 'fulfilled' && proxima.value ? proxima.value : null;

            let plantelData = null;
            if (plantelRes.status === 'fulfilled') {
                plantelData = plantelRes.value;
                setPlantel(plantelData);
            } else {
                setPlantel(null);
            }

            if (activaData && plantelData && plantelData.jornadaNumero === activaData.numero) {
                setJornada(activaData);
            } else if (proximaData) {
                setJornada(proximaData);
            } else if (activaData) {
                setJornada(activaData);
            } else {
                setJornada(null);
            }

            if (rankGlobal.status === 'fulfilled') {
                if (torneoActual) {
                    setRankingGlobal(rankGlobal.value);
                    const miFila = rankGlobal.value.find(f => f.nombreUsuario === usuario?.nombreDisplay);
                    setMiPosicion(miFila || null);
                } else {
                    const todos = rankGlobal.value;
                    const top5 = todos.slice(0, 5);
                    const yo = todos.find(f => f.nombreUsuario === usuario?.nombreDisplay);
                    if (yo && yo.posicion > 5) {
                        setRankingGlobal([...top5, yo]);
                    } else {
                        setRankingGlobal(todos.slice(0, 6));
                    }
                    if (miPos.status === 'fulfilled') setMiPosicion(miPos.value);
                }
            }
            
            if (jornadasRes.status === 'fulfilled') {
                const finalizadas = jornadasRes.value
                    .filter(j => j.estado === 'FINALIZADA')
                    .sort((a, b) => b.numero - a.numero)
                setJornadas(finalizadas)
                if (finalizadas.length > 0) {
                    setJornadaSel(finalizadas[0].id)
                }
            }
        }).finally(() => setLoading(false))
    }, [torneoActual?.id, usuario?.id, usuario?.nombreDisplay])

    if (loading) return <LoadingSpinner mensaje="Cargando dashboard..." />

    return (
        <div className="space-y-4">

            {/* ── Header ── */}
            <div className="flex items-center gap-3 pt-2 cursor-pointer md:hover:opacity-80" onClick={() => setModalPerfilAbierto(true)}>
                <div className="w-12 h-12 rounded-full bg-primary flex items-center
                        justify-center text-white font-bold text-lg shrink-0 overflow-hidden">
                    {usuario?.avatarUrl ? (
                        <img src={usuario.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                        usuario?.nombreDisplay?.charAt(0).toUpperCase() ?? '?'
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-textMuted text-xs">Bienvenido</p>
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
                    jornadaSelInicial={jornadaSel}
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