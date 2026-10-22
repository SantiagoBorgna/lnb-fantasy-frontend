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
    const response = await api.get('/admin/quintetos', { params: { jornadaId: id } })
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

export const eliminarPartido = async (id) => {
    await api.delete(`/admin/partidos/${id}`)
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

export const recalcularJornadaAdmin = async (jornadaId) => {
    const { data } = await api.post(`/admin/utilidades/jornadas/${jornadaId}/recalcular`);
    return data;
};

// Recorre los planteles de GES y carga/actualiza los jugadores (y crea los equipos que falten).
// El backend lo corre en segundo plano y responde enseguida.
export const sincronizarJugadoresAdmin = async () => {
    const { data } = await api.post('/admin/scraper/jugadores/sincronizar');
    return data;
};

export const sincronizarFixtureAdmin = async (jornadaId, urlFixture) => {
    const { data } = await api.post('/admin/scraper/fixture/sincronizar', { jornadaId, urlFixture });
    return data;
};


// ── Comunidad: números de usuarios y notificaciones push ──
export const getResumenUsuarios = async () => {
    const { data } = await api.get('/admin/usuarios/resumen');
    return data;
};

export const enviarNotificacionAdmin = async ({ titulo, mensaje, url, soloPrueba }) => {
    const { data } = await api.post('/admin/notificaciones/enviar', { titulo, mensaje, url, soloPrueba });
    return data;
};
