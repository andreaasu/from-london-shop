import test from 'node:test';
import assert from 'node:assert/strict';

// Import the actual checkout API with no email credentials: no service may require
// SMTP credentials merely to load the route. Database calls are mocked below.
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
delete process.env.SMTP_USER;
delete process.env.SMTP_APP_PASSWORD;
const { default: handler } = await import('../api/place-order.js');
const { supabaseAdmin } = await import('../api/_utils/supabase.js');

const request = { method: 'POST', body: { customer: { name: 'Test', email: 'customer@example.test' }, items: [{ productId: 'shirt', size: 'M', qty: 1 }] } };
function response() {
    return { status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
}

test('saved order returns success even if notification queue processing throws', async () => {
    const original = supabaseAdmin.rpc;
    supabaseAdmin.rpc = async name => {
        if (name === 'place_order') return { data: { orderId: 'saved', total: 150 }, error: null };
        throw new Error('Notification infrastructure unavailable');
    };
    try {
        const res = response();
        await handler(request, res);
        assert.equal(res.code, 200);
        assert.deepEqual(res.body, { orderId: 'saved', total: 150 });
    } finally { supabaseAdmin.rpc = original; }
});

test('failed order never triggers notification processing', async () => {
    const original = supabaseAdmin.rpc;
    const calls = [];
    supabaseAdmin.rpc = async name => { calls.push(name); return { error: new Error('Unavailable stock') }; };
    try {
        const res = response();
        await handler(request, res);
        assert.equal(res.code, 500);
        assert.deepEqual(calls, ['place_order']);
    } finally { supabaseAdmin.rpc = original; }
});
