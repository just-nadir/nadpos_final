
import api from './api';

export const login = async (phone: string, password: string) => {
    // Try to login as restaurant
    // Backend expects: { username (phone), password, machineId? }
    // Restaurant admin might not need machineId? Or maybe it does?
    // Let's assume for Admin Panel they don't need machineID, but backend requires it for Restaurants?
    // Wait, backend Auth logic for RESTAURANT role checks machineId. 
    // IF the user logs in as Restaurant Admin, they might need a way to bypass machineID or provide one.
    // OR, Restaurant Admin has a separate User Role?
    // Currently we only have RESTAURANT table.
    // Let's pass a dummy machineID or "WEB-ADMIN" if backend allows.
    // Checking backend logic: "if (user.role === 'RESTAURANT') { if (!loginDto.machineId) ... }"
    // So we MUST provide a machineId. Let's send "WEB-PANEL".

    const response = await api.post('/auth/login', {
        username: phone,
        password,
        machineId: "WEB-PANEL" // Virtual machine ID for Web Admin
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

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
};
