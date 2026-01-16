
import { verifyAdmin } from '../_utils/auth.js';
import { supabaseAdmin } from '../_utils/supabase.js';

export const config = {
    runtime: 'edge',
};

export default async function handler(req) {
    try {
        // 1. Verify Authentication (Owner only)
        if (req.method !== 'GET') { // Optional: Allow public GET if via this API? No, requirement says public only SELECT via Supabase client, this API is for Admin.
            await verifyAdmin(req);
        } else {
            // Even for GET, if this is strict admin API, let's secure it. 
            // User asked for "Protect admin routes... Access denied". 
            // Public site uses supabase-js directly.
            await verifyAdmin(req);
        }

        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        // GET /api/admin/products
        if (req.method === 'GET') {
            let query = supabaseAdmin
                .from('products')
                .select('*')
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

        // POST /api/admin/products
        if (req.method === 'POST') {
            const body = await req.json();

            // Basic validation could go here

            const { data, error } = await supabaseAdmin
                .from('products')
                .insert(body)
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                status: 201,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // PUT /api/admin/products?id=...
        if (req.method === 'PUT') {
            if (!id) throw new Error('Using UPDATE without ID is unsafe');
            const body = await req.json();

            const { data, error } = await supabaseAdmin
                .from('products')
                .update(body)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return new Response(JSON.stringify(data), {
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // DELETE /api/admin/products?id=...
        if (req.method === 'DELETE') {
            if (!id) throw new Error('Using DELETE without ID is unsafe');

            const { error } = await supabaseAdmin
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), {
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
