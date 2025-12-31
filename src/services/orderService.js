import { supabase } from '../lib/supabaseClient';

const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE === 'true';

export const orderService = {
    async createOrder(orderData) {
        // orderData: { customer, items, total, date, status }
        const order = {
            ...orderData,
            status: 'pending',
            paymentMethod: 'COD',
            createdAt: new Date().toISOString(),
        };

        if (USE_SUPABASE && supabase) {
            const { data, error } = await supabase.from('orders').insert([order]).select();
            if (error) throw error;
            return data[0];
        } else {
            // Mock: Save to localStorage for persistence demo
            const existingOrders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
            const newOrder = { ...order, id: `ord-${Date.now()}` };
            existingOrders.push(newOrder);
            localStorage.setItem('mock_orders', JSON.stringify(existingOrders));

            console.log('Order created (Mock):', newOrder);
            return newOrder;
        }
    }
};
