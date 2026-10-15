import axiosClient from './axiosClient'

export const getRankingGlobal = (limite = 100) =>
    axiosClient.get('/ranking/global', { params: { limite } }).then(r => r.data)

export const getRankingJornada = (jornadaId, limite = 100) =>
    axiosClient.get(`/ranking/jornada/${jornadaId}`, { params: { limite } })
        .then(r => r.data)

export const getRankingJornadaTorneo = (torneoId, jornadaId, limite = 500) =>
    axiosClient.get(`/ranking/torneo/${torneoId}/jornada/${jornadaId}`, { params: { limite } })
        .then(r => r.data)

export const getMiPosicion = () =>
    axiosClient.get('/ranking/mi-posicion').then(r => r.data)
// Puntaje y puestos (fecha y general) del usuario en una jornada finalizada. null si no jugó.
export const getMiResumenJornada = (jornadaId) =>
    axiosClient.get(`/ranking/jornada/${jornadaId}/mi-resumen`).then(r => r.data || null)
