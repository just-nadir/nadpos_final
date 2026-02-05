// API xizmatlari - Server bilan aloqa
const API_BASE = import.meta.env.DEV
    ? `http://${window.location.hostname}:3001`
    : '';

// Serverdan ma'lumot olish
async function fetchAPI(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Server xatosi' }));
            throw new Error(error.error || `HTTP Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API Error [${endpoint}]:`, error);
        throw error;
    }
}

// ==== AUTH API ====
export async function login(pin) {
    return fetchAPI('/api/login', {
        method: 'POST',
        body: JSON.stringify({ pin }),
    });
}

// ==== TABLES API ====
export async function getHalls() {
    return fetchAPI('/api/halls');
}

export async function getTables() {
    return fetchAPI('/api/tables');
}

export async function getTableItems(tableId) {
    return fetchAPI(`/api/tables/${tableId}/items`);
}

export async function updateTableGuests(tableId, count) {
    return fetchAPI('/api/tables/guests', {
        method: 'POST',
        body: JSON.stringify({ tableId, count }),
    });
}

// ==== PRODUCTS API ====
export async function getCategories() {
    return fetchAPI('/api/categories');
}

export async function getProducts() {
    return fetchAPI('/api/products');
}

// ==== ORDERS API ====
export async function addBulkItems(tableId, items, waiterId) {
    return fetchAPI('/api/orders/bulk-add', {
        method: 'POST',
        body: JSON.stringify({ tableId, items, waiterId }),
    });
}

// ==== SETTINGS API ====
export async function getSettings() {
    return fetchAPI('/api/settings');
}

// ==== SYSTEM API ====
export async function getSystemInfo() {
    return fetchAPI('/api/system/info');
}
