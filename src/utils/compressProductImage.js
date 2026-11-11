// Decimal KB; the API independently enforces this boundary.
export const MAX_PRODUCT_IMAGE_BYTES = 100_000;
const PREFERRED_BYTES = 80_000;
const MIN_QUALITY = 0.72;
const MAX_QUALITY = 0.85;

export async function compressProductImage(file) {
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file?.type)) throw new Error('Choose a JPEG, PNG, WebP or GIF image.');
    if (file.size > 30_000_000) throw new Error('Choose an image smaller than 30 MB.');
    let image;
    try { image = await createImageBitmap(file, { imageOrientation: 'from-image', colorSpaceConversion: 'default' }); }
    catch { throw new Error(`Cannot read ${file.name || 'image'}. Choose a valid image.`); }
    let canvas;
    try {
        if (!image.width || !image.height || image.width * image.height > 60_000_000) throw new Error('Image dimensions are too large. Choose an image under 60 megapixels.');
        canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(1, 1) : document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Image processing is unavailable in this browser.');
        const encode = async quality => {
            const blob = canvas.convertToBlob
                ? await canvas.convertToBlob({ type: 'image/webp', quality })
                : await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
            if (!blob || blob.type !== 'image/webp' || !blob.size) throw new Error('WebP encoding is unavailable. Please use a current browser.');
            return blob;
        };
        // Fit the entire image inside 750 x 1000. Never crop or upscale.
        const scale = Math.min(1, 750 / image.width, 1000 / image.height);
        for (const reduction of [1, 0.9, 0.8]) {
            canvas.width = Math.max(1, Math.round(image.width * scale * reduction));
            canvas.height = Math.max(1, Math.round(image.height * scale * reduction));
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = 'high';
            // Resample from the decoded source each time; canvas encoding drops EXIF metadata.
            // Avoid blanket sharpening, which can create halos around fabric patterns.
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            const high = await encode(MAX_QUALITY);
            if (high.size <= PREFERRED_BYTES) return high;
            const low = await encode(MIN_QUALITY);
            const budget = low.size <= PREFERRED_BYTES ? PREFERRED_BYTES : MAX_PRODUCT_IMAGE_BYTES - 1;
            if (low.size > budget) continue;
            if (high.size <= budget) return high;
            let best = low, lower = MIN_QUALITY, upper = MAX_QUALITY;
            for (let attempt = 0; attempt < 6; attempt++) {
                const quality = (lower + upper) / 2;
                const candidate = await encode(quality);
                if (candidate.size <= budget) { best = candidate; lower = quality; }
                else upper = quality;
            }
            return best;
        }
        throw new Error(`Cannot optimize ${file.name || 'image'} below 100 KB without losing too much detail. Choose a cleaner source image. Nothing was uploaded.`);
    } finally {
        image.close();
        if (canvas) canvas.width = canvas.height = 0;
    }
}
