
import axios, { AxiosError } from 'axios';
import type {
    SuperAdminStats,
    Restaurant,
    CreateRestaurantPayload,
    UpdateRestaurantPayload,
} from '../types/api';

// Base URL from environment, fallback to localhost for dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Attach JWT token to every request (if available)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Global response handling (auth errors, etc.)
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const status = error.response?.status;

        if (status === 401 || status === 403) {
            // Clear auth info and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export const getSuperAdminStats = async (): Promise<SuperAdminStats> => {
    const response = await api.get<SuperAdminStats>('/stats/super-admin');
    return response.data;
};

export const getRestaurants = async (): Promise<Restaurant[]> => {
    const response = await api.get<Restaurant[]>('/restaurants');
    return response.data;
};

export const createRestaurant = async (data: CreateRestaurantPayload): Promise<Restaurant> => {
    const response = await api.post<Restaurant>('/restaurants', data);
    return response.data;
};

export const updateRestaurant = async (
    id: string,
    data: UpdateRestaurantPayload
): Promise<Restaurant> => {
    const response = await api.patch<Restaurant>(`/restaurants/${id}`, data);
    return response.data;
};

export const deleteRestaurant = async (id: string): Promise<void> => {
    await api.delete(`/restaurants/${id}`);
};

export interface AppConfig {
    techSupportPhone: string | null;
}

export const getConfig = async (): Promise<AppConfig> => {
    const response = await api.get<AppConfig>('/config');
    return response.data;
};

export const updateConfig = async (data: Partial<AppConfig>): Promise<AppConfig> => {
    const response = await api.patch<AppConfig>('/config', data);
    return response.data;
};

export default api;
