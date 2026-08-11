import { create } from 'zustand'
import { marcarAyudaVistaApi } from '../api/authApi'
import { useAuthStore } from './authStore'

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
                
                // Actualizar authStore para que impacte en localStorage instantáneamente
                const { usuario, setUsuario } = useAuthStore.getState();
                if (usuario) {
                    const nuevasAyudas = usuario.ayudasVistas ? [...usuario.ayudasVistas, pagina] : [pagina];
                    setUsuario({ ...usuario, ayudasVistas: nuevasAyudas });
                }
            }
        },

        fueVista: (pagina) => !!get().vistas[pagina],

        resetearTodas: () => set({ vistas: {} }),
    })
)

// Sincronizar automáticamente con el authStore
useAuthStore.subscribe((state, prevState) => {
    if (state.usuario?.ayudasVistas !== prevState?.usuario?.ayudasVistas) {
        useAyudaStore.getState().setVistas(state.usuario?.ayudasVistas || []);
    }
})

// Inicializar con el estado actual de authStore por si ya cargó de localStorage
const initialUsuario = useAuthStore.getState().usuario;
if (initialUsuario?.ayudasVistas) {
    useAyudaStore.getState().setVistas(initialUsuario.ayudasVistas);
}