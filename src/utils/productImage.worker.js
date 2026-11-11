import { compressProductImage } from './compressProductImage';
self.onmessage = async ({ data: file }) => {
    try { self.postMessage({ blob: await compressProductImage(file) }); }
    catch (error) { self.postMessage({ error: error.message }); }
};
