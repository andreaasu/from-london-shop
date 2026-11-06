
import { supabaseAdmin } from './supabase.js';

export const OWNER_EMAIL = 'andreaaziz83@gmail.com';

export async function verifyAdmin(req, db = supabaseAdmin) {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !/^Bearer \S+$/i.test(authHeader)) {
        throw Object.assign(new Error('Authentication required'), { status: 401 });
    }

    const token = authHeader.slice(7);

    // Verify the JWT
    const { data: { user }, error } = await db.auth.getUser(token);

    if (error || !user) {
        throw Object.assign(new Error('Invalid session. Please sign in again.'), { status: 401 });
    }

    // Strict email check
    if (user.email?.toLowerCase() !== OWNER_EMAIL.toLowerCase()) {
        throw Object.assign(new Error('Unauthorized: Not the owner'), { status: 403 });
    }

    return user;
}
