import axiosClient from './axiosClient';

export const waiverApi = {
    obtenerFaseRestringida: () => 
        axiosClient.get('/waivers/fase').then(res => res.data),

    obtenerOrdenPrioridad: async (torneoId) => {
        const { data } = await axiosClient.get(`/waivers/${torneoId}/prioridad`);
        return data;
    },

    obtenerMisReclamos: (torneoId) => 
        axiosClient.get(`/waivers/${torneoId}/mis-reclamos`).then(res => res.data),

    obtenerHistorialTransacciones: (torneoId, page = 0, size = 10) => 
        axiosClient.get(`/waivers/${torneoId}/transacciones`, { params: { page, size } }).then(res => res.data),

    registrarReclamo: (request) => 
        axiosClient.post('/waivers/reclamo', request).then(res => res.data),

    eliminarReclamo: (claimId) => 
        axiosClient.delete(`/waivers/reclamo/${claimId}`).then(res => res.data),
};
