import axiosClient from './axiosClient'

export const getPlantel = () =>
    axiosClient.get('/plantel').then(r => r.data)

export const guardarPlantel = (body) =>
    axiosClient.post('/plantel', body).then(r => r.data)

export const realizarTransferencia = (body) =>
    axiosClient.post('/plantel/transferencia', body).then(r => r.data)

export const cambiarDt = (dtId) =>
    axiosClient.post(`/plantel/dt/${dtId}`).then(r => r.data)

export const getEstadisticasJornada = (jornadaId) =>
    axiosClient.get(`/plantel/estadisticas/${jornadaId}`).then(r => r.data)

export const getPlantelJornada = (jornadaId) =>
    axiosClient.get(`/plantel/jornada/${jornadaId}`).then(r => r.data)