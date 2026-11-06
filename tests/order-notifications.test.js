import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOrderEmail } from '../api/_utils/order-email.js';
import { processOrderNotifications, customerCanBeConfirmed, safeToRetrySmtp, createGmailTransport } from '../api/_utils/order-notifications.js';

const snapshot = {
    order: { id: 'saved-id', order_code: 'FL-123', customer_name: '<script>test</script>', email: 'customer@example.test', phone: '123', address: '<b>Street</b>', city: 'Cairo', total: 300, created_at: '2026-11-06T10:00:00Z', status: 'pending' },
    items: [{ product_name: 'Shirt & coat', qty: 2, unit_price: 150, size: 'M' }],
};
const env = { GMAIL_USER: 'store@example.test', GMAIL_APP_PASSWORD: 'test', EMAIL_FROM: 'Store <store@example.test>', ORDER_NOTIFICATION_EMAIL: 'owner@example.test' };
function fixture() {
    const jobs = ['customer', 'admin'].map((kind, i) => ({ id: i + 1, kind, snapshot, status: 'pending', attempts: 0, lease_token: `lease-${i}` }));
    const db = {
        async rpc() {
            const data = jobs.filter(j => j.status === 'pending').map(j => { j.status = 'sending'; j.attempts++; return structuredClone(j); });
            return { data };
        },
        from() {
            return { update(fields) {
                let id, token;
                return { eq(key, value) { if (key === 'id') id = value; else token = value; return this; }, async select() {
                    const job = jobs.find(j => j.id === id && j.lease_token === token);
                    if (job) Object.assign(job, fields);
                    return { data: job ? [{ id }] : [] };
                } };
            } };
        },
    };
    return { jobs, db };
}

test('branded emails escape saved customer/product fields and contain saved prices and details', () => {
    const customer = buildOrderEmail(snapshot, 'customer');
    const admin = buildOrderEmail(snapshot, 'admin');
    assert.ok(customer.html.includes('&lt;script&gt;'));
    assert.ok(!customer.html.includes('<script>'));
    for (const part of ['FL-123', 'Shirt &amp; coat', '150.00 EGP', '300.00 EGP', '#0070c9', 'Cash on delivery', 'pending', 'viewport']) assert.ok(customer.html.includes(part), part);
    assert.ok(admin.text.includes('customer@example.test'));
    assert.ok(admin.text.includes('Phone: 123'));
    assert.ok(admin.text.includes('(Cairo)'));
});

test('bad saved pricing fails safely rather than using live product prices', () => {
    assert.throws(() => buildOrderEmail({ ...snapshot, items: [{ qty: 2 }] }, 'customer'));
});

test('prepaid customer confirmations require verified payment', () => {
    assert.equal(customerCanBeConfirmed({}), true);
    assert.equal(customerCanBeConfirmed({ payment_method: 'card', payment_status: 'pending' }), false);
    assert.equal(customerCanBeConfirmed({ payment_method: 'card', payment_status: 'paid' }), true);
});

test('partial SMTP rejection retries only failed recipient with identical persisted message', async () => {
    const { jobs, db } = fixture();
    const calls = [];
    let failAdmin = true;
    const client = { async sendMail(message) {
        calls.push(structuredClone(message));
        if (message.to === env.ORDER_NOTIFICATION_EMAIL && failAdmin) throw Object.assign(new Error('Temporary rejection'), { responseCode: 451, command: 'DATA' });
        return { accepted: [message.to], messageId: message.messageId };
    } };
    assert.deepEqual(await processOrderNotifications(db, { env, client }), { sent: 1, failed: 1, skipped: 0 });
    assert.equal(jobs[0].status, 'sent');
    assert.equal(jobs[1].status, 'pending');
    failAdmin = false;
    assert.deepEqual(await processOrderNotifications(db, { env: { ...env, EMAIL_FROM: 'changed@example.test' }, client }), { sent: 1, failed: 0, skipped: 0 });
    assert.deepEqual(calls[1], calls[2]);
    assert.equal(calls.length, 3);
    await processOrderNotifications(db, { env, client });
    assert.equal(calls.length, 3);
});

