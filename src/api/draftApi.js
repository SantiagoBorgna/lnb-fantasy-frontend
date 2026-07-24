import axiosClient from './axiosClient'

export const iniciarDraft = (torneoId) =>
    axiosClient.post(`/torneos/${torneoId}/draft/iniciar`).then(r => r.data)

export const getEstadoDraft = (torneoId) =>
    axiosClient.get(`/torneos/${torneoId}/draft`).then(r => r.data)

export const elegirJugadorDraft = (torneoId, jugadorId) =>
    axiosClient.post(`/torneos/${torneoId}/draft/pick/${jugadorId}`).then(r => r.data)
