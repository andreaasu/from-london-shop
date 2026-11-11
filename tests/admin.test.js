import test from 'node:test';
import assert from 'node:assert/strict';
import { allRows, productPayload, storedStatus } from '../api/_utils/admin.js';
import { dashboardStats, customerHistory, stockTotal, cairoDay } from '../src/utils/admin.js';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
const { verifyAdmin, OWNER_EMAIL } = await import('../api/_utils/auth.js');
const { supabaseAdmin } = await import('../api/_utils/supabase.js');
const { default: productsHandler } = await import('../api/admin/products.js');
const { default: ordersHandler } = await import('../api/admin/orders.js');
const { default: settingsHandler } = await import('../api/admin/settings.js');

test('admin authorization rejects missing, malformed, invalid and non-owner sessions', async () => {
    const req = header => new Request('https://example.test/api/admin/orders', { headers: header ? { authorization: header } : {} });
    const db = user => ({ auth: { async getUser() { return { data: { user }, error: null }; } } });
    await assert.rejects(verifyAdmin(req(), db(null)), { status:401 });
    await assert.rejects(verifyAdmin(req('Basic fake'), db(null)), { status:401 });
    await assert.rejects(verifyAdmin(req('Bearer fake'), db(null)), { status:401 });
    await assert.rejects(verifyAdmin(req('Bearer fake'), db({ email:'other@example.test' })), { status:403 });
    assert.equal((await verifyAdmin(req('Bearer valid'), db({ email:OWNER_EMAIL }))).email, OWNER_EMAIL);
});

test('every admin handler rejects requests before any database/storage operation', async () => {
    const original = supabaseAdmin.from;
    supabaseAdmin.from = () => { throw new Error('Database must not be reached'); };
    try {
        for (const handler of [productsHandler,ordersHandler,settingsHandler]) {
            for (const method of ['GET','POST','PUT','DELETE']) {
                const response = await handler(new Request('https://example.test/api/admin/test', { method }));
                assert.equal(response.status,401);
                assert.equal(response.headers.get('Cache-Control'),'no-store');
            }
        }
    } finally { supabaseAdmin.from = original; }
});

test('image upload accepts only bounded WebP and uses the existing bucket after authorization', async () => {
    const originalAuth = supabaseAdmin.auth.getUser, originalFrom = supabaseAdmin.storage.from;
    const uploaded = [];
    supabaseAdmin.auth.getUser = async () => ({ data:{ user:{ email:OWNER_EMAIL } } });
    supabaseAdmin.storage.from = bucket => {
        assert.equal(bucket, 'product-images');
        return {
            async upload(path, bytes, options) { uploaded.push({path,bytes,options}); return {}; },
            getPublicUrl(path) { return {data:{publicUrl:`https://example.test/${path}`}}; },
        };
    };
    const upload = body => productsHandler(new Request('https://example.test/api/admin/products?action=upload', { method:'POST', headers:{authorization:'Bearer valid','Content-Type':'application/json'}, body:JSON.stringify(body) }));
    try {
        for (const body of [{type:'image/jpeg', content:'AAAA', compress:false}, {type:'image/webp',content:'invalid'}, {type:'image/webp',content:'A'.repeat(133336)}]) assert.equal((await upload(body)).status,400);
        assert.equal(uploaded.length,0);
        const bytes = new Uint8Array(24);
        bytes.set(new TextEncoder().encode('RIFF'),0);
        new DataView(bytes.buffer).setUint32(4,16,true);
        bytes.set(new TextEncoder().encode('WEBPVP8 '),8);
        const response = await upload({type:'image/webp',content:Buffer.from(bytes).toString('base64')});
        assert.equal(response.status,201);
        assert.match(uploaded[0].path,/^admin\/.*\.webp$/);
        assert.deepEqual(uploaded[0].options,{contentType:'image/webp',upsert:false});
    } finally { supabaseAdmin.auth.getUser = originalAuth; supabaseAdmin.storage.from = originalFrom; }
});

test('product validation prevents mass assignment and derives legacy stock fields', () => {
    const result = productPayload({ name:'Shirt', price:150, stock_by_size:{ S:0, M:3 }, id:'forged', created_at:'forged', in_stock:false }, true);
    assert.deepEqual(result, { name:'Shirt',price:150,stock_by_size:{ S:0,M:3 },in_stock:true,sizes:['S','M'] });
    assert.equal(productPayload({ stock_by_size:{ S:0 } }).in_stock,false);
    for (const body of [{ price:-1 },{ price:NaN },{ price:'12' },{ stock_by_size:{ M:-1 } },{ stock_by_size:{ M:1.5 } },{ stock_by_size:[] },{ images:['javascript:alert(1)'] },null]) assert.throws(() => productPayload(body));
});

