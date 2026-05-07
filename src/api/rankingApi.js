import axiosClient from './axiosClient'

export const getRankingGlobal = (limite = 100) =>
    axiosClient.get('/ranking/global', { params: { limite } }).then(r => r.data)

export const getRankingJornada = (jornadaId, limite = 100) =>
    axiosClient.get(`/ranking/jornada/${jornadaId}`, { params: { limite } })
        .then(r => r.data)

export const getMiPosicion = () =>
    axiosClient.get('/ranking/mi-posicion').then(r => r.data)