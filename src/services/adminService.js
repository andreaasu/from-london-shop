
import { supabase } from '../lib/supabaseClient';

const API_BASE = '/api/admin';

async function authFetch(endpoint, options = {}) {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error('No active session');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
            const json = JSON.parse(errorText);
            errorMessage = json.error || errorText;
        } catch {
            // use raw text
        }
        throw new Error(errorMessage || 'API Request Failed');
    }

    // Handle empty responses (like 204)
    if (response.status === 204) return null;

    return response.json();
}

export const adminService = {
    // Products
    getProducts: () => authFetch('/products'),
    getProduct: (id) => authFetch(`/products?id=${encodeURIComponent(id)}`),
    createProduct: (data) => authFetch('/products', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateProduct: (id, data) => authFetch(`/products?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteProduct: (id) => authFetch(`/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
    }),

    // Orders
    getOrders: () => authFetch('/orders'),
    getOrder: (id) => authFetch(`/orders?id=${encodeURIComponent(id)}`),
    updateOrderStatus: (id, status, expectedStatus) => authFetch(`/orders?id=${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify({ status, expectedStatus }),
    }),
    getSettings: () => authFetch('/settings'),
    async uploadImage(file) {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error('Choose a JPEG, PNG, WebP or GIF under 2 MB.');
        const content = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file); });
        return authFetch('/products?action=upload', { method: 'POST', body: JSON.stringify({ content, type: file.type }) });
    },
};
