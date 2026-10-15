import axiosClient from './axiosClient'

// Datos de la liga que juega el backend actual (nombre, URL del fixture en GES, ...)
export const getConfigLiga = () =>
    axiosClient.get('/config').then(r => r.data)
