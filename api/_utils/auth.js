
import { supabaseAdmin } from './supabase.js';

const OWNER_EMAIL = 'andreaaziz83@gmail.com';

export async function verifyAdmin(req) {
    const authHeader = req.headers.get('authorization');

    if (!authHeader) {
        throw new Error('Missing Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
        throw new Error('Invalid token');
    }

    // Strict email check
    if (user.email !== OWNER_EMAIL) {
        throw new Error('Unauthorized: Not the owner');
    }

    return user;
}