test('paging continues when database row limit is lower than requested size', async () => {
    const records = Array.from({ length:7 },(_,i) => ({ id:i }));
    const offsets = [];
    const rows = await allRows(() => ({ async range(from) { offsets.push(from); return { data:records.slice(from,from+2) }; } }));
    assert.deepEqual(rows,records);
    assert.deepEqual(offsets,[0,2,4,6,7]);
});

test('metrics use numeric saved totals, exclude cancellations and respect Cairo calendar boundaries', () => {
    const orders = [
        { id:1,total:'100',status:'pending',created_at:'2026-11-05T22:30:00Z' },
        { id:2,total:'200',status:'delivered',created_at:'2026-11-06T10:00:00Z' },
        { id:3,total:'900',status:'cancelled',created_at:'2026-11-06T10:00:00Z' },
        { id:4,total:'500',status:'delivered',created_at:'2026-10-01T10:00:00Z' },
    ];
    const stats = dashboardStats(orders,1,new Date('2026-11-06T15:00:00Z'));
    assert.equal(stats.placed,3);
    assert.equal(stats.sales,300);
    assert.equal(stats.delivered,200);
    assert.equal(stats.active,1);
    assert.equal(stats.series[0].total,300);
    assert.equal(cairoDay('2026-07-01T21:30:00Z'),'2026-07-02');
    assert.equal(storedStatus('placed'),'pending');
    assert.equal(storedStatus('processing'),'confirmed');
    assert.equal(storedStatus('refunded'),undefined);
    assert.equal(storedStatus('__proto__'),undefined);
    assert.equal(storedStatus('constructor'),undefined);
});

test('customer histories normalize email, preserve all orders and omit cancelled order value', () => {
    const rows = customerHistory([
        { id:1,email:' PERSON@example.test ',customer_name:'Person',total:'100',status:'delivered' },
        { id:2,email:'person@example.test',total:'200',status:'cancelled' },
        { id:3,phone:'012 345',total:20 },{ id:4,phone:'012345',total:30 },
        { id:5,total:10 },{ id:6,total:10 },
    ]);
    assert.equal(rows.length,4);
    assert.equal(rows[0].orders.length,2);
    assert.equal(rows[0].total,100);
    assert.equal(rows[1].total,50);
    assert.equal(stockTotal({ stock_by_size:{ M:'4',L:2 } }),6);
});

test('stock updates use compare-and-swap and reject stale data without updating saved state', async () => {
    const originalAuth = supabaseAdmin.auth.getUser, originalFrom = supabaseAdmin.from;
    const filters = [];
    supabaseAdmin.auth.getUser = async () => ({ data:{ user:{ email:OWNER_EMAIL } } });
    supabaseAdmin.from = () => ({ update(payload) {
        assert.deepEqual(payload.stock_by_size,{ M:5 });
        return { eq(key,value) { filters.push([key,value]); return this; }, select() { return this; }, async maybeSingle() { return { data:null }; } };
    } });
    try {
        const res = await productsHandler(new Request('https://example.test/api/admin/products?id=shirt', { method:'PUT',headers:{ authorization:'Bearer valid','Content-Type':'application/json' },body:JSON.stringify({ stock_by_size:{ M:5 }, expectedStock:{ M:9 } }) }));
        assert.equal(res.status,409);
        assert.deepEqual(filters,[['id','shirt'],['stock_by_size','{"M":9}']]);
    } finally { supabaseAdmin.auth.getUser = originalAuth; supabaseAdmin.from = originalFrom; }
});

test('products referenced by historical orders cannot be deleted', async () => {
    const originalAuth = supabaseAdmin.auth.getUser, originalFrom = supabaseAdmin.from;
    let deleted = false;
    supabaseAdmin.auth.getUser = async () => ({ data:{ user:{ email:OWNER_EMAIL } } });
    supabaseAdmin.from = table => {
        if (table === 'products') return { delete() { deleted = true; throw new Error('Must not delete'); } };
        return { select() { return this; }, async eq() { return { count:1 }; } };
    };
    try {
        const res = await productsHandler(new Request('https://example.test/api/admin/products?id=shirt', { method:'DELETE',headers:{ authorization:'Bearer valid' } }));
        assert.equal(res.status,409);
        assert.equal(deleted,false);
    } finally { supabaseAdmin.auth.getUser = originalAuth; supabaseAdmin.from = originalFrom; }
});
