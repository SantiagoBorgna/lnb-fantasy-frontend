import axiosClient from './axiosClient'

export const getJugadores = (params) =>
    axiosClient.get('/mercado/jugadores', { params }).then(r => r.data)
// params: { posicion?, nombre? }

export const getJugador = (id) =>
    axiosClient.get(`/mercado/jugadores/${id}`).then(r => r.data)

export const getJugadorStats = (jugadorId) =>
    axiosClient.get(`/mercado/jugadores/${jugadorId}/stats`).then(r => r.data)