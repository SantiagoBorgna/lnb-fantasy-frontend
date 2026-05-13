import axiosClient from './axiosClient'

export const getTorneosPublicos = (nombre) =>
    axiosClient.get('/torneos', { params: { nombre } }).then(r => r.data)

export const getMisTorneos = () =>
    axiosClient.get('/torneos/mis-torneos').then(r => r.data)

export const crearTorneo = (body) =>
    axiosClient.post('/torneos', body).then(r => r.data)

export const unirseTorneo = (codigo) =>
    axiosClient.post(`/torneos/unirse/${codigo}`).then(r => r.data)

export const getTablaTorneo = (torneoId) =>
    axiosClient.get(`/ranking/torneo/${torneoId}`).then(r => r.data)

export const getTorneo = (torneoId) =>
    axiosClient.get(`/torneos/${torneoId}`).then(r => r.data)

export const salirDeTorneo = (torneoId) =>
    axiosClient.delete(`/torneos/${torneoId}/salir`).then(r => r.data)

export const editarTorneo = (torneoId, body) =>
    axiosClient.patch(`/torneos/${torneoId}/ajustes`, body).then(r => r.data)

export const expulsarParticipante = (torneoId, equipoVirtualId) =>
    axiosClient.delete(`/torneos/${torneoId}/participantes/${equipoVirtualId}`)
        .then(r => r.data)

export const getTorneoPorCodigo = async (codigo) => {
    const res = await axiosClient.get(`/torneos/codigo/${codigo}`)
    return res.data
}