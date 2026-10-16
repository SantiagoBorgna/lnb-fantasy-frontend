import clsx from 'clsx'

/**
 * Logo de la liga (apaisado: el tamaño se da con la altura, el ancho sale solo).
 */
export default function LigaLogo({ liga, className = 'h-6' }) {
    return (
        <img
            src={liga.logo}
            alt={liga.nombre}
            className={clsx('w-auto object-contain shrink-0', className)}
        />
    )
}
