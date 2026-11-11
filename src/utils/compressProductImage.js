// Decimal KB keeps every upload below both 100 KB and 100 KiB limits.
export const MAX_PRODUCT_IMAGE_BYTES = 100_000;
const TARGET_BYTES = 90_000;

export async function compressProductImage(file) {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file?.type)) {
        throw new Error('Choose a JPEG, PNG, WebP or GIF image.');
    }
    let image;
    try {
        // Apply EXIF orientation before measuring or drawing the image.
        image = await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
        throw new Error(`Cannot read ${file.name || 'image'}. Choose a valid image.`);
    }
    const canvas = document.createElement('canvas');
    try {
        const context = canvas.getContext('2d');
        if (!context || !image.width || !image.height) throw new Error('Image processing is unavailable.');
        const encode = quality => new Promise((resolve, reject) => {
            canvas.toBlob(blob => {
                if (!blob || blob.type !== 'image/webp' || !blob.size) reject(new Error('WebP compression is unavailable in this browser. Please use a browser that supports WebP encoding.'));
                else resolve(blob);
            }, 'image/webp', quality);
        });
        let dimension = Math.min(1200, Math.max(image.width, image.height));
        let fallback;
        while (dimension >= 64) {
            const scale = dimension / Math.max(image.width, image.height);
            canvas.width = Math.max(1, Math.round(image.width * scale));
            canvas.height = Math.max(1, Math.round(image.height * scale));
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            let best = await encode(0.75);
            if (best.size < MAX_PRODUCT_IMAGE_BYTES && !fallback) fallback = best;
            if (best.size <= TARGET_BYTES) return best;
            // Find the highest quality near 70–90 KB before reducing dimensions.
            const lowQuality = await encode(0.4);
            if (lowQuality.size < MAX_PRODUCT_IMAGE_BYTES && !fallback) fallback = lowQuality;
            if (lowQuality.size <= TARGET_BYTES) {
                best = lowQuality;
                let low = 0.4, high = 0.75;
                for (let attempt = 0; attempt < 6; attempt++) {
                    const quality = (low + high) / 2;
                    const candidate = await encode(quality);
                    if (candidate.size <= TARGET_BYTES) { best = candidate; low = quality; }
                    else high = quality;
                }
                return best;
            }
            // Always resample from the original decoded image, never a prior resize.
            dimension = Math.floor(dimension * 0.85);
        }
        // Tiny source images need no upscaling or artificial padding to reach 70 KB.
        if (Math.max(image.width, image.height) < 64) {
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);
            const blob = await encode(0.75);
            if (blob.size < MAX_PRODUCT_IMAGE_BYTES) return blob;
        }
        if (fallback) return fallback;
        throw new Error(`Cannot compress ${file.name || 'image'} below 100 KB. Choose another image.`);
    } finally {
        image.close();
        canvas.width = canvas.height = 0;
    }
}
