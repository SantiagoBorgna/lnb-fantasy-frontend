import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { marcarAyudaVistaApi } from '../api/authApi'

export const useAyudaStore = create(
    persist(
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
        }),
        {
            name: 'lnb-fantasy-ayuda',
        }
    )
)