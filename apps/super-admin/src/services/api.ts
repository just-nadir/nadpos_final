
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000',
});


export const getSuperAdminStats = async () => {
    const response = await api.get('/stats/super-admin');
    return response.data;
};

export const getRestaurants = async () => {
    const response = await api.get('/restaurants');
    return response.data;
};

export const createRestaurant = async (data: any) => {
    const response = await api.post('/restaurants', data);
    return response.data;
};

export const updateRestaurant = async (id: string, data: any) => {
    const response = await api.patch(`/restaurants/${id}`, data);
    return response.data;
};

export const deleteRestaurant = async (id: string) => {
    const response = await api.delete(`/restaurants/${id}`);
    return response.data;
};

export default api;
