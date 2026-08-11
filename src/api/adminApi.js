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
