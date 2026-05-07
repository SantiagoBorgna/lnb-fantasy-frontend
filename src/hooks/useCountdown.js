import { useState, useEffect } from 'react'

/**
 * Recibe un timestamp ISO string y devuelve el tiempo restante
 * actualizado cada segundo hasta llegar a cero.
 */
export function useCountdown(fechaObjetivo) {
    const calcularRestante = () => {
        if (!fechaObjetivo) return null
        const diff = new Date(fechaObjetivo) - new Date()
        if (diff <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0 }

        return {
            dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
            horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutos: Math.floor((diff / (1000 * 60)) % 60),
            segundos: Math.floor((diff / 1000) % 60),
        }
    }

    const [restante, setRestante] = useState(calcularRestante)

    useEffect(() => {
        if (!fechaObjetivo) return
        const intervalo = setInterval(() => {
            setRestante(calcularRestante())
        }, 1000)
        return () => clearInterval(intervalo)
    }, [fechaObjetivo])

    return restante
}