
import api from './api';

interface LoginResponse {
    access_token: string;
    user: unknown;
}

export const login = async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', {
        username,
        password,
    });
    if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

export const getCurrentUser = <T = unknown>(): T | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr) as T;
    return null;
};
