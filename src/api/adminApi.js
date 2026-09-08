import api from './axiosClient';

export const getTodosLosShowdowns = async () => {
    const { data } = await api.get('/admin/showdown');
    return data;
};

export const getPartidosDisponiblesParaShowdown = async () => {
    const { data } = await api.get('/admin/showdown/partidos-disponibles');
    return data;
};

export const crearShowdownManual = async (partidoId) => {
    const { data } = await api.post(`/admin/showdown?partidoId=${partidoId}`);
    return data;
};

export const eliminarShowdown = async (id) => {
    const { data } = await api.delete(`/admin/showdown/${id}`);
    return data;
};

// --- ADMIN QUINTETOS ---
export const getQuintetosPorJornada = async (id) => {
    const response = await api.get(`/admin/jornadas/${id}/quintetos`)
    return response.data
}

// --- ADMIN PARTIDOS ---
export const getPartidos = async (jornadaId) => {
    const url = jornadaId ? `/admin/partidos?jornadaId=${jornadaId}` : '/admin/partidos'
    const response = await api.get(url)
    return response.data
}

export const updatePartido = async (id, data) => {
    const response = await api.put(`/admin/partidos/${id}`, data)
    return response.data
}

export const scrapePartido = async (id) => {
    const response = await api.post(`/admin/partidos/${id}/scrape`)
    return response.data
};


export const getTodosLosJugadoresAdmin = async () => {
    const { data } = await api.get('/admin/jugadores');
    return data;
};

export const updateJugadorAdmin = async (id, payload) => {
    const { data } = await api.put(`/admin/jugadores/${id}`, payload);
    return data;
};

export const getTodosLosEquiposAdmin = async () => {
    const { data } = await api.get('/admin/jugadores/equipos');
    return data;
};



export const getDtsAdmin = async () => {
    const { data } = await api.get('/admin/dts');
    return data;
};

export const updateDtAdmin = async (id, payload) => {
    const { data } = await api.put(`/admin/dts/${id}`, payload);
    return data;
};

// --- ADMIN UTILIDADES (correr crons manualmente) ---
export const correrCronAdmin = async (cronKey) => {
    const { data } = await api.post(`/admin/utilidades/crons/${cronKey}`);
    return data;
};

