import { test, expect } from '@playwright/test';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'browser-test-service-key';
const { OWNER_EMAIL } = await import('../../api/_utils/auth.js');

// Browser-only fixtures. Requests are intercepted: no production reads or writes.
const product = { id:'test-shirt',name:'Cotton Oxford Shirt',gender:'men',price:250,oldPrice:300,sku:'TEST-001',images:[],stock_by_size:{ M:3,L:0 },sizes:['M','L'],created_at:'2026-11-01T12:00:00Z',description:'Soft cotton',display_order:0 };
const order = { id:'test-order',order_code:'FL-TEST-01',customer_name:'Test Customer',email:'customer@example.test',phone:'012345',address:'Test address',city:'Cairo',total:500,status:'pending',created_at:new Date().toISOString(),order_items:[{ id:1,product_id:product.id,qty:2,unit_price:250,size:'M',products:{ name:product.name,images:[] } }] };

test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ owner }) => {
        localStorage.setItem('sb-admin-test-auth-token', JSON.stringify({ access_token:'test-access-token',refresh_token:'test-refresh-token',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user:{ id:'11111111-1111-4111-8111-111111111111',email:owner,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{} } }));
    },{ owner:OWNER_EMAIL });
    await page.route('https://admin-test.supabase.co/**', route => route.fulfill({ json:{ user:{ email:OWNER_EMAIL } } }));
    await page.route('**/api/admin/**', async route => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith('/settings')) return route.fulfill({ json:{ admin:OWNER_EMAIL,storeName:'From London',currency:'EGP',payment:'Cash on delivery',emailConfigured:true,retryConfigured:true } });
        if (route.request().method() === 'PUT') return route.fulfill({ json:JSON.parse(route.request().postData()) });
        if (url.pathname.endsWith('/products')) return route.fulfill({ json:url.searchParams.has('id') ? product : [product] });
        return route.fulfill({ json:[order] });
    });
});

test('dashboard shows real-source calculations and chart without horizontal page overflow', async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror',error => errors.push(error.message));
    await page.goto('/admin');
    await expect(page.getByRole('heading',{ name:'Your store, at a glance' })).toBeVisible();
    await expect(page.getByRole('heading',{ name:'Sales overview' })).toBeVisible();
    await expect(page.getByRole('link',{ name:'#FL-TEST-01' })).toBeVisible();
    await expect(page.getByRole('img',{ name:/Daily non-cancelled/ })).toBeVisible();
    await page.getByLabel('Dashboard period').selectOption('7');
    await expect(page.getByRole('img',{ name:/over 7 days/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(testInfo.project.use.viewport.width);
    expect(errors).toEqual([]);
    await page.screenshot({ path:testInfo.outputPath('overview.png'),fullPage:true });
});

test('product uploads optimize in a worker and continue after an invalid image', async ({ page }) => {
    await page.goto('/admin/products/new');
    const png = await page.evaluate(async () => {
        const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 1600;
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#297ab3'; ctx.fillRect(0,0,1200,1600);
        return canvas.toDataURL('image/png').split(',')[1];
    });
    const uploads = [];
    await page.route('**/api/admin/products?action=upload', async route => {
        const body = route.request().postDataJSON();
        expect(body.type).toBe('image/webp');
        expect(Buffer.from(body.content,'base64').length).toBeLessThan(100000);
        uploads.push(body);
        await route.fulfill({json:{url:`data:image/webp;base64,${body.content}`}});
    });
    await page.locator('input[type=file]').setInputFiles([
        {name:'first.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')},
        {name:'invalid.jpg',mimeType:'image/jpeg',buffer:Buffer.from('invalid')},
        {name:'second.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')},
    ]);
    await expect(page.getByRole('alert')).toContainText('invalid.jpg');
    expect(uploads).toHaveLength(2);
    await expect(page.getByText('2/30 images')).toBeVisible();
    await expect(page.getByText(/first.png:.*KB to/)).toBeVisible();
    const images = page.getByAltText(/Product image \d/);
    await expect(images).toHaveCount(2);
    for (const image of await images.all()) expect(await image.evaluate(img => img.complete && img.naturalWidth === 750 && img.naturalHeight === 1000)).toBe(true);
    const imageUrl = `data:image/webp;base64,${uploads[0].content}`;
    await page.route('https://admin-test.supabase.co/rest/v1/products**', route => route.fulfill({json:[{...product, images:[imageUrl]}]}));
    await page.goto('/shop');
    await expect(page.locator(`a[href="/product/${product.id}"] img`).first()).toHaveJSProperty('naturalWidth',750);
    await page.goto(`/product/${product.id}`);
    await expect(page.getByRole('heading',{name:product.name})).toBeVisible();
    await expect(page.getByAltText(`${product.name} - View 1`)).toHaveJSProperty('naturalWidth',750);
});

