import axiosClient from './axiosClient';

export const getShowdownEvento = (codigo) => 
    axiosClient.get(`/showdown/${codigo}`).then(r => r.data);

export const getShowdownMercado = (codigo) => 
    axiosClient.get(`/showdown/${codigo}/mercado`).then(r => r.data);

export const participarShowdown = (codigo, payload) => 
    axiosClient.post(`/showdown/${codigo}/participar`, payload).then(r => r.data);

export const getShowdownRanking = (codigo, uuidDispositivo) => 
    axiosClient.get(`/showdown/${codigo}/ranking`, { params: { uuidDispositivo } }).then(r => r.data);

export const getShowdownMiEquipo = (codigo, uuidDispositivo) => 
    axiosClient.get(`/showdown/${codigo}/mi-equipo`, { params: { uuidDispositivo } }).then(r => r.data);

// Las pantallas del Relámpago reciben el API por prop: el de la liga o el de la Selección (seleccionApi)
export const showdownApi = {
    getEvento: getShowdownEvento,
    getMercado: getShowdownMercado,
    participar: participarShowdown,
    getRanking: getShowdownRanking,
    getMiEquipo: getShowdownMiEquipo,
};
