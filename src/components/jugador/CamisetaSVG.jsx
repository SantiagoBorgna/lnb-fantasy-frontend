import React, { useId } from 'react';

// Función mágica que calcula el contraste ideal (blanco o negro)
const determinarColorNumero = (principal, secundario) => {
    const esBlancoOAmarillo = (color) => {
        if (!color) return false;
        // Lo pasamos a mayúsculas para atajar tanto #ffffff como #FFFFFF o #FFF
        const hex = color.trim().toUpperCase();
        return hex === '#FFFFFF' || hex === '#FFF' || hex === '#EDF043' || hex === '#e2f825';
    };

    // Si alguno de los dos es blanco, el número es negro. Si no, blanco.
    if (esBlancoOAmarillo(principal) || esBlancoOAmarillo(secundario)) {
        return '#000000';
    }
    return '#FFFFFF';
};

/**
 * Renderiza una camiseta de básquet con el número del jugador y soporte para 5 modelos.
 * Utiliza clipPath para enmascarar los patrones (rayas/franjas) dentro de la silueta.
 */
export default function CamisetaSVG({
    colorPrincipal = '#35c12b',
    colorSecundario = '#000000',
    numero = '10',
    estado = 'DISPONIBLE',
    modelo = 1,
    size = 56,
    className = ""
}) {
    // Generamos un ID único para la máscara para evitar bugs si hay muchos jugadores en pantalla
    const clipId = useId();

    const colorNumero = determinarColorNumero(colorPrincipal, colorSecundario);

    const estadoConfig = {
        DISPONIBLE: { color: '#22C55E', label: '✓' },
        DUDA: { color: '#EAB308', label: '?' },
        LESIONADO: { color: '#EF4444', label: '✕' },
        SUSPENDIDO: { color: '#8B5CF6', label: 'S' },
    };

    const cfg = estadoConfig[estado] ?? estadoConfig.DISPONIBLE;

    // Esta es la silueta perfecta que exportaste de Figma. 
    // La guardamos en una variable porque la vamos a usar dos veces: de fondo y de máscara.
    const siluetaBase = "M32 6c12.716 19.365 19.948 19.311 33 0l3.5 1.016 8 1.76 3 .724c-5.967 21.284.971 31.118 11 34v68H7v-68c11.625-4.332 16.54-15.753 9.5-34l3.207-.724 8.793-1.76z";

    // Función que dibuja solo los patrones internos. 
    // Al estar enmascarados, no importa si los rectángulos se salen del viewBox.
    const renderizarPatrones = () => {
        switch (modelo) {
            case 1:
                // Lisa (Atenas, Argentino, Ferro, Gimnasia, La union, Obera, Obras, Olimpico, Platense, Union). No devuelve nada, se ve solo el color base.
                return null;
            case 2:
                // Rayas finas verticales (Peñarol, Instituto, Regatas)
                return (
                    <g>
                        {[15, 25, 35, 45, 55, 65, 75, 85].map(x => (
                            <rect key={x} x={x} y="0" width="2" height="120" fill={colorSecundario} />
                        ))}
                    </g>
                );
            case 3:
                // Franjas verticales iguales (Ej: San Lorenzo, Racing, San martin)
                return (
                    <g>
                        {[18, 44, 70].map(x => (
                            <rect key={x} x={x} y="0" width="14" height="120" fill={colorSecundario} />
                        ))}
                    </g>
                );
            case 4:
                // Franja horizontal en el medio (Ej: Boca, Independiente)
                return (
                    <rect x="0" y="45" width="100" height="26" fill={colorSecundario} />
                );
            case 5:
                // Franja horizontal arriba / Pecho (Ej: Quimsa)
                return (
                    <rect x="0" y="0" width="100" height="35" fill={colorSecundario} />
                );
            default:
                return null;
        }
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 120"
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            aria-label={`Camiseta número ${numero}`}
        >
            {/* 1. Definimos la máscara de recorte */}
            <defs>
                <clipPath id={clipId}>
                    <path d={siluetaBase} />
                </clipPath>
            </defs>

            {/* 2. Color Base (Fondo de la remera) */}
            <path fill={colorPrincipal} d={siluetaBase} />

            {/* 3. Patrones Dinámicos (Solo se ven adentro de la remera gracias al clipPath) */}
            <g clipPath={`url(#${clipId})`}>
                {renderizarPatrones()}
            </g>

            {/* 4. Vivos y sombras (Cuello y mangas). 
                Los ponemos SIEMPRE POR ENCIMA para que los patrones no tapen la forma de la ropa */}
            <g id="vivos-y-sombras">
                {/* Cuello y manga derecha (Agrupados con fill y stroke) */}
                <path
                    fill={colorSecundario}
                    stroke="#434343"
                    strokeWidth=".5"
                    d="m32 6-3.5 1c16.651 23.16 25.326 21.289 40 0L65 6C51.522 26.29 44.348 24.525 32 6ZM76.5 8.696l3 .804c-4.874 20.759-1.74 27.61 11 34V48c-15.124-8.629-19.408-16.386-14-39.304Z"
                />

                {/* Manga izquierda */}
                <path
                    fill={colorSecundario}
                    stroke="#434343"
                    strokeWidth=".5"
                    d="m16.5 9.5 4.5-1c5.176 22.664.903 30.433-14 39.304v-4.5c12.74-6.39 14.374-13.045 9.5-33.804Z"
                />

                {/* Sombras base de la tela (el fill="none" acá es clave para que no tape nada) */}
                <path
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth=".5"
                    fill="none"
                    d="M28.5 7.016 32 6c12.716 19.365 19.948 19.311 33 0l3.5 1.016m-40 0c16.894 22.551 24.31 22.105 40 0M7 48v-4.5c11.625-4.332 16.54-15.753 9.5-34l3.207-.724 8.793-1.76M90.5 48v-4.5c-10.029-2.883-16.967-12.716-11-34l-3-.724-8-1.76m8 1.76C71.315 30.778 75.076 39.458 90.5 48m0 0v63.5H7V48M19.707 8.776C26.069 28.176 23.833 36.96 7 48"
                />
            </g>

            {/* 5. El número del jugador */}
            <text
                x="50"
                y="80"
                textAnchor="middle"
                dominantBaseline="middle"
                fill={colorNumero}
                fontSize={String(numero).length > 1 ? "32" : "38"}
                fontWeight="900"
                fontFamily="Inter, system-ui, sans-serif"
                stroke={colorSecundario}
                strokeWidth="1.5"
            >
                {numero}
            </text>

            {/* 6. Indicador de estado médico */}
            <circle cx="85" cy="100" r="14" fill={cfg.color} stroke="#FFFFFF" strokeWidth="2" />
            <text
                x="85"
                y="102"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="14"
                fontWeight="700"
                fontFamily="Inter, system-ui, sans-serif"
            >
                {cfg.label}
            </text>
        </svg>
    );
}