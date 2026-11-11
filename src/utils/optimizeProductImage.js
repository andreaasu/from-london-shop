import { compressProductImage } from './compressProductImage';

export function optimizeProductImage(file) {
    if (typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined') return compressProductImage(file);
    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL('./productImage.worker.js', import.meta.url), { type: 'module' });
        const timer = setTimeout(() => { worker.terminate(); reject(new Error('Image optimization timed out. Try a smaller source image.')); }, 60000);
        const finish = () => { clearTimeout(timer); worker.terminate(); };
        worker.onmessage = ({ data }) => { finish(); if (data.error) reject(new Error(data.error)); else resolve(data.blob); };
        worker.onerror = () => { finish(); reject(new Error('Image optimization failed. Please retry in a current browser. Nothing was uploaded.')); };
        worker.postMessage(file);
    });
}
