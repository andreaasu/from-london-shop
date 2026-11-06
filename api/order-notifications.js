import { timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from './_utils/supabase.js';
import { processOrderNotifications } from './_utils/order-notifications.js';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });
    const expected = `Bearer ${process.env.CRON_SECRET || ''}`;
    const actual = req.headers.authorization || '';
    if (!process.env.CRON_SECRET || Buffer.byteLength(actual) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(actual), Buffer.from(expected))) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        return res.status(200).json(await processOrderNotifications(supabaseAdmin, { limit: 2 }));
    } catch {
        console.error('order_email_queue_failed');
        return res.status(500).json({ error: 'Notification processing failed' });
    }
}
