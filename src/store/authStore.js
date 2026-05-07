import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
    persist(
        (set) => ({
            token: null,
            usuario: null,

            setAuth: (token, usuario) => set({ token, usuario }),

            // Actualiza solo los datos del usuario sin tocar el token
            setUsuario: (usuario) => set({ usuario }),

            logout: () => set({ token: null, usuario: null }),
        }),
        {
            name: 'lnb-fantasy-auth',
            partialize: (state) => ({ token: state.token, usuario: state.usuario }),
        }
    )
)