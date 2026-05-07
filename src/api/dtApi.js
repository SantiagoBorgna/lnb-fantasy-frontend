import axiosClient from './axiosClient'

export const getDts = () =>
    axiosClient.get('/dt').then(r => r.data)