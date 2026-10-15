import { useState } from 'react'
import clsx from 'clsx'

/**
 * Logo de la liga. Si la imagen no está (o no carga), muestra las iniciales en un círculo.
 */
export default function LigaLogo({ liga, className = 'w-6 h-6', textoIniciales = 'text-[9px]' }) {
    const [sinImagen, setSinImagen] = useState(false)

    if (sinImagen || !liga.logo) {
        return (
            <span className={clsx('rounded-full bg-primary text-white font-black flex items-center justify-center shrink-0 leading-none', textoIniciales, className)}>
                {liga.iniciales}
            </span>
        )
    }

    return (
        <img
            src={liga.logo}
            alt={liga.nombre}
            onError={() => setSinImagen(true)}
            className={clsx('object-contain shrink-0', className)}
        />
    )
}
