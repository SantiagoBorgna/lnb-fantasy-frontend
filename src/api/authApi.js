import axiosClient from './axiosClient'

export const getMe = () =>
    axiosClient.get('/auth/me').then(r => r.data)

export const setEquipoFavorito = (equipoId) =>
    axiosClient.patch(`/auth/equipo-favorito/${equipoId}`).then(r => r.data)

export const logout = () =>
    axiosClient.post('/auth/logout').then(r => r.data)

export const getPerfil = () =>
    axiosClient.get('/onboarding/perfil').then(r => r.data)

export const completarPerfil = (body) =>
    axiosClient.post('/onboarding/completar-perfil', body).then(r => r.data)

export const activarUsuario = () =>
    axiosClient.post('/onboarding/activar').then(r => r.data)

export const getEquiposParaOnboarding = () =>
    axiosClient.get('/onboarding/equipos').then(r => r.data)