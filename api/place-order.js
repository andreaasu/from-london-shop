import { supabaseAdmin } from './_utils/supabase.js';
import { processOrderNotifications } from './_utils/order-notifications.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    const { customer, items } = req.body || {};
    if (!customer || typeof customer.name !== 'string' || !customer.name.trim() ||
        !Array.isArray(items) || !items.length || items.length > 100 ||
        items.some(i => !i || typeof i.productId !== 'string' || !i.size || !Number.isInteger(i.qty) || i.qty < 1) ||
        (customer.email && (typeof customer.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)))) {
        return res.status(400).json({ error: 'Invalid order details' });
    }
    let order;
    try {
        const { data, error } = await supabaseAdmin.rpc('place_order', { customer, items });
        if (error) throw error;
        order = data;
    } catch {
        console.error('order_creation_failed');
        return res.status(500).json({ error: 'Unable to save your order. Please try again.' });
    }
    // Only use the ID returned by the successful RPC, never a browser-supplied order ID.
    try {
        if (order?.orderId != null) await processOrderNotifications(supabaseAdmin, { orderId: String(order.orderId), limit: 2 });
    } catch {
        console.error('order_notification_processing_failed', { orderId: order?.orderId });
    }
    return res.status(200).json(order);
}
