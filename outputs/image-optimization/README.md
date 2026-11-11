# Product image optimization verification

Implemented for the existing React/Vite application and Edge API. No framework migration or new image-processing dependency.

## Settings

- WebP at 85% quality initially; binary search to 72% minimum when needed.
- Prefer at most 80,000 bytes; allow up to 99,999 bytes to preserve detail before reducing resolution.
- Fit the complete source inside 750 × 1000, preserving aspect ratio and EXIF orientation, with no upscaling or cropping.
- If necessary, try 90% then 80% of the fitted dimensions, always sampling from the original decoded source.
- Refuse images that cannot meet the limit within these quality/resolution bounds. Never fall back to uploading an original.
- Canvas encoding strips original metadata. Browser color conversion uses its default color-management behavior. No saturation changes or blanket sharpening; the inspected samples did not warrant sharpening artifacts around printed details.
- Input guard: 30 MB and 60 megapixels. GIF input becomes a still frame, as disclosed in the uploader.
- A module worker handles processing with OffscreenCanvas. Browsers without worker/canvas support use the same utility on the main thread with asynchronous encoding. Worker processing times out after 60 seconds.

## Real catalog measurements

| Source | Original bytes | Optimized bytes | Original resolution | Output resolution |
| --- | ---: | ---: | --- | --- |
| Textured fleece | 163,637 | 30,574 | 1200 × 1600 | 750 × 1000 |
| Monsters printed pajamas | 56,676 | 55,838 | 750 × 1000 | 750 × 1000 |
| Dragon Ball printed pajamas | 1,331,696 | 33,262 | 6000 × 8000 | 750 × 1000 |

The comparison PNGs in this directory show originals on the left and optimized output on the right at 480 CSS pixels wide. Inspected all three for normal-display appearance, printed details, and color consistency. These checks do not guarantee identical appearance for every future source or browser encoder.

## Validation

- Production build passed, including the bundled worker.
- 37 Node tests passed, including real Chrome image encoding, orientation, tiny sources, invalid images, oversized output, unsupported encoding, and API authorization/validation.
- All 12 desktop/mobile Playwright tests passed. The upload test checks worker integration, multiple files, continuing after an invalid image, size feedback, decoded resolution, storefront cards, and product galleries. Browser application/API data is intercepted for isolation.
- Changed JavaScript files passed targeted ESLint; ProductForm also passed.
- Live Supabase bucket inspection confirmed a public `product-images` bucket. No bucket-specific MIME or size limits were configured; strict WebP/size validation remains in the authenticated API. Existing service-role writes stay server-side behind owner authorization.
- One optimized 55,838-byte image was uploaded using the server storage credentials and fetched from its public URL. Returned bytes matched exactly and Content-Type was image/webp. See storage-result.json. This verifies live storage independently of the mocked browser/API tests; a live authenticated dashboard session was not available.
- No existing images or product database records were changed. The new verification object remains at the URL recorded in storage-result.json.

## Changed application files

- src/utils/compressProductImage.js: shared encoding, quality search, dimension and input bounds.
- src/utils/optimizeProductImage.js and src/utils/productImage.worker.js: worker lifecycle and error handling.
- src/services/adminService.js: mandatory optimization before network upload and size statistics.
- src/pages/admin/ProductForm.jsx: automatic processing, batch progress, failure reporting, and size feedback. Removed the original-upload toggle in accordance with the mandatory optimization requirement.
- api/admin/products.js: independent WebP MIME/header/container-length and byte-limit checks; existing bucket, URL generation, and owner authorization retained.

Tests updated: tests/product-image.test.js, tests/admin.test.js, tests/browser/admin.spec.js. Opt-in scripts added: tests/verify-product-images.mjs (downloads public photos and saves comparisons), tests/verify-storage-upload.mjs (creates one new optimized storage object per run; requires server environment variables).

Checkout, storefront rendering, existing image records, and schema were not modified. No deployment was performed.
