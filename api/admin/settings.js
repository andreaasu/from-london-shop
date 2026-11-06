import { verifyAdmin } from '../_utils/auth.js';
import { json, errorResponse } from '../_utils/admin.js';
export const config = { runtime: 'edge' };
export default async function handler(req) {
    try {
        const user = await verifyAdmin(req);
        if (req.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);
        return json({ admin: user.email, storeName: 'From London', currency: 'EGP', payment: 'Cash on delivery',
            emailConfigured: Boolean(process.env.SMTP_USER && process.env.SMTP_APP_PASSWORD && process.env.EMAIL_FROM && process.env.ORDER_NOTIFICATION_EMAIL),
            retryConfigured: Boolean(process.env.CRON_SECRET) });
    } catch (error) { return errorResponse(error); }
}
