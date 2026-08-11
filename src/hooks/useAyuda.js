import { useState, useEffect } from 'react'
import { useAyudaStore } from '../store/ayudaStore'

export function useAyuda(pagina, autoOpen = true) {
    const marcarVista = useAyudaStore(state => state.marcarVista)
    // Nos suscribimos directamente a la vista de esta página para que el componente re-renderice
    const yaVista = useAyudaStore(state => !!state.vistas[pagina])
    
    const [abierto, setAbierto] = useState(false)

    useEffect(() => {
        // Solo intentamos abrir si autoOpen es true y NO la vio todavía
        if (autoOpen && !yaVista) {
            // El usuario podría estar cargando todavía, por lo que usamos un pequeño delay
            const timer = setTimeout(() => {
                // Chequeo directo al estado por si cargó en el medio del delay
                if (!useAyudaStore.getState().vistas[pagina]) {
                    setAbierto(true)
                }
            }, 600)
            return () => clearTimeout(timer)
        }
    }, [pagina, autoOpen, yaVista])

    const abrir = () => setAbierto(true)

    const cerrar = () => {
        setAbierto(false)
        marcarVista(pagina)
    }

    return { abierto, abrir, cerrar }
}