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
