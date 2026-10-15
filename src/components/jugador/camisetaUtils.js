// Función mágica que calcula el contraste ideal (blanco o negro)
export const determinarColorNumero = (principal, secundario) => {
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
