import { supabase } from '../lib/supabaseClient';

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';

const normalizeItems = (items) => {
    if (items?.length && items[0]?.id && items[0]?.selectedSize) {
        return items.map(i => ({ productId: i.id, size: i.selectedSize, qty: i.quantity }));
    }
    if (items?.length && items[0]?.productId) {
        return items.map(i => ({ productId: i.productId, size: i.size, qty: i.qty }));
    }
    return [];
};


export const orderService = {
    async placeOrder(customer, items) {
        const normalizedItems = normalizeItems(items);
        if (!normalizedItems.length) throw new Error("Cart is empty");
        if (normalizedItems.some(x => !x.size)) throw new Error("Missing size");

        if (USE_SUPABASE) {
            const response = await fetch('/api/place-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    customer: {
                        name: customer.fullName ?? customer.name ?? "",
                        phone: customer.phone ?? "",
                        email: customer.email ?? null,
                        city: customer.city ?? null,
                        address: customer.address ?? null,
                        notes: customer.notes ?? null
                    },
                    items: normalizedItems
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to place order (${response.status})`);
            }

            const data = await response.json();
            return data; // { orderId, total }
        } else {
            console.warn('Supabase not active. Order would be mock.');
            throw new Error('Supabase integration required for order placement.');
        }
    }
};
