import CamisetaSVG from '../jugador/CamisetaSVG'
import clsx from 'clsx'

export default function SlotJugador({
    jugador,
    opaco = false,
    esSexto = false,
    jornadaEstado = 'ABIERTA_A_CAMBIOS',
    puntosJornada,
    onClick, // <-- 1. Recibimos onClick en vez de onPointerUp
    onDragStart,
    onDragOver,
    onDrop,
}) {
    const esCap = jugador.rol === 'CAPITAN'

    // El valor mostrado depende del modo:
    // - undefined → modo edición → mostrar créditos
    // - null      → modo lectura, no jugó → mostrar "--"
    // - número    → modo lectura, jugó → mostrar pts
    const valorInfo = puntosJornada === undefined
        ? `${jugador.valorMercadoActual?.toFixed(1) ?? '?'} cr`
        : puntosJornada === null
            ? '--'
            : `${puntosJornada?.toFixed(1)} pts`

    // Apellido + inicial en un solo renglón
    const partes = jugador.nombreCompleto?.split(',') ?? ['?']
    const apellido = partes[0].trim()
    const inicial = partes[1]?.trim().charAt(0) ?? ''
    const etiqueta = inicial ? `${apellido}, ${inicial}.` : apellido

    const handleDragStart = (e) => {
        e.stopPropagation()
        onDragStart?.()
    }

    // <-- 2. Armamos el handler para el click
    const handleClick = (e) => {
        e.stopPropagation()
        onClick?.(jugador)
    }

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragOver={(e) => { e.preventDefault(); onDragOver?.() }}
            onDrop={(e) => { e.preventDefault(); onDrop?.() }}
            onClick={handleClick} // <-- 3. Se lo pasamos al div contenedor
            className={clsx(
                // ¡Slots XL! Más anchos y altos
                'relative flex flex-col items-center justify-between',
                'w-[100px] h-[116px] p-2 rounded-2xl',
                'cursor-pointer select-none transition-opacity duration-150',
                esSexto
                    ? 'bg-accent/25 ring-1 ring-accent/60'
                    : 'bg-white/15',
                opaco && 'opacity-20 pointer-events-none',
            )}
        >
            {/* Badges superpuestos */}
            {esCap && (
                <div className="absolute -top-1.5 -right-1.5 z-10
                        w-5 h-5 rounded-full bg-yellow-500
                        flex items-center justify-center
                        ring-2 ring-surface">
                    <span className="text-white text-xs font-black leading-none">C</span>
                </div>
            )}
            {esSexto && (
                <div className="absolute -top-1.5 -right-1.5 z-10
                        w-5 h-5 rounded-full bg-accent
                        flex items-center justify-center
                        ring-2 ring-surface">
                    <span className="text-white text-xs font-black leading-none">6</span>
                </div>
            )}
            {jugador.rol === 'SUPLENTE' && (
                <div className="absolute -top-1.5 -right-1.5 z-10
                        w-5 h-5 rounded-full bg-border
                        flex items-center justify-center
                        ring-2 ring-surface">
                    <span className="text-white text-xs font-black leading-none">S</span>
                </div>
            )}

            {/* Camiseta ampliada para el nuevo slot */}
            <CamisetaSVG
                colorPrincipal={jugador.colorPrincipal}
                colorSecundario={jugador.colorSecundario}
                modelo={jugador.modeloCamiseta}
                numero={jugador.numeroCamiseta}
                estado={jugador.estado}
                size={52}
            />

            {/* Nombre en un solo renglón */}
            <span className="text-white font-bold text-[11px] text-center w-full truncate drop-shadow mt-1">
                {etiqueta}
            </span>

            {/* Valor cr / puntos pts actualizado */}
            <span className={clsx(
                'text-[10px] leading-none mb-0.5',
                puntosJornada != null && puntosJornada !== undefined
                    ? 'text-accent font-bold'
                    : 'text-white/60'
            )}>
                {valorInfo}
            </span>
        </div>
    )
}