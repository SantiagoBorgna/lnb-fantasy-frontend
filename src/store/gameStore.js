import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useGameStore = create(
    persist(
        (set) => ({
            // null significa "Modo Global Clásico"
            // Si es un ID, es el ID del torneo Draft seleccionado
            contextoActual: null,
            
            // Lista de torneos draft a los que pertenece el usuario (cacheado para el navbar)
            misLigasDraft: [],

            setContextoActual: (torneoId) => set({ contextoActual: torneoId }),
            
            setMisLigasDraft: (ligas) => set({ misLigasDraft: ligas }),
            
            clearGameData: () => set({ contextoActual: null, misLigasDraft: [] }),
        }),
        {
            name: 'lnb-fantasy-game',
            partialize: (state) => ({ contextoActual: state.contextoActual }),
        }
    )
)
