import { useState } from 'react'
import { archivoEscudoMini } from '../../utils/escudos'
import PatronEquipo from './PatronEquipo'

/** Escudo chico del equipo; si no hay archivo para ese equipo, el cuadradito con los colores de la camiseta. */
export default function EscudoEquipo({ ligaId, equipo, className = 'w-8 h-8' }) {
    const [sinEscudo, setSinEscudo] = useState(false)

    if (sinEscudo) {
        return (
            <div className={`${className} p-1 shrink-0`}>
                <div className="w-full h-full rounded-md relative overflow-hidden border border-white/10">
                    <PatronEquipo
                        colorPrincipal={equipo.colorPrincipal}
                        colorSecundario={equipo.colorSecundario}
                        modelo={equipo.modeloCamiseta}
                        className="w-full h-full absolute inset-0"
                    />
                </div>
            </div>
        )
    }

    return (
        <img
            src={archivoEscudoMini(ligaId, equipo.nombre)}
            alt=""
            loading="lazy"
            onError={() => setSinEscudo(true)}
            className={`${className} object-contain shrink-0`}
        />
    )
}
