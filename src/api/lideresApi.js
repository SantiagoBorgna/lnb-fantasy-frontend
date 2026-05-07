import axiosClient from './axiosClient'

export const getResumenLideres = () =>
    axiosClient.get('/lideres').then(r => r.data)

export const getTopCategoria = (categoria) =>
    axiosClient.get(`/lideres/${categoria}`).then(r => r.data)