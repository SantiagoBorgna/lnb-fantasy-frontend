import { create } from 'zustand'

export const useUiStore = create((set) => ({
    toast: null,
    showToast: (mensaje, tipo = 'success') => {
        set({ toast: { mensaje, tipo, id: Date.now() } })
    },
    hideToast: () => set({ toast: null })
}))
