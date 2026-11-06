import { verifyAdmin } from '../_utils/auth.js';
import { supabaseAdmin as db } from '../_utils/supabase.js';
import { allRows, storedStatus, fail, json, errorResponse } from '../_utils/admin.js';
export const config = { runtime: 'edge' };

export default async function handler(req) {
    try {
        await verifyAdmin(req);
        const id = new URL(req.url).searchParams.get('id');
        if (req.method === 'GET') {
            const select = '*, order_items(*, products(id,name,images))';
            if (!id) return json(await allRows(() => db.from('orders').select(select).order('created_at', { ascending: false }).order('id')));
            const { data, error } = await db.from('orders').select(select).eq('id', id).single();
            if (error) throw error;
            return json(data);
        }
        if (req.method === 'PUT') {
            if (!id) throw fail('Order ID is required.');
            const body = await req.json();
            const status = storedStatus(body?.status);
            if (!status) throw fail('Invalid order status.');
            let query = db.from('orders').update({ status }).eq('id', id);
            if (body.expectedStatus) query = query.eq('status', body.expectedStatus);
            const { data, error } = await query.select().maybeSingle();
            if (error) throw error;
            if (!data) throw fail('This order changed. Refresh before trying again.', 409);
            return json(data);
        }
        return json({ error: 'Method Not Allowed' }, 405);
    } catch (error) { return errorResponse(error); }
}
