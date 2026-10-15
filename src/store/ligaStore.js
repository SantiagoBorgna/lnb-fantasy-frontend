import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LIGAS, LIGA_PRINCIPAL, buscarLiga } from '../config/ligas'

/**
 * Liga que se está jugando. Se recuerda la última usada.
 * Todos los pedidos al backend van al de esta liga (ver axiosClient).
 */
export const useLigaStore = create(
    persist(
        (set) => ({
            ligaId: LIGA_PRINCIPAL.id,
            setLigaId: (ligaId) => set({ ligaId }),
        }),
        { name: 'lnb-fantasy-liga' }
    )
)

// La liga actual (si la guardada ya no existe, la principal)
export const ligaActual = () => buscarLiga(useLigaStore.getState().ligaId) ?? LIGAS[0] ?? LIGA_PRINCIPAL

export const useLigaActual = () => {
    const ligaId = useLigaStore(state => state.ligaId)
    return buscarLiga(ligaId) ?? LIGAS[0] ?? LIGA_PRINCIPAL
}
