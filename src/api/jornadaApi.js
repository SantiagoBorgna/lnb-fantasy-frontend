import axiosClient from './axiosClient'

export const getJornadaActiva = () =>
    axiosClient.get('/jornadas/activa').then(r => r.data)

export const getJornadaProxima = () =>
    axiosClient.get('/jornadas/proxima').then(r => r.data)

export const getJornadas = () =>
    axiosClient.get('/jornadas').then(r => r.data)

export const getPartidosJornada = async (jornadaId) => {
    const res = await axiosClient.get(`/jornadas/${jornadaId}/partidos`)
    return res.data
}