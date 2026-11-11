import { verifyAdmin } from '../_utils/auth.js';
import { supabaseAdmin as db } from '../_utils/supabase.js';
import { allRows, productPayload, fail, json, errorResponse } from '../_utils/admin.js';
export const config = { runtime: 'edge' };

export default async function handler(req) {
    try {
        await verifyAdmin(req);
        const url = new URL(req.url);
        const id = url.searchParams.get('id');
        if (req.method === 'GET') {
            if (!id) return json(await allRows(() => db.from('products').select('*').order('id')));
            const { data, error } = await db.from('products').select('*').eq('id', id).single();
            if (error) throw error;
            return json(data);
        }
        if (req.method === 'POST' && url.searchParams.get('action') === 'upload') {
            const { content, type, compress = true } = await req.json();
            const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
            if (typeof compress !== 'boolean') throw fail('Invalid compression option.');
            const limit = compress ? 99999 : 3000000;
            if (!Object.hasOwn(extensions, type) || (compress && type !== 'image/webp') || typeof content !== 'string' || content.length > 4 * Math.ceil(limit / 3)) throw fail(compress ? 'Upload a compressed WebP image under 100 KB.' : 'Upload a JPEG, PNG, WebP, or GIF image up to 3 MB.');
            let bytes;
            try { bytes = Uint8Array.from(atob(content), c => c.charCodeAt(0)); } catch { throw fail('Invalid image data.'); }
            const header = new TextDecoder().decode(bytes.slice(0, 12));
            const valid = type === 'image/webp' ? header.startsWith('RIFF') && header.slice(8) === 'WEBP'
                : type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
                : type === 'image/png' ? [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
                : header.startsWith('GIF87a') || header.startsWith('GIF89a');
            if (!valid || bytes.length > limit) throw fail('Invalid image or image exceeds the upload size limit.');
            const path = `admin/${crypto.randomUUID()}.${extensions[type]}`;
            const { error } = await db.storage.from('product-images').upload(path, bytes, { contentType: type, upsert: false });
            if (error) throw error;
            return json({ url: db.storage.from('product-images').getPublicUrl(path).data.publicUrl }, 201);
        }
        if (req.method === 'POST' || req.method === 'PUT') {
            if (req.method === 'PUT' && !id) throw fail('Product ID is required.');
            const body = await req.json();
            const payload = productPayload(body, req.method === 'POST');
            // Always append new products, regardless of the form's default value.
            // Moving a product to another category also places it at that category's end.
            let append = req.method === 'POST';
            if (!append && 'gender' in payload) {
                const { data: current, error } = await db.from('products').select('gender').eq('id', id).single();
                if (error) throw error;
                append = current.gender !== payload.gender;
            }
            if (append) {
                const category = payload.gender || null;
                const peers = await allRows(() => {
                    const query = db.from('products').select('id, display_order').order('id');
                    return category === null ? query.is('gender', null) : query.eq('gender', category);
                });
                payload.display_order = Math.max(0, ...peers.map(p => Number(p.display_order) || 0)) + 1;
                // Legacy rows without positions must remain ahead of the new arrival.
                for (const peer of peers.filter(p => p.display_order == null)) {
                    const { error } = await db.from('products').update({ display_order: payload.display_order++ }).eq('id', peer.id);
                    if (error) throw error;
                }
            }
            let query;
            if (req.method === 'POST') query = db.from('products').insert(payload);
            else {
                query = db.from('products').update(payload).eq('id', id);
                if ('stock_by_size' in payload) {
                    if (!Object.hasOwn(body, 'expectedStock')) throw fail('Refresh this product before changing stock.');
                    // Compare-and-swap: a checkout decrement must never be overwritten.
                    query = body.expectedStock === null ? query.is('stock_by_size', null) : query.eq('stock_by_size', JSON.stringify(body.expectedStock));
                }
            }
            const { data, error } = await query.select().maybeSingle();
            if (error) throw error;
            if (!data) throw fail('Stock changed or the product was removed. Refresh before saving again.', 409);
            return json(data, req.method === 'POST' ? 201 : 200);
        }
        if (req.method === 'DELETE') {
            if (!id) throw fail('Product ID is required.');
            const { count, error: historyError } = await db.from('order_items').select('id', { count: 'exact', head: true }).eq('product_id', id);
            if (historyError) throw historyError;
            if (count) throw fail('This product belongs to historical orders and cannot be deleted.', 409);
            const { error } = await db.from('products').delete().eq('id', id);
            if (error) throw error;
            return json({ success: true });
        }
        return json({ error: 'Method Not Allowed' }, 405);
    } catch (error) { return errorResponse(error); }
}
