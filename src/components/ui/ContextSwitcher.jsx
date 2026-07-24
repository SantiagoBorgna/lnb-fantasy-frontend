import { useGameStore } from '../../store/gameStore'
import { TrophyIcon } from './BottomNav' // You can reuse any icon
import clsx from 'clsx'
import { useState, useRef, useEffect } from 'react'

export default function ContextSwitcher() {
    const { contextoActual, misLigasDraft, setContextoActual } = useGameStore()
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [dropdownRef])

    // Si no tiene ligas draft, ni siquiera mostramos el selector
    if (!misLigasDraft || misLigasDraft.length === 0) return null

    const ligasOpciones = [
        { id: null, nombre: 'Modo Clásico' },
        ...misLigasDraft.map(t => ({ id: t.id, nombre: t.nombre }))
    ]

    const opcionActual = ligasOpciones.find(o => o.id === contextoActual) || ligasOpciones[0]

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={clsx(
                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all",
                    contextoActual 
                        ? "bg-accent/10 border-accent/30 text-accent" 
                        : "bg-surface border-border text-textMain"
                )}
            >
                <TrophyIcon className="w-4 h-4" />
                <span className="max-w-[120px] truncate">{opcionActual.nombre}</span>
                <svg className={clsx("w-4 h-4 transition-transform", isOpen && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {ligasOpciones.map(opcion => (
                        <button
                            key={opcion.id ?? 'global'}
                            onClick={() => {
                                setContextoActual(opcion.id)
                                setIsOpen(false)
                            }}
                            className={clsx(
                                "w-full text-left px-4 py-3 text-sm font-medium hover:bg-surface transition-colors",
                                contextoActual === opcion.id ? "text-accent" : "text-textMain"
                            )}
                        >
                            {opcion.nombre}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
