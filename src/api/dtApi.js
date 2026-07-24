import axiosClient from './axiosClient'

export const getDts = (torneoId = null) =>
    axiosClient.get(torneoId ? `/dt?torneoId=${torneoId}` : '/dt').then(r => r.data)