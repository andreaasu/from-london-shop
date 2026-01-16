
import { verifyAdmin } from '../_utils/auth.js';
import { supabaseAdmin } from '../_utils/supabase.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    try {
        // 1. Verify Authentication (Owner only)
        await verifyAdmin(req);

        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        // GET /api/admin/orders
        if (req.method === 'GET') {
            let query = supabaseAdmin
                .from('orders')
                .select(`
                *,
      order_items (
        id,
        product_id,
        size,
        qty,
        price,
        product:products (
          id,
          name,
          images
        )
      )
    `)
                .order('created_at', { ascending: false });

            if (id) {
                query = query.eq('id', id).single();
            }

            const { data, error } = await query;
            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // PUT /api/admin/orders?id=... (Update status)
        if (req.method === 'PUT') {
            if (!id) throw new Error('Missing Order ID');
            const body = await req.json();

            // Only allow updating specific fields like status
            if (!body.status) {
                throw new Error('No status provided');
            }

            const { data, error } = await supabaseAdmin
                .from('orders')
                .update({ status: body.status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response('Method Not Allowed', { status: 405 });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: error.message.includes('Unauthorized') ? 403 : 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
