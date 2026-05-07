import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useCountdown } from '../hooks/useCountdown'
import { getJornadaProxima, getJornadaActiva, getJornadas } from '../api/jornadaApi'
import { getPlantel } from '../api/plantelApi'
import {
    getRankingGlobal, getRankingJornada, getMiPosicion
} from '../api/rankingApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import CamisetaSVG from '../components/jugador/CamisetaSVG'
import { useAyuda } from '../hooks/useAyuda'
import ModalAyuda from '../components/ui/ModalAyuda'
import BotonAyuda from '../components/ui/BotonAyuda'
import { AYUDA } from '../components/ui/ayudaContenido'

export default function DashboardPage() {
    const usuario = useAuthStore(state => state.usuario)
    const navigate = useNavigate()

    const [jornada, setJornada] = useState(null)
    const [plantel, setPlantel] = useState(null)
    const [rankingGlobal, setRankingGlobal] = useState([])
    const [rankingFecha, setRankingFecha] = useState([])
    const [miPosicion, setMiPosicion] = useState(null)
    const [jornadas, setJornadas] = useState([])
    const [jornadaTab, setJornadaTab] = useState('global')
    const [jornadaSel, setJornadaSel] = useState(null)
    const [loading, setLoading] = useState(true)
    const { abierto, abrir, cerrar } = useAyuda('dashboard')

    const countdown = useCountdown(jornada?.fechaInicio)

    useEffect(() => {
        Promise.allSettled([
            getJornadaActiva(),
            getJornadaProxima(),
            getPlantel(),
            getRankingGlobal(5),
            getMiPosicion(),
            getJornadas(),
        ]).then(([activa, proxima, plantelRes, rankGlobal, miPos, jornadasRes]) => {

            const jornadaData =
                activa.status === 'fulfilled' && activa.value
                    ? activa.value
                    : proxima.status === 'fulfilled' ? proxima.value : null

            setJornada(jornadaData)

            if (plantelRes.status === 'fulfilled') setPlantel(plantelRes.value)
            if (rankGlobal.status === 'fulfilled') setRankingGlobal(rankGlobal.value)
            if (miPos.status === 'fulfilled') setMiPosicion(miPos.value)
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
    }, [])

    // Cargar ranking de jornada cuando cambia la selección
    useEffect(() => {
        if (!jornadaSel) return
        getRankingJornada(jornadaSel, 5).then(setRankingFecha).catch(() => { })
    }, [jornadaSel])

    if (loading) return <LoadingSpinner mensaje="Cargando dashboard..." />

    return (
        <div className="space-y-4">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 pt-2">
                <div className="w-12 h-12 rounded-full bg-primary flex items-center
                        justify-center text-white font-bold text-lg shrink-0">
                    {usuario?.nombreDisplay?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
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
                <BotonAyuda onClick={abrir} />
            </div>

            {/* ── Jornada + Countdown ──────────────────────────────────── */}
            {jornada ? (
                <div className="card space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-textMuted text-xs uppercase tracking-wide">
                                {jornada.estado === 'EN_JUEGO' ? '🔴 En juego' : '⏳ Próxima jornada'}
                            </p>
                            <h3 className="text-textMain font-bold text-lg">
                                Jornada {jornada.numero}
                            </h3>
                        </div>
                        <EstadoBadge estado={jornada.estado} />
                    </div>

                    {jornada.estado === 'ABIERTA_A_CAMBIOS' && countdown && (
                        <div className="grid grid-cols-4 gap-2">
                            {[
                                { valor: countdown.dias, label: 'días' },
                                { valor: countdown.horas, label: 'horas' },
                                { valor: countdown.minutos, label: 'min' },
                                { valor: countdown.segundos, label: 'seg' },
                            ].map(({ valor, label }) => (
                                <div key={label} className="bg-surface rounded-xl py-2
                                            flex flex-col items-center
                                            border border-border">
                                    <span className="text-accent font-bold text-xl tabular-nums">
                                        {String(valor).padStart(2, '0')}
                                    </span>
                                    <span className="text-textMuted text-xs">{label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="card text-center py-6">
                    <p className="text-textMuted text-sm">
                        No hay jornadas programadas por el momento.
                    </p>
                </div>
            )}

            {/* ── Mi equipo ────────────────────────────────────────────── */}
            <div className="card space-y-3">
                <h3 className="text-textMain font-semibold">Mi Equipo</h3>

                {plantel ? (
                    <>
                        {/* Stats del plantel */}
                        <div className="grid grid-cols-3 gap-2">
                            <StatCard
                                label="Presupuesto"
                                valor={`${plantel.presupuestoRestante?.toFixed(1)} cr`}
                            />
                            <StatCard
                                label="Jornada"
                                valor={plantel.puntajeObtenidoFecha?.toFixed(1) ?? '—'}
                            />
                            <StatCard
                                label="Transferencias"
                                valor={`${plantel.transferenciasRestantes}/3`}
                            />
                        </div>

                        {/* Mi posición en el ranking */}
                        {miPosicion && (
                            <div className="bg-surface rounded-2xl p-3 border border-border
                              flex items-center gap-3">
                                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  text-sm font-black shrink-0
                  ${miPosicion.posicion === 1 ? 'bg-yellow-500 text-white' : ''}
                  ${miPosicion.posicion === 2 ? 'bg-gray-400 text-white' : ''}
                  ${miPosicion.posicion === 3 ? 'bg-amber-700 text-white' : ''}
                  ${miPosicion.posicion >= 4 ? 'bg-border text-textMuted' : ''}
                `}>
                                    {miPosicion.posicion}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-textMain text-sm font-semibold truncate">
                                        {miPosicion.nombreEquipo}
                                    </p>
                                    <p className="text-textMuted text-xs">Ranking general</p>
                                </div>
                                <span className="text-accent font-bold tabular-nums">
                                    {miPosicion.puntajeGlobal?.toFixed(1)} pts
                                </span>
                            </div>
                        )}

                        <button
                            onClick={() => navigate('/canchita')}
                            className="btn-primary w-full"
                        >
                            Ver Equipo
                        </button>
                    </>
                ) : (
                    <div className="text-center py-4 space-y-3">
                        <p className="text-textMuted text-sm">
                            Todavía no armaste tu equipo para esta jornada.
                        </p>
                        <button
                            onClick={() => navigate('/mercado')}
                            className="btn-accent w-full"
                        >
                            Ir al Mercado
                        </button>
                    </div>
                )}
            </div>

            {/* ── Rankings ─────────────────────────────────────────────── */}
            <div className="card space-y-3">

                {/* Tabs global / jornada */}
                <div className="flex gap-2 bg-surface rounded-2xl p-1">
                    {[
                        { key: 'global', label: '🏆 General' },
                        { key: 'jornada', label: '📅 Jornada' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setJornadaTab(key)}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold
                transition-colors
                ${jornadaTab === key
                                    ? 'bg-primary text-white'
                                    : 'text-textMuted hover:text-textMain'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Selector de jornada (solo en tab jornada) */}
                {jornadaTab === 'jornada' && jornadas.length > 0 && (
                    <select
                        value={jornadaSel ?? ''}
                        onChange={e => setJornadaSel(Number(e.target.value))}
                        className="w-full bg-surface border border-border rounded-xl
                       px-3 py-2 text-textMain text-sm
                       focus:outline-none focus:border-primary"
                    >
                        {jornadas.map(j => (
                            <option key={j.id} value={j.id}>
                                Jornada {j.numero}
                            </option>
                        ))}
                    </select>
                )}

                {/* Lista del ranking */}
                <div className="space-y-2">
                    {(jornadaTab === 'global' ? rankingGlobal : rankingFecha)
                        .map(fila => (
                            <div key={fila.equipoVirtualId}
                                className="flex items-center gap-3">
                                <span className={`
                  w-6 h-6 rounded-full flex items-center justify-center
                  text-xs font-black shrink-0
                  ${fila.posicion === 1 ? 'bg-yellow-500 text-white' : ''}
                  ${fila.posicion === 2 ? 'bg-gray-400 text-white' : ''}
                  ${fila.posicion === 3 ? 'bg-amber-700 text-white' : ''}
                  ${fila.posicion >= 4 ? 'bg-border text-textMuted' : ''}
                `}>
                                    {fila.posicion}
                                </span>
                                <p className="flex-1 text-textMain text-sm truncate">
                                    {fila.nombreEquipo}
                                </p>
                                <span className="text-accent font-bold text-sm tabular-nums shrink-0">
                                    {fila.puntajeGlobal?.toFixed(1)}
                                </span>
                            </div>
                        ))
                    }

                    {jornadaTab === 'jornada' && rankingFecha.length === 0 && (
                        <p className="text-textMuted text-xs text-center py-3">
                            No hay datos para esta jornada todavía.
                        </p>
                    )}
                </div>

            </div>

            <ModalAyuda
                pagina="dashboard"
                contenido={AYUDA.dashboard}
                onCerrar={cerrar}
                abierto={abierto}  // el modal lo usás condicionalmente:
            />
        </div>
    )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function EstadoBadge({ estado }) {
    const config = {
        ABIERTA_A_CAMBIOS: { bg: 'bg-green-900/40', text: 'text-green-400', label: 'Abierta' },
        EN_JUEGO: { bg: 'bg-red-900/40', text: 'text-red-400', label: 'En juego' },
        FINALIZADA: { bg: 'bg-gray-800', text: 'text-textMuted', label: 'Finalizada' },
    }
    const cfg = config[estado] ?? config.FINALIZADA
    return (
        <span className={`${cfg.bg} ${cfg.text} text-xs font-semibold px-2 py-1 rounded-full`}>
            {cfg.label}
        </span>
    )
}

function StatCard({ label, valor }) {
    return (
        <div className="bg-surface rounded-xl p-3 text-center border border-border">
            <p className="text-accent font-bold text-lg tabular-nums">{valor}</p>
            <p className="text-textMuted text-xs mt-0.5">{label}</p>
        </div>
    )
}