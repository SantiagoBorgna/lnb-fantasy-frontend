import { create } from 'zustand'

export const useUiStore = create((set) => ({
    toast: null,
    showToast: (mensaje, tipo = 'success', opciones = {}) => {
        set({ toast: { mensaje, tipo, id: Date.now(), ...opciones } })
    },
    hideToast: () => set({ toast: null })
}))
