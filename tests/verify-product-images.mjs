import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
const out = 'outputs/image-optimization';
await mkdir(out, { recursive:true });
const source = await readFile('src/utils/compressProductImage.js', 'utf8');
const browser = await chromium.launch({ channel:'chrome', headless:true });
const results = [];
try {
    const page = await browser.newPage({ viewport:{ width:1100, height:1100 } });
    for (const name of ['brownWomen1.png.jpeg', 'monster1.png', 'dragballz.png']) {
        const response = await fetch(`https://shewbtfkjoupjqijcihu.supabase.co/storage/v1/object/public/product-images/${name}`);
        if (!response.ok) throw new Error(`Download failed: ${response.status}`);
        const original = Buffer.from(await response.arrayBuffer());
        const type = response.headers.get('content-type');
        const result = await page.evaluate(async ({source,base64,type,name}) => {
            const {compressProductImage} = await import(`data:text/javascript,${encodeURIComponent(source)}`);
            const file = new File([Uint8Array.from(atob(base64), c => c.charCodeAt(0))], name, {type});
            const blob = await compressProductImage(file);
            const input = await createImageBitmap(file), output = await createImageBitmap(blob);
            const bytes = new Uint8Array(await blob.arrayBuffer());
            const optimized = btoa(Array.from(bytes, c=>String.fromCharCode(c)).join(''));
            const metrics = {name,originalBytes:file.size,optimizedBytes:blob.size,originalDimensions:[input.width,input.height],optimizedDimensions:[output.width,output.height]};
            input.close(); output.close();
            document.body.innerHTML = `<h2>${name}: original (left), optimized (right)</h2><p>${file.size} bytes to ${blob.size} bytes</p><div style="display:flex;gap:20px"><img style="width:480px;object-fit:contain" src="data:${type};base64,${base64}"><img style="width:480px;object-fit:contain" src="data:image/webp;base64,${optimized}"></div>`;
            await Promise.all([...document.images].map(image=>image.decode()));
            return {metrics,optimized};
        }, {source,base64:original.toString('base64'),type,name});
        await writeFile(`${out}/${name}.webp`, Buffer.from(result.optimized,'base64'));
        await page.screenshot({path:`${out}/${name}-comparison.png`,fullPage:true});
        results.push(result.metrics);
    }
    await writeFile(`${out}/results.json`, JSON.stringify(results,null,2));
    console.log(JSON.stringify(results,null,2));
} finally { await browser.close(); }
