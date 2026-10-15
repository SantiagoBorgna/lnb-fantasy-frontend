import axiosClient from './axiosClient'
import { LIGAS } from '../config/ligas'

export const getMe = () =>
    axiosClient.get('/auth/me').then(r => r.data)

export const setEquipoFavorito = (equipoId) =>
    axiosClient.patch(`/auth/equipo-favorito/${equipoId}`).then(r => r.data)

// La sesión es la misma en todas las ligas: se cierra en todos los backends
export const logout = () =>
    Promise.allSettled(LIGAS.map(liga => axiosClient.post('/auth/logout', null, { baseURL: liga.apiUrl })))

export const getPerfil = () =>
    axiosClient.get('/onboarding/perfil').then(r => r.data)

export const actualizarPerfil = (body) =>
    axiosClient.put('/auth/perfil', body).then(r => r.data)

export const completarPerfil = (body) =>
    axiosClient.post('/onboarding/completar-perfil', body).then(r => r.data)

export const activarUsuario = () =>
    axiosClient.post('/onboarding/activar').then(r => r.data)

export const getEquiposParaOnboarding = () =>
    axiosClient.get('/onboarding/equipos').then(r => r.data)

export const marcarAyudaVistaApi = (pagina) =>
    axiosClient.post(`/onboarding/ayuda/${pagina}`).then(r => r.data)