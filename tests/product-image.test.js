import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

test('real browser compresses detailed images, preserves orientation, and rejects failures', { timeout: 30000 }, async () => {
    const source = await readFile(new URL('../src/utils/compressProductImage.js', import.meta.url), 'utf8');
    const browser = await chromium.launch({ channel: 'chrome', headless: true });
    try {
        const page = await browser.newPage();
        const result = await page.evaluate(async source => {
            const { compressProductImage } = await import(`data:text/javascript,${encodeURIComponent(source)}`);
            const canvas = document.createElement('canvas');
            canvas.width = 1800; canvas.height = 1200;
            const context = canvas.getContext('2d');
            const data = context.createImageData(canvas.width, canvas.height);
            let seed = 123;
            for (let i = 0; i < data.data.length; i += 4) {
                seed = (seed * 1664525 + 1013904223) >>> 0;
                data.data[i] = seed & 255; data.data[i + 1] = (seed >>> 8) & 255;
                data.data[i + 2] = (seed >>> 16) & 255; data.data[i + 3] = 255;
            }
            context.putImageData(data, 0, 0);
            const original = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const compressed = await compressProductImage(new File([original], 'noise.png', { type: original.type }));
            const decoded = await createImageBitmap(compressed);
            const metrics = { type: compressed.type, size: compressed.size, width: decoded.width, height: decoded.height, originalSize: original.size };
            decoded.close();
            // Inject an EXIF orientation=6 (90 degrees clockwise) into a small JPEG.
            canvas.width = 80; canvas.height = 40;
            context.fillStyle = 'red'; context.fillRect(0, 0, 80, 40);
            const jpeg = new Uint8Array(await (await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg'))).arrayBuffer());
            const exif = new Uint8Array([255,225,0,34,69,120,105,102,0,0,73,73,42,0,8,0,0,0,1,0,18,1,3,0,1,0,0,0,6,0,0,0,0,0,0,0]);
            const oriented = await compressProductImage(new File([jpeg.slice(0, 2), exif, jpeg.slice(2)], 'rotated.jpg', { type: 'image/jpeg' }));
            const rotation = await createImageBitmap(oriented);
            metrics.oriented = [rotation.width, rotation.height]; rotation.close();
            try { await compressProductImage(new File(['invalid'], 'bad.jpg', { type: 'image/jpeg' })); }
            catch { metrics.invalidRejected = true; }
            const nativeToBlob = HTMLCanvasElement.prototype.toBlob;
            HTMLCanvasElement.prototype.toBlob = function (callback) { callback(new Blob([new Uint8Array(100001)], { type: 'image/webp' })); };
            try { await compressProductImage(new File([original], 'too-big.png', { type: 'image/png' })); }
            catch { metrics.oversizedRejected = true; }
            HTMLCanvasElement.prototype.toBlob = function (callback) { callback(new Blob(['png'], { type: 'image/png' })); };
            try { await compressProductImage(new File([original], 'unsupported.png', { type: 'image/png' })); }
            catch { metrics.unsupportedRejected = true; }
            HTMLCanvasElement.prototype.toBlob = nativeToBlob;
            return metrics;
        }, source);
        assert.equal(result.type, 'image/webp');
        assert.ok(result.size < 100000);
        assert.ok(result.size >= 70000 && result.size <= 90000);
        assert.ok(result.width <= 1200 && result.height <= 1200);
        assert.ok(Math.abs(result.width / result.height - 1.5) < 0.01);
        assert.ok(result.size < result.originalSize);
        assert.deepEqual(result.oriented, [40, 80]);
        assert.equal(result.invalidRejected, true);
        assert.equal(result.oversizedRejected, true);
        assert.equal(result.unsupportedRejected, true);
    } finally { await browser.close(); }
});
