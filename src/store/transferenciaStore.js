import { create } from 'zustand'

/**
 * Store temporal para el flujo de transferencia.
 * No se persiste — si el usuario recarga se cancela la transferencia.
 */
export const useTransferenciaStore = create((set) => ({
    pendiente: null,  // { jugadorSaleId, rolSaliente, posicion, zona, nombreSale, valorSale }

    iniciarTransferencia: (datos) => set({ pendiente: datos }),

    cancelarTransferencia: () => set({ pendiente: null }),

    pendienteEntrada: null,  // JugadorMercadoDto elegido desde el Mercado

    iniciarDesdeEntrada: (jugadorEntra) =>
        set({ pendienteEntrada: jugadorEntra }),

    cancelarEntrada: () =>
        set({ pendienteEntrada: null }),
}))