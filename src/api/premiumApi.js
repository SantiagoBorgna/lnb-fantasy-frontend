import api from './axiosClient';
import { LIGA_PRINCIPAL } from '../config/ligas';

// El Premium es uno solo para todas las ligas y se compra en la Liga Nacional
export const checkoutPremium = async (email) => {
    const response = await api.post('/premium/checkout', { email }, { baseURL: LIGA_PRINCIPAL.apiUrl });
    return response.data;
};

export const obtenerConsejos = async () => {
    const response = await api.get('/premium/consejero');
    return response.data;
};

export const dismissVencimientoPremium = async () => {
    const response = await api.post('/premium/dismiss-vencimiento');
    return response.data;
};
