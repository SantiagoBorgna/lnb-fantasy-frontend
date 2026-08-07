import { create } from 'zustand'
import { marcarAyudaVistaApi } from '../api/authApi'

/**
 * Registra qué páginas ya mostraron su modal de ayuda en el estado global.
 * Sincronizado con la base de datos a través de authStore.
 */
export const useAyudaStore = create(
    (set, get) => ({
        vistas: {},  // { 'dashboard': true, 'mercado': true, ... }

        setVistas: (lista) => {
            if (!lista) return;
            const obj = {};
            lista.forEach(item => obj[item] = true);
            set({ vistas: obj });
        },

        marcarVista: (pagina) => {
            if (!get().vistas[pagina]) {
                set(state => ({
                    vistas: { ...state.vistas, [pagina]: true }
                }));
                marcarAyudaVistaApi(pagina).catch(e => console.error("Error marcando ayuda", e));
            }
        },

        fueVista: (pagina) => !!get().vistas[pagina],

        resetearTodas: () => set({ vistas: {} }),
    })
)

// Sincronizar automáticamente con el authStore
import { useAuthStore } from './authStore'
useAuthStore.subscribe((state, prevState) => {
    if (state.usuario?.ayudasVistas !== prevState?.usuario?.ayudasVistas) {
        useAyudaStore.getState().setVistas(state.usuario?.ayudasVistas || []);
    }
})