test('missing configuration leaves retryable jobs without calling SMTP', async () => {
    const { db, jobs } = fixture();
    assert.equal((await processOrderNotifications(db, { env: {} })).failed, 2);
    assert.ok(jobs.every(j => j.status === 'pending' && j.last_error === 'Missing email configuration'));
});

test('missing customer email skips customer only; network exception does not block admin', async () => {
    const { db, jobs } = fixture();
    jobs[0].snapshot = { ...snapshot, order: { ...snapshot.order, email: null } };
    const client = { async sendMail() { throw new Error('network'); } };
    assert.deepEqual(await processOrderNotifications(db, { env, client }), { sent: 0, failed: 1, skipped: 1 });
    assert.equal(jobs[0].status, 'skipped');
    assert.equal(jobs[1].status, 'review');
});

test('accepted send with failed database acknowledgement is held to prevent duplicate SMTP submission', async () => {
    const { db, jobs } = fixture();
    jobs[1].status = 'sent';
    const originalFrom = db.from;
    let failAcknowledgement = true;
    db.from = (...args) => {
        const table = originalFrom(...args);
        const update = table.update;
        table.update = fields => {
            if (fields.status === 'sent' && failAcknowledgement) {
                failAcknowledgement = false;
                return { eq() { return this; }, async select() { return { error: new Error('database offline') }; } };
            }
            return update(fields);
        };
        return table;
    };
    const messages = [];
    const client = { async sendMail(message) { messages.push(message.messageId); return { accepted: [message.to], messageId: message.messageId }; } };
    assert.equal((await processOrderNotifications(db, { env, client })).failed, 1);
    assert.equal(jobs[0].status, 'review');
    assert.equal((await processOrderNotifications(db, { env, client })).sent, 0);
    assert.deepEqual(messages, ['<order-notification-1@gmail.com>']);
});

test('failure to persist request prevents sending, and queued prepaid orders are held', async () => {
    const { db, jobs } = fixture();
    jobs[0].snapshot = { ...snapshot, order: { ...snapshot.order, payment_method: 'card' } };
    const originalFrom = db.from;
    db.from = (...args) => {
        const table = originalFrom(...args);
        const update = table.update;
        table.update = fields => fields.message
            ? { eq() { return this; }, async select() { return { error: new Error('offline') }; } }
            : update(fields);
        return table;
    };
    let sends = 0;
    const client = { async sendMail() { sends++; return { accepted: ['unexpected'] }; } };
    await processOrderNotifications(db, { env, client });
    assert.equal(jobs[0].status, 'review');
    assert.equal(jobs[1].status, 'pending');
    assert.equal(sends, 0);
});

test('Gmail transport enforces TLS and uses app password without spaces', () => {
    const transport = createGmailTransport({ ...env, GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' });
    assert.equal(transport.options.host, 'smtp.gmail.com');
    assert.equal(transport.options.port, 465);
    assert.equal(transport.options.secure, true);
    assert.equal(transport.options.auth.pass, 'abcdefghijklmnop');
    assert.equal(transport.options.disableFileAccess, true);
    transport.close();
});

test('only definite rejection and pre-submission failures can be automatically retried', () => {
    assert.equal(safeToRetrySmtp({ responseCode: 451, command: 'DATA' }), true);
    assert.equal(safeToRetrySmtp({ code: 'EAUTH' }), true);
    assert.equal(safeToRetrySmtp({ code: 'ETIMEDOUT', command: 'CONN' }), true);
    assert.equal(safeToRetrySmtp({ code: 'ETIMEDOUT', command: 'DATA' }), false);
    assert.equal(safeToRetrySmtp({ code: 'ECONNECTION', command: 'DATA' }), false);
});

test('SMTP submission hold is durable before send and prevents concurrent/restarted workers from resending', async () => {
    const { db, jobs } = fixture();
    jobs[1].status = 'sent';
    const client = { async sendMail(message) {
        assert.equal(jobs[0].status, 'review');
        assert.ok(jobs[0].message.messageId);
        assert.equal((await processOrderNotifications(db, { env, client })).sent, 0);
        return { accepted: [message.to], messageId: message.messageId };
    } };
    assert.equal((await processOrderNotifications(db, { env, client })).sent, 1);
    assert.equal(jobs[0].status, 'sent');
    assert.equal(jobs[0].resend_id, jobs[0].message.messageId);
});
