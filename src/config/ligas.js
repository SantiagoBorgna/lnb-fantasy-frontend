// Ligas que se pueden jugar. Cada una tiene su propio backend (y su propia base);
// el login es uno solo (se hace en el backend de la Liga Nacional) y sirve para todas.
//
// Una liga sin URL de API configurada no aparece (ej. la Liga Argentina antes de tener backend).

const TODAS = [
    {
        id: 'liga-nacional',
        nombre: 'Liga Nacional',
        nombreCompleto: 'Liga Nacional de Básquet',
        sigla: 'LNB',
        deLaLiga: 'de la LNB', // "jugadores de la LNB"
        logo: '/ligas/liga-nacional.png',
        apiUrl: import.meta.env.VITE_API_URL,
    },
    {
        id: 'liga-argentina',
        nombre: 'Liga Argentina',
        nombreCompleto: 'Liga Argentina de Básquet',
        sigla: 'LAB',
        deLaLiga: 'de la Liga Argentina',
        logo: '/ligas/liga-argentina.png',
        apiUrl: import.meta.env.VITE_API_URL_LIGA_ARGENTINA,
    },
]

export const LIGAS = TODAS.filter(l => l.apiUrl)

// Donde se hace el login y se compra el Premium (vale para todas las ligas)
export const LIGA_PRINCIPAL = TODAS[0]

export const buscarLiga = (id) => LIGAS.find(l => l.id === id)
