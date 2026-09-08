import api from './axiosClient';

export const checkoutPremium = async (email) => {
    const response = await api.post('/premium/checkout', { email });
    return response.data;
};

export const simularCompraPremium = async () => {
    const response = await api.post('/premium/simular-compra');
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
