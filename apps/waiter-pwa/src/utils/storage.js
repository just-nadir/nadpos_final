// LocalStorage helper funksiyalari

const KEYS = {
    USER: 'waiter_user',
    SERVER_URL: 'server_url',
    THEME: 'theme',
};

// User saqlash/olish
export function saveUser(user) {
    localStorage.setItem(KEYS.USER, JSON.stringify(user));
}

export function getUser() {
    try {
        const user = localStorage.getItem(KEYS.USER);
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

export function removeUser() {
    localStorage.removeItem(KEYS.USER);
}

// Server URL
export function saveServerUrl(url) {
    localStorage.setItem(KEYS.SERVER_URL, url);
}

export function getServerUrl() {
    return localStorage.getItem(KEYS.SERVER_URL) || '';
}

// Umumiy
export function clearAll() {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}
