import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { zonasDeFormacion } from '../components/plantel/plantelUtils'

const FORMACION_DEFAULT = '2-1-2'

/**
 * Genera los slots vacíos para una formación dada.
 * Titulares primero, luego banco (1 sexto hombre + 4 suplentes).
 */
const generarSlots = (formacion) => {
    const zonas = zonasDeFormacion(formacion)  // ['GUARD','GUARD','FORWARD','CENTER','CENTER']

    const titulares = zonas.map((zona, i) => ({
        index: i,
        zona,
        rol: i === 0 ? 'TITULAR' : 'TITULAR',  // Capitán se asigna después
        jugador: null,
    }))

    const banco = [
        { index: 5, zona: 'GUARD', rol: 'SEXTO_HOMBRE', jugador: null },
        { index: 6, zona: 'GUARD', rol: 'SUPLENTE', jugador: null },
        { index: 7, zona: 'FORWARD', rol: 'SUPLENTE', jugador: null },
        { index: 8, zona: 'CENTER', rol: 'SUPLENTE', jugador: null },
        { index: 9, zona: 'FORWARD', rol: 'SUPLENTE', jugador: null },
    ]

    return [...titulares, ...banco]
}

export const useDraftStore = create(
    persist(
        (set, get) => ({
            formacion: FORMACION_DEFAULT,
            slots: generarSlots(FORMACION_DEFAULT),
            slotPendiente: null,   // { index, zona } — slot esperando jugador del Mercado
            dt: null,

            // Cambiar formación regenera los slots titulares
            // pero conserva los jugadores del banco
            setFormacion: (formacion) => {
                const slotsActuales = get().slots
                const banco = slotsActuales.slice(5)
                const nuevosSlots = generarSlots(formacion)
                // Conservar jugadores titulares si la nueva formación tiene el mismo
                // número de slots en esa zona — sino se limpian
                set({ formacion, slots: [...nuevosSlots.slice(0, 5), ...banco] })
            },

            // El usuario tocó un slot vacío → guardar cuál está pendiente
            setSlotPendiente: (slot) => set({ slotPendiente: slot }),

            // El Mercado llama esto al elegir un jugador
            asignarJugador: (jugador) => {
                const { slots, slotPendiente } = get()
                if (!slotPendiente) return

                const nuevos = slots.map(s => {
                    if (s.index === slotPendiente.index) {
                        // FIX: Si el slot a pisar era CAPITAN, lo degradamos a TITULAR
                        const rolSeguro = s.rol === 'CAPITAN' ? 'TITULAR' : s.rol;
                        return { ...s, jugador, rol: rolSeguro }
                    }
                    return s
                })
                set({ slots: nuevos, slotPendiente: null })
            },

            // Hacer capitán desde el modal
            hacerCapitan: (jugadorRealId) => {
                const nuevos = get().slots.map(s => {
                    if (!s.jugador) return s
                    if (s.jugador.id === jugadorRealId)
                        return { ...s, rol: 'CAPITAN' }
                    if (s.rol === 'CAPITAN')
                        return { ...s, rol: 'TITULAR' }
                    return s
                })
                set({ slots: nuevos })
            },

            setDt: (dt) => set({ dt }),

            // Quitar un jugador de su slot (vender)
            quitarJugador: (slotIndex) => {
                const nuevos = get().slots.map(s => {
                    if (s.index === slotIndex) {
                        // FIX: Si vaciamos el slot del CAPITAN, el slot vuelve a ser TITULAR normal
                        const rolSeguro = s.rol === 'CAPITAN' ? 'TITULAR' : s.rol;
                        return { ...s, jugador: null, rol: rolSeguro }
                    }
                    return s
                })
                set({ slots: nuevos })
            },

            // Limpiar el draft completo (después de guardar el plantel)
            resetDraft: () => set({
                formacion: FORMACION_DEFAULT,
                slots: generarSlots(FORMACION_DEFAULT),
                slotPendiente: null,
                dt: null,
            }),

            // Validaciones
            estaCompleto: () => {
                const { slots, dt } = get()
                const todosLlenos = slots.every(s => s.jugador !== null)
                const tieneCapitan = slots.some(s => s.rol === 'CAPITAN')
                return todosLlenos && tieneCapitan && dt !== null
            },

            motivoIncompleto: () => {
                const { slots, dt } = get()
                const vacios = slots.filter(s => s.jugador === null).length
                const sinCap = !slots.some(s => s.rol === 'CAPITAN')
                const msgs = []

                if (vacios > 0) msgs.push(`Faltan ${vacios} jugador${vacios > 1 ? 'es' : ''}`)
                if (sinCap) msgs.push('Falta elegir capitán')
                if (!dt) msgs.push('Falta elegir DT')

                // Validar composición del banco
                const banco = slots.filter(s =>
                    s.jugador && (s.rol === 'SEXTO_HOMBRE' || s.rol === 'SUPLENTE')
                )
                const posicionesBanco = banco.map(s => s.jugador.posicion)

                const tieneGuard = posicionesBanco.some(p => p === 'BASE' || p === 'ESCOLTA')
                const tieneForward = posicionesBanco.some(p => p === 'ALERO' || p === 'ALA_PIVOT')
                const tieneCenter = posicionesBanco.some(p => p === 'PIVOT')

                // Solo validar banco si todos los slots están llenos
                if (vacios === 0) {
                    if (!tieneGuard) msgs.push('El banco necesita al menos un Base/Escolta')
                    if (!tieneForward) msgs.push('El banco necesita al menos un Alero/Ala-Pivot')
                    if (!tieneCenter) msgs.push('El banco necesita al menos un Pivot')
                }

                return msgs
            },
        }),
        {
            name: 'lnb-draft',
            // No persistir slotPendiente — se resetea si recarga
            partialize: (s) => ({
                formacion: s.formacion,
                slots: s.slots,
                dt: s.dt,
            }),
        }
    )
)