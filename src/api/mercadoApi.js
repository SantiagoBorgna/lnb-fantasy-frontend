import axiosClient from './axiosClient'

export const getMercadoJugadores = (filtros = {}) =>
    axiosClient.get('/mercado/jugadores', { params: filtros }).then(r => r.data)

export const getMercadoLibres = (torneoId, filtros = {}) =>
    axiosClient.get(`/mercado/libres/${torneoId}`, { params: filtros }).then(r => r.data)
// params: { posicion?, nombre? }

export const getJugador = (id) =>
    axiosClient.get(`/mercado/jugadores/${id}`).then(r => r.data)

export const getJugadorStats = (jugadorId) =>
    axiosClient.get(`/mercado/jugadores/${jugadorId}/stats`).then(r => r.data)

export const obtenerMisPropuestas = (torneoId, page = 0, size = 10) =>
    axiosClient.get(`/traspasos/torneo/${torneoId}`, { params: { page, size } }).then(r => r.data)

export const proponerTraspaso = (torneoId, request) =>
    axiosClient.post(`/traspasos/proponer`, request).then(r => r.data)

export const aceptarTraspaso = (propuestaId) =>
    axiosClient.post(`/traspasos/${propuestaId}/aceptar`).then(r => r.data)

export const rechazarTraspaso = (propuestaId) =>
    axiosClient.post(`/traspasos/${propuestaId}/rechazar`).then(r => r.data)

export const cancelarTraspaso = (propuestaId) =>
    axiosClient.post(`/traspasos/${propuestaId}/cancelar`).then(r => r.data)