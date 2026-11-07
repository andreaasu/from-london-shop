import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Exercise the browser-independent factory without Vite or real tracking requests.
const source = (await readFile(new URL('../src/lib/analytics.js', import.meta.url), 'utf8'))
    .split('export const analytics =')[0];
const { createAnalytics } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
function setup() {
    const stored = new Map();
    const scripts = [];
    const win = {
        localStorage: { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value) },
        location: { pathname: '/shop', origin: 'https://shop.example', search: '?email=private@example.com', hash: '#private', reload() {} },
    };
    const doc = { getElementById: id => scripts.find(s => s.id === id), createElement: () => ({}), head: { appendChild: s => scripts.push(s) } };
    return { win, scripts, analytics: createAnalytics(win, doc, 'G-TEST', 'clarity-test'), doc };
}
const product = { id: 'product-1', price: 250, quantity: 2, email: 'never-send@example.com', name: 'Unneeded name' };
const events = win => (win.dataLayer || []).filter(args => args[0] === 'event').map(args => [args[1], args[2]]);

test('no scripts or events before consent or after rejection', () => {
    const { analytics, win, scripts } = setup();
    analytics.pageView('first');
    analytics.ecommerce('add_to_cart', [product]);
    analytics.setConsent(false);
    analytics.purchase({ orderId: 'saved', total: 500 }, [product]);
    assert.equal(scripts.length, 0);
    assert.deepEqual(events(win), []);
});

test('SPA page views deduplicate StrictMode and omit URL parameters and admin routes', () => {
    const { analytics, win } = setup();
    analytics.setConsent(true);
    analytics.pageView('first');
    analytics.pageView('first');
    win.location.pathname = '/bag';
    analytics.pageView('second');
    win.location.pathname = '/admin/orders';
    analytics.pageView('admin');
    assert.equal(events(win).length, 2);
    assert.equal(events(win)[0][1].page_location, 'https://shop.example/shop');
    assert.equal(JSON.stringify(win.dataLayer).includes('private'), false);
});

test('recommended ecommerce payloads contain only product metrics in EGP', () => {
    const { analytics, win } = setup();
    analytics.setConsent(true);
    for (const name of ['view_item', 'add_to_cart', 'remove_from_cart', 'begin_checkout']) analytics.ecommerce(name, [product]);
    for (const [, payload] of events(win)) {
        assert.equal(payload.currency, 'EGP');
        assert.equal(payload.value, 500);
        assert.deepEqual(payload.items, [{ item_id: 'product-1', price: 250, quantity: 2 }]);
    }
    assert.equal(JSON.stringify(win.dataLayer).includes('never-send'), false);
});

test('purchase requires confirmation and is deduplicated across reloads', () => {
    const { analytics, win, doc } = setup();
    analytics.setConsent(true);
    analytics.purchase({}, [product]);
    const order = { orderId: 'supabase-order-id', total: 500, customer: 'never-send' };
    analytics.purchase(order, [product]);
    analytics.purchase(order, [product]);
    createAnalytics(win, doc, 'G-TEST', '').purchase(order, [product]);
    assert.equal(events(win).length, 1);
    assert.equal(events(win)[0][1].transaction_id, order.orderId);
    assert.equal(JSON.stringify(win.dataLayer).includes('never-send'), false);
});

test('Clarity loads once after consent and receives the consent signal', () => {
    const { analytics, win, scripts } = setup();
    win.location.search = '';
    win.location.hash = '';
    analytics.setConsent(true);
    analytics.pageView('first');
    analytics.pageView('second');
    assert.equal(scripts.filter(s => s.id === 'from-london-clarity').length, 1);
    assert.deepEqual([...win.clarity.q[0]], ['consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' }]);
    analytics.setConsent(false);
    assert.equal(win['ga-disable-G-TEST'], true);
    assert.equal([...win.clarity.q.at(-1)][0], 'stop');
});

test('approved regional policy skips opt-in without storing a fabricated user choice', async () => {
    const { analytics, win } = setup();
    win.location.search = '';
    win.location.hash = '';
    let requests = 0;
    win.fetch = async () => { requests++; return { ok: true, json: async () => ({ requiresConsent: false }) }; };
    await Promise.all([analytics.resolvePolicy(), analytics.resolvePolicy()]);
    assert.equal(requests, 1);
    assert.equal(analytics.getConsent(), true);
    assert.equal(analytics.getPolicy(), 'optional');
    assert.equal(win.localStorage.getItem('from-london-analytics-consent-v1'), null);
    analytics.pageView('regional');
    assert.equal(events(win).length, 1);
    // Explicit consent is not invented for Clarity: use its cookieless mode.
    assert.equal(win.clarity.q[0][1].analytics_Storage, 'denied');
    analytics.setConsent(false);
    assert.equal(analytics.getConsent(), false);
});

test('policy failures default to opt-in and explicit rejection wins over regional defaults', async () => {
    const { analytics, win } = setup();
    win.fetch = async () => { throw new Error('Offline'); };
    await analytics.resolvePolicy();
    assert.equal(analytics.getPolicy(), 'required');
    assert.equal(analytics.getConsent(), null);
    analytics.pageView('offline');
    assert.equal(events(win).length, 0);
    analytics.setConsent(false);
    const reloaded = createAnalytics(win, {}, 'G-TEST', '');
    win.fetch = async () => ({ ok: true, json: async () => ({ requiresConsent: false }) });
    await reloaded.resolvePolicy();
    assert.equal(reloaded.getConsent(), false);
});

test('browser privacy opt-out prevents tracking even in an approved region', async () => {
    const { win, doc, scripts } = setup();
    win.navigator = { globalPrivacyControl: true };
    win.fetch = async () => ({ ok: true, json: async () => ({ requiresConsent: false }) });
    const analytics = createAnalytics(win, doc, 'G-TEST', 'clarity-test');
    await analytics.resolvePolicy();
    analytics.setConsent(true);
    analytics.pageView('privacy');
    assert.equal(analytics.getConsent(), false);
    assert.equal(scripts.length, 0);
});
