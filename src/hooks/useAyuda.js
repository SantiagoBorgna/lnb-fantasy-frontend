import { useState, useEffect } from 'react'
import { useAyudaStore } from '../store/ayudaStore'

/**
 * Maneja la lógica de apertura automática (primera vez)
 * y manual (botón "?") del modal de ayuda.
 *
 * @param pagina  Clave de la página (ej: 'dashboard', 'mercado')
 * @returns { abierto, abrir, cerrar }
 */
export function useAyuda(pagina) {
    const { fueVista, marcarVista } = useAyudaStore()
    const [abierto, setAbierto] = useState(false)

    // Abrir automáticamente la primera vez
    useEffect(() => {
        if (!fueVista(pagina)) {
            // Pequeño delay para que la página termine de renderizar
            const timer = setTimeout(() => setAbierto(true), 600)
            return () => clearTimeout(timer)
        }
    }, [pagina])

    const abrir = () => setAbierto(true)

    const cerrar = () => {
        setAbierto(false)
        marcarVista(pagina)
    }

    return { abierto, abrir, cerrar }
}