import { test, expect } from '@playwright/test';

for (const [gender, title] of [['women', "Women's pyjama size guide"], ['men', "Men's pyjama size guide"], ['kids', 'Kids size guide'], ['baby', 'Babies size guide'], ['lingerie', 'Lingerie size guide']]) {
    test(`${gender} opens its own size guide directly`, async ({ page }, testInfo) => {
        const product = { id: 'size-guide-test', name: 'Pyjama set', gender, price: 500, images: [], stock_by_size: { XS: 2, S: 3, M: 2, L: 2, XL: 2, '2XL': 1 } };
        await page.route('https://admin-test.supabase.co/rest/v1/products**', route => route.fulfill({ json: product }));
        await page.goto(`/product/${product.id}`);
        const trigger = page.getByRole('button', { name: 'Size chart' });
        await trigger.click();
        const dialog = page.getByRole('dialog', { name: title });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('combobox')).toHaveCount(0);
        await expect(dialog.getByRole('link', { name: /reference/i })).toHaveCount(0);
        if (gender === 'women' || gender === 'men' || gender === 'lingerie') {
            await expect(dialog.getByRole('rowheader')).toHaveText(['XS', 'S', 'M', 'L', 'XL', '2XL']);
        }
        if (gender === 'women' || gender === 'men') {
            await expect(dialog.getByRole('columnheader', { name: gender === 'women' ? 'Bust (cm)' : 'Chest (cm)' })).toBeVisible();
            await dialog.getByRole('button', { name: 'in', exact: true }).click();
            await expect(dialog.getByRole('columnheader', { name: gender === 'women' ? 'Bust (in)' : 'Chest (in)' })).toBeVisible();
            for (const img of await dialog.getByRole('img').all()) await expect(img).toHaveJSProperty('naturalWidth', 600);
        }
        const dimensions = await dialog.evaluate(el => ({ width: el.getBoundingClientRect().width, viewport: window.innerWidth }));
        expect(dimensions.width).toBeLessThanOrEqual(dimensions.viewport);
        await page.screenshot({ path: testInfo.outputPath(`${gender}-guide.png`) });
        await page.keyboard.press('Escape');
        await expect(dialog).not.toBeVisible();
        await expect(trigger).toBeFocused();
    });
}
