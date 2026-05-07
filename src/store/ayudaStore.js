import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Registra qué páginas ya mostraron su modal de ayuda.
 * Una vez visto, solo se reabre tocando el botón "?".
 */
export const useAyudaStore = create(
    persist(
        (set, get) => ({
            vistas: {},  // { 'dashboard': true, 'mercado': true, ... }

            marcarVista: (pagina) =>
                set(state => ({
                    vistas: { ...state.vistas, [pagina]: true }
                })),

            fueVista: (pagina) => !!get().vistas[pagina],

            // Para testing: resetear todas las ayudas
            resetearTodas: () => set({ vistas: {} }),
        }),
        {
            name: 'lnb-ayuda',
            partialize: (state) => ({ vistas: state.vistas }),
        }
    )
)