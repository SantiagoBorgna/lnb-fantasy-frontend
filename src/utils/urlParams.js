import Hashids from 'hashids';

const hashids = new Hashids('SextoHombreFantasy2026', 8, 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');

/**
 * Codifica un ID numérico a un hash corto para la URL
 * @param {number|string} id - El ID a codificar
 * @returns {string} El hash resultante
 */
export const encodeId = (id) => {
    if (!id) return '';
    // Nos aseguramos que sea número
    const numId = parseInt(id, 10);
    if (isNaN(numId)) return id; // Si no es un número (ej. "general"), lo devolvemos tal cual
    return hashids.encode(numId);
};

/**
 * Decodifica un hash corto de la URL a un ID numérico
 * @param {string} hash - El hash a decodificar
 * @returns {number|string} El ID original, o el hash si no se pudo decodificar
 */
export const decodeId = (hash) => {
    if (!hash) return null;
    const decoded = hashids.decode(hash);
    if (decoded.length > 0) {
        return decoded[0];
    }
    // Si falla (ej. si pasaron "general" o una url vieja no encriptada), retornamos tal cual o tratamos de parsear
    const num = parseInt(hash, 10);
    return isNaN(num) ? hash : num;
};

/**
 * Codifica un arreglo de IDs numéricos en un solo hash corto para la URL
 * @param {Array<number|string>} ids - El arreglo de IDs a codificar
 * @returns {string} El hash resultante
 */
export const encodeMultiple = (ids) => {
    if (!ids || !Array.isArray(ids)) return '';
    const numericIds = ids.map(id => {
        const num = parseInt(id, 10);
        return isNaN(num) ? 0 : num; // Hashids solo acepta números
    });
    return hashids.encode(numericIds);
};

/**
 * Decodifica un hash corto en un arreglo de IDs numéricos
 * @param {string} hash - El hash a decodificar
 * @returns {Array<number>} El arreglo de IDs originales
 */
export const decodeMultiple = (hash) => {
    if (!hash) return [];
    return hashids.decode(hash);
};