test('product search, pricing selection and product editor retain saved fields', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page.getByText('Cotton Oxford Shirt')).toBeVisible();
    await page.getByLabel('Search products').fill('missing');
    await expect(page.getByRole('heading',{ name:'No matching products' })).toBeVisible();
    await page.getByLabel('Search products').fill('Oxford');
    await page.getByLabel('Select Cotton Oxford Shirt',{ exact:true }).check();
    await page.getByLabel('Bulk price in EGP').fill('275');
    await page.getByRole('button',{ name:'Set price',exact:true }).click();
    await expect(page.getByRole('dialog',{ name:'Update selected prices?' })).toBeVisible();
    await page.getByRole('button',{ name:'Cancel',exact:true }).click();
    await page.getByLabel('Edit Cotton Oxford Shirt').click();
    await expect(page.getByLabel('Product name')).toHaveValue('Cotton Oxford Shirt');
    await expect(page.getByLabel('Stock for M',{ exact:true })).toHaveValue('3');
    await expect(page.getByLabel('Selling price (EGP)')).toHaveValue('250');
});

test('order detail uses saved unit prices and confirms status changes', async ({ page }) => {
    await page.goto('/admin/orders');
    await page.getByRole('button',{ name:'View order',exact:true }).click();
    await expect(page.getByRole('dialog',{ name:'Order #FL-TEST-01' })).toBeVisible();
    await expect(page.getByText('Test address',{ exact:false })).toBeVisible();
    await expect(page.getByRole('button',{ name:'Print order' })).toBeVisible();
    await page.getByLabel('Update order status').selectOption('processing');
    await expect(page.getByRole('dialog',{ name:'Update order status?' })).toBeVisible();
    const request = page.waitForRequest(req => req.method() === 'PUT' && req.url().includes('/api/admin/orders'));
    await page.getByRole('button',{ name:'Confirm',exact:true }).click();
    expect((await request).postDataJSON()).toEqual({ status:'processing',expectedStatus:'pending' });
});

test('inventory edits include stock snapshot and customer history links to orders', async ({ page }) => {
    await page.goto('/admin/inventory');
    await page.getByRole('button',{ name:'Quick update' }).click();
    await page.getByLabel('Quantity for M').fill('');
    await page.getByLabel('Quantity for M').pressSequentially('18');
    await expect(page.getByLabel('Quantity for M')).toBeFocused();
    await expect(page.getByLabel('Quantity for M')).toHaveValue('18');
    const request = page.waitForRequest(req => req.method() === 'PUT' && req.url().includes('/api/admin/products'));
    await page.getByRole('button',{ name:'Save inventory' }).click();
    expect((await request).postDataJSON()).toEqual({ stock_by_size:{ M:18,L:0 },expectedStock:{ M:3,L:0 } });
    await page.goto('/admin/customers');
    await page.getByRole('button',{ name:'View history' }).click();
    await expect(page.getByRole('link',{ name:'#FL-TEST-01' })).toBeVisible();
});

test('settings persist inventory preference and mobile navigation works', async ({ page }, testInfo) => {
    await page.goto('/admin/settings');
    await page.getByLabel('Low-stock threshold per size').fill('9');
    await page.getByRole('button',{ name:'Save preference' }).click();
    await expect(page.getByRole('status')).toContainText('saved for this browser');
    expect(await page.evaluate(() => localStorage.getItem('admin-low-stock'))).toBe('9');
    if (testInfo.project.name === 'mobile') {
        await page.getByLabel('Open navigation').click();
        await page.getByRole('link',{ name:'Products',exact:true }).click();
        await expect(page.getByRole('heading',{ name:'Products',exact:true })).toBeVisible();
        await expect(page.getByLabel('Open navigation')).toBeVisible();
    }
});
