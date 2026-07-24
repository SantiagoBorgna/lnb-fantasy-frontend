import axiosClient from './axiosClient'

export const getPlantel = (torneoId, usuarioId) => {
    if (torneoId && usuarioId) {
        return axiosClient.get(`/plantel/torneo/${torneoId}/usuario/${usuarioId}`).then(r => r.data)
    }
    return axiosClient.get('/plantel').then(r => r.data)
}

export const guardarPlantel = (body) =>
    axiosClient.post('/plantel', body).then(r => r.data)

export const realizarTransferencia = (body) =>
    axiosClient.post('/plantel/transferencia', body).then(r => r.data)

export const cambiarDt = (nuevoDtId, torneoId = null) =>
    axiosClient.post(torneoId ? `/plantel/dt/${nuevoDtId}?torneoId=${torneoId}` : `/plantel/dt/${nuevoDtId}`).then(r => r.data)

export const getEstadisticasJornada = (jornadaId, torneoId = null) =>
    axiosClient.get(`/plantel/estadisticas/${jornadaId}`, { params: { torneoId } }).then(res => res.data)

export const getPlantelJornada = (jornadaId) =>
    axiosClient.get(`/plantel/jornada/${jornadaId}`).then(r => r.data)

export const getPlantelAjeno = (equipoVirtualId, jornadaId, torneoId = null) => {
    if (jornadaId === 'actual') return getPlantelActualAjeno(equipoVirtualId, torneoId);
    return axiosClient.get(`/plantel/equipo/${equipoVirtualId}/jornada/${jornadaId}`, { params: { torneoId } }).then(r => r.data)
}

export const getPlantelHistoricoDeTorneo = (torneoId, jornadaId, usuarioId) =>
    axiosClient.get(`/plantel/torneo/${torneoId}/jornada/${jornadaId}/usuario/${usuarioId}`).then(r => r.data)

export const getEstadisticasAjenas = (equipoVirtualId, jornadaId, torneoId = null) => {
    if (jornadaId === 'actual') return getEstadisticasActualesAjenas(equipoVirtualId, torneoId);
    return axiosClient.get(`/plantel/equipo/${equipoVirtualId}/estadisticas/${jornadaId}`, { params: { torneoId } }).then(r => r.data)
}

export const getPlantelActualAjeno = (equipoVirtualId, torneoId = null) =>
    axiosClient.get(`/plantel/equipo/${equipoVirtualId}/actual`, { params: { torneoId } }).then(r => r.data)

export const getEstadisticasActualesAjenas = (equipoVirtualId, torneoId = null) =>
    axiosClient.get(`/plantel/equipo/${equipoVirtualId}/actual/estadisticas`, { params: { torneoId } }).then(r => r.data)