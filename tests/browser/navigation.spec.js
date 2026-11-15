import { test, expect } from '@playwright/test';

test('shop Back restores filters and scroll after the catalogue reloads', async ({ page }, testInfo) => {
    const catalogue = Array.from({ length: 80 }, (_, i) => ({ id: `pyjama-${i}`, name: `Pyjama ${i}`, gender: i === 79 ? 'women' : 'men', price: 100 + i, images: [], stock_by_size: { M: 3, L: 1 }, display_order: i + 1 }));
    await page.route('https://admin-test.supabase.co/rest/v1/products**', async route => {
        const id = new URL(route.request().url()).searchParams.get('id');
        if (id) return route.fulfill({ json: catalogue.find(p => `eq.${p.id}` === id) });
        await new Promise(resolve => setTimeout(resolve, 300));
        return route.fulfill({ json: catalogue });
    });
    await page.goto('/shop?gender=men');
    await expect(page.getByRole('heading', { name: '79 Products', exact: true })).toBeVisible();
    const mobile = testInfo.project.name === 'mobile';
    if (mobile) await page.getByRole('button', { name: 'Filters', exact: true }).click();
    const sidebar = mobile ? page.getByRole('dialog', { name: 'Filters' }) : page.locator('.hidden.md\\:block.w-64');
    await sidebar.locator('label').filter({ hasText: /^M$/ }).click();
    await sidebar.getByLabel('In Stock Only').check();
    if (mobile) await page.getByRole('button', { name: 'Show Results' }).click();
    await page.locator('select:visible').selectOption('price-high-low');
    const target = page.locator('a[href="/product/pyjama-30"]').first();
    await target.scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
    const scroll = await page.evaluate(() => window.scrollY);
    await target.click();
    await expect(page.getByRole('heading', { name: 'Pyjama 30', exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await page.goBack();
    await expect(page.getByRole('heading', { name: '79 Products', exact: true })).toBeVisible();
    await expect(page.locator('select:visible')).toHaveValue('price-high-low');
    await expect.poll(async () => Math.abs(await page.evaluate(() => window.scrollY) - scroll)).toBeLessThan(10);
    if (mobile) await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await expect(sidebar.getByLabel('M', { exact: true })).toBeChecked();
    await expect(sidebar.getByLabel('In Stock Only')).toBeChecked();
});
