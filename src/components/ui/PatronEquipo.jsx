export default function PatronEquipo({
    colorPrincipal = '#35c12b',
    colorSecundario = '#000000',
    modelo = 1,
    className = ""
}) {
    // Función que dibuja solo los patrones internos, adaptados a un viewBox de 100x100
    const renderizarPatrones = () => {
        switch (modelo) {
            case 1:
                // Lisa. No devuelve nada, se ve solo el color base.
                return null;
            case 2:
                // Rayas finas verticales
                return (
                    <g>
                        {[15, 25, 35, 45, 55, 65, 75, 85].map(x => (
                            <rect key={x} x={x} y="0" width="2" height="100" fill={colorSecundario} />
                        ))}
                    </g>
                );
            case 3:
                // Franjas verticales iguales
                return (
                    <g>
                        {[18, 44, 70].map(x => (
                            <rect key={x} x={x} y="0" width="14" height="100" fill={colorSecundario} />
                        ))}
                    </g>
                );
            case 4:
                // Franja horizontal en el medio
                return (
                    <rect x="0" y="37" width="100" height="26" fill={colorSecundario} />
                );
            case 5:
                // Franja horizontal arriba / Pecho
                return (
                    <rect x="0" y="0" width="100" height="35" fill={colorSecundario} />
                );
            default:
                return null;
        }
    };

    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
        >
            <rect width="100" height="100" fill={colorPrincipal} />
            {renderizarPatrones()}
        </svg>
    );
}
