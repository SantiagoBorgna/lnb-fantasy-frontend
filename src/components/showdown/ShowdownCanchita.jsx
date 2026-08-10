import clsx from 'clsx'
import CamisetaSVG from '../jugador/CamisetaSVG'

const ZONA_LABEL = {
    'Base': 'Base',
    'Escolta': 'Escolta',
    'Alero': 'Alero',
    'AlaPivot': 'AlaPivot',
    'Pivot': 'Pivot',
}

export default function ShowdownCanchita({ plantel, capitanId, onSlotVacioTap, onSlotLlenoTap }) {
    // Formación fija: 2-2-1
    // Fila 1: Base, Escolta
    // Fila 2: Alero, AlaPivot
    // Fila 3: Pivot

    const slotsFila1 = [
        { zona: 'Base', jugador: plantel['Base'] },
        { zona: 'Escolta', jugador: plantel['Escolta'] }
    ]
    const slotsFila2 = [
        { zona: 'Alero', jugador: plantel['Alero'] },
        { zona: 'AlaPivot', jugador: plantel['AlaPivot'] }
    ]
    const slotsFila3 = [
        { zona: 'Pivot', jugador: plantel['Pivot'] }
    ]

    const filas = [slotsFila1, slotsFila2, slotsFila3]

    return (
        <div className="px-4 max-w-md mx-auto w-full">
            <div
                className="relative rounded-3xl overflow-hidden h-[450px] shadow-inner border border-black/10 mt-4"
                style={{
                    backgroundColor: '#e29b5a',
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.06) 40px, rgba(0,0,0,0.06) 80px)'
                }}
            >
                {/* Dibujo de la cancha */}
                <div className="absolute inset-0 pointer-events-none border-2 border-black/50 m-2 rotate-180">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[88%] max-w-[340px] h-[220px] border-x-2 border-b-2 border-black/50 rounded-b-[150px]" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[130px] h-[150px] border-x-2 border-b-2 border-black/50 bg-black/5" />
                    <div className="absolute top-[150px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] border-2 border-black/50 rounded-full" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-14 h-1 bg-black/60" />
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 w-5 h-5 border-2 border-black/60 rounded-full" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[140px] h-[70px] border-x-2 border-t-2 border-black/50 rounded-t-[70px]" />
                </div>

                <div className="relative z-10 py-6 px-2 flex flex-col justify-between h-full">
                    {filas.map((fila, filaIdx) => (
                        <div key={filaIdx} className="flex justify-center gap-x-10 items-start">
                            {fila.map(slot => (
                                slot.jugador
                                    ? <SlotLleno 
                                        key={slot.zona} 
                                        slot={slot} 
                                        esCapitan={capitanId === slot.jugador.id}
                                        onTap={() => onSlotLlenoTap(slot)} 
                                      />
                                    : <SlotVacio 
                                        key={slot.zona} 
                                        slot={slot} 
                                        onTap={() => onSlotVacioTap(slot)} 
                                      />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function SlotVacio({ slot, onTap }) {
    return (
        <button onClick={onTap} className="w-[85px] h-[100px] rounded-2xl bg-white/10 border-2 border-white/30 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:bg-white/20 shadow-sm backdrop-blur-sm relative z-20">
            <span className="text-white/70 text-2xl drop-shadow">+</span>
            <span className="text-white/70 text-[10px] text-center leading-tight px-1 font-bold uppercase tracking-wider drop-shadow">{ZONA_LABEL[slot.zona]}</span>
        </button>
    )
}

function SlotLleno({ slot, esCapitan, onTap }) {
    const j = slot.jugador
    const partes = j.nombreCompleto?.split(',') ?? ['?']
    const apellido = partes[0].trim()
    const inicial = partes[1]?.trim().charAt(0) ?? ''
    const etiqueta = inicial ? `${apellido}, ${inicial}.` : apellido

    return (
        <div onClick={onTap} className="relative w-[90px] h-[105px] rounded-2xl flex flex-col items-center justify-between p-2 cursor-pointer bg-white/15 transition-transform hover:scale-105 z-20">
            {esCapitan && (
                <div className="absolute -top-1.5 -right-1.5 z-10 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center ring-2 ring-surface shadow-md">
                    <span className="text-surface text-xs font-black">C</span>
                </div>
            )}
            
            <CamisetaSVG
                colorPrincipal={j.colorPrincipal}
                colorSecundario={j.colorSecundario}
                modelo={j.modeloCamiseta}
                numero={j.numeroCamiseta}
                estado={j.estado}
                size={56}
            />
            <span className="text-white text-[11px] font-bold text-center w-full truncate leading-tight drop-shadow-md">{etiqueta}</span>
            <span className="text-white/70 text-[10px] font-medium">{j.valorMercadoActual?.toFixed(1)} cr</span>
        </div>
    )
}
