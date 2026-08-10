import clsx from 'clsx'

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
    return (
        <button onClick={onTap} className="relative w-[85px] group z-20">
            {esCapitan && (
                <div className="absolute -top-3 -right-2 bg-yellow-400 text-black w-6 h-6 rounded-full flex items-center justify-center font-extrabold text-xs shadow-lg z-30 ring-2 ring-white">
                    C
                </div>
            )}
            <div className="w-[85px] h-[85px] rounded-2xl bg-surface border-2 border-white shadow-xl flex items-end justify-center overflow-hidden transition-transform group-hover:scale-105">
                {/* Imagen placeholder */}
                <div className="w-full h-full bg-surface-lighter flex items-center justify-center relative">
                    {/* Silueta genérica */}
                    <svg className="w-[80%] h-[80%] text-white/5 absolute bottom-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                </div>
            </div>
            
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full flex justify-center">
                <span className="bg-bg/90 text-textMain text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm whitespace-nowrap shadow-sm border border-border/50">
                    ${j.valorMercadoActual}m
                </span>
            </div>

            <div className="mt-2 text-center">
                <p className="text-white text-[11px] font-bold leading-tight drop-shadow-md truncate max-w-[85px]">{j.nombreCompleto}</p>
                <p className="text-white/80 text-[9px] font-semibold uppercase drop-shadow-sm">{ZONA_LABEL[slot.zona]}</p>
            </div>
        </button>
    )
}
