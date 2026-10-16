import axiosClient from './axiosClient'
import { LIGA_PRINCIPAL } from '../config/ligas'

// El Premium se contrata en la Liga Nacional: los pedidos de arrepentimiento van siempre ahí
const enPrincipal = { baseURL: LIGA_PRINCIPAL.apiUrl }

export const enviarArrepentimiento = (body) =>
    axiosClient.post('/arrepentimiento', body, enPrincipal).then(r => r.data)

export const getArrepentimientos = () =>
    axiosClient.get('/admin/arrepentimientos', enPrincipal).then(r => r.data)

export const resolverArrepentimiento = (id) =>
    axiosClient.patch(`/admin/arrepentimientos/${id}/resolver`, null, enPrincipal).then(r => r.data)
