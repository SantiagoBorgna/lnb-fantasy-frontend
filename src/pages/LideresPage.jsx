import { useEffect, useState } from 'react'
import { getResumenLideres, getTopCategoria } from '../api/lideresApi'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import CamisetaSVG from '../components/jugador/CamisetaSVG'
import { createPortal } from 'react-dom'
import { useAyuda } from '../hooks/useAyuda'
import ModalAyuda from '../components/ui/ModalAyuda'
import BotonAyuda from '../components/ui/BotonAyuda'
import { AYUDA } from '../components/ui/ayudaContenido'
import EmptyState from '../components/ui/EmptyState'


const ICONO_CATEGORIA = {
    'Puntos Fantasy': '🏆',
    'Puntos': '🏀',
    'Rebotes': '↕️',
    'Asistencias': '🤝',
    'Robos': '✋',
    'Tapones': '🛡️',
}

export default function LideresPage() {
    const [categorias, setCategorias] = useState([])
    const [loading, setLoading] = useState(true)
    const [categoriaAbierta, setCategoriaAbierta] = useState(null)
    const [top5, setTop5] = useState([])
    const [loadingTop, setLoadingTop] = useState(false)
    const pluralPartidos = (n) => `${n} ${n === 1 ? 'partido' : 'partidos'}`

    const { abierto, abrir, cerrar } = useAyuda('lideres')

    useEffect(() => {
        getResumenLideres()
            .then(setCategorias)
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const abrirCategoria = (categoria) => {
        setCategoriaAbierta(categoria)
        setLoadingTop(true)

        // Mapear nombre de categoría al slug del endpoint
        const slugs = {
            'Puntos Fantasy': 'fantasy',
            'Puntos': 'puntos',
            'Rebotes': 'rebotes',
            'Asistencias': 'asistencias',
            'Robos': 'robos',
            'Tapones': 'tapones',
        }

        getTopCategoria(slugs[categoria] ?? categoria.toLowerCase())
            .then(setTop5)
            .catch(console.error)
            .finally(() => setLoadingTop(false))
    }

    if (loading) return <LoadingSpinner mensaje="Cargando líderes..." />

    return (
        <div className="w-full space-y-4 pb-6">
            <div className="flex items-center justify-between">
                <h1 className="text-textMain font-bold text-2xl pt-2">Líderes</h1>
                <BotonAyuda onClick={abrir} />
            </div>

            {/* Grid de tarjetas por categoría */}
            {categorias.length === 0 ? (
                <div className="pt-10">
                    <EmptyState
                        titulo="Aún no hay estadísticas"
                        descripcion="Los líderes se actualizarán automáticamente cuando se procesen los primeros partidos de la temporada."
                    />
                </div>
            ) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorias.map(({ categoria, lider }) => (
                    <button
                        key={categoria}
                        onClick={() => abrirCategoria(categoria)}
                        className="card text-left space-y-3 md:space-y-5 md:p-6 active:scale-95
                       transition-transform hover:border-primary"
                    >
                        {/* Cabecera */}
                        <div className="flex items-center justify-between">
                            <span className="text-textMuted text-xs md:text-sm font-semibold uppercase
                               tracking-wide">
                                {categoria}
                            </span>
                            <span className="text-lg md:text-2xl">
                                {ICONO_CATEGORIA[categoria] ?? '📊'}
                            </span>
                        </div>

                        {/* Líder */}
                        {lider ? (
                            <div className="flex items-center gap-2 md:gap-4 md:mt-2">
                                <div className="md:scale-110 md:origin-left">
                                    <CamisetaSVG
                                        colorPrincipal={lider.colorPrincipal}
                                        colorSecundario={lider.colorSecundario}
                                        numero={lider.numeroCamiseta}
                                        modelo={lider.modeloCamiseta}
                                        estado="DISPONIBLE"
                                        size={60}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-textMain font-bold text-sm md:text-base truncate">
                                        {lider.nombreCompleto.split(',')[0]}
                                    </p>
                                    <p className="text-textMuted text-xs md:text-sm">{lider.equipoSigla}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-textMuted text-xs">Sin datos</p>
                        )}

                        {/* Promedio destacado */}
                        {lider && (
                            <div className="flex items-end justify-between md:pt-2">
                                <span className="text-accent font-black text-2xl md:text-4xl tabular-nums">
                                    {lider.promedio?.toFixed(1)}
                                </span>
                                <span className="text-textMuted text-xs md:text-sm mb-1 md:mb-1.5">
                                    {pluralPartidos(lider.partidosJugados)}
                                </span>
                            </div>
                        )}
                    </button>
                ))}
            </div>
            )}

            {/* Modal Top 5 */}
            {categoriaAbierta && createPortal(
                <>
                    <div
                        className="fixed inset-0 bg-black/60 z-40"
                        onClick={() => setCategoriaAbierta(null)}
                    />
                    <div className="fixed bottom-0 md:top-1/2 md:-translate-y-1/2 md:bottom-auto left-0 right-0 max-w-md mx-auto
                          bg-card border-t border-border rounded-t-3xl md:rounded-3xl
                          z-50 p-6 space-y-4 animate-slide-up md:animate-none"
                        onClick={e => e.stopPropagation()}>

                        <div className="w-10 h-1 bg-border rounded-full mx-auto md:hidden" />
                        <div className="flex items-center justify-between">
                            <h3 className="text-textMain font-bold text-lg">
                                {ICONO_CATEGORIA[categoriaAbierta]} Top 5 — {categoriaAbierta}
                            </h3>
                            <button
                                onClick={() => setCategoriaAbierta(null)}
                                className="text-textMuted text-sm"
                            >
                                Cerrar
                            </button>
                        </div>

                        {loadingTop ? (
                            <LoadingSpinner mensaje="Cargando top 5..." />
                        ) : (
                            <div className="space-y-2">
                                {top5.map((jugador, idx) => (
                                    <div key={jugador.jugadorRealId}
                                        className="flex items-center gap-3 p-3 rounded-2xl
                                  bg-surface border border-border">

                                        {/* Posición */}
                                        <span className={`
                      w-7 h-7 rounded-full flex items-center justify-center
                      text-sm font-black shrink-0
                      ${idx === 0 ? 'bg-yellow-500 text-white' : ''}
                      ${idx === 1 ? 'bg-gray-400 text-white' : ''}
                      ${idx === 2 ? 'bg-amber-700 text-white' : ''}
                      ${idx >= 3 ? 'bg-border text-textMuted' : ''}
                    `}>
                                            {idx + 1}
                                        </span>

                                        {/* Camiseta */}
                                        <CamisetaSVG
                                            colorPrincipal={jugador.colorPrincipal}
                                            colorSecundario={jugador.colorSecundario}
                                            numero={jugador.numeroCamiseta}
                                            modelo={jugador.modeloCamiseta}
                                            estado="DISPONIBLE"
                                            size={40}
                                        />

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-textMain font-semibold text-sm truncate">
                                                {jugador.nombreCompleto}
                                            </p>
                                            <p className="text-textMuted text-xs">
                                                {jugador.equipoSigla} · {pluralPartidos(jugador.partidosJugados)}
                                            </p>
                                        </div>

                                        {/* Promedio */}
                                        <span className="text-accent font-black text-lg tabular-nums shrink-0">
                                            {jugador.promedio?.toFixed(1)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>,
                document.body
            )}

            <ModalAyuda
                pagina="lideres"
                contenido={AYUDA.lideres}
                onCerrar={cerrar}
                abierto={abierto}  // el modal lo usás condicionalmente:
            />
        </div>
    )
}