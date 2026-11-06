export const fail = (message, status = 400) => Object.assign(new Error(message), { status });
export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
export function errorResponse(error) {
    console.error('admin_request_failed', { code: error.code, status: error.status });
    return json({ error: error.status ? error.message : 'Unable to complete this request. Please refresh and try again.' }, error.status || 500);
}

// Explicit paging avoids silently truncating statistics at Supabase's row limit.
export async function allRows(query) {
    const rows = [];
    for (let offset = 0; ; ) {
        const { data, error } = await query().range(offset, offset + 499);
        if (error) throw error;
        if (!data?.length) return rows;
        rows.push(...data);
        offset += data.length;
    }
}

export function productPayload(body, create = false) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('Invalid product data.');
    const allowed = ['name', 'description', 'gender', 'price', 'oldPrice', 'images', 'stock_by_size', 'sku', 'display_order'];
    const result = Object.fromEntries(allowed.filter(key => Object.hasOwn(body, key)).map(key => [key, body[key]]));
    if (create && (!result.name || result.price == null)) throw fail('Name and price are required.');
    if ('name' in result && (typeof result.name !== 'string' || !result.name.trim() || result.name.length > 250)) throw fail('Enter a valid product name.');
    for (const field of ['price', 'oldPrice']) if (field in result && result[field] !== null && (typeof result[field] !== 'number' || !Number.isFinite(result[field]) || result[field] < 0)) throw fail('Prices must be positive numbers or zero.');
    if ('stock_by_size' in result) {
        const stock = result.stock_by_size;
        if (!stock || Array.isArray(stock) || typeof stock !== 'object' || Object.keys(stock).length > 100 || Object.entries(stock).some(([size, qty]) => !size.trim() || size.length > 40 || !Number.isSafeInteger(qty) || qty < 0)) throw fail('Stock must contain sizes and non-negative whole quantities.');
        result.in_stock = Object.values(stock).some(qty => qty > 0);
        result.sizes = Object.keys(stock);
    }
    if ('images' in result && (!Array.isArray(result.images) || result.images.length > 30 || result.images.some(url => typeof url !== 'string' || !/^https:\/\//i.test(url)))) throw fail('Images must be HTTPS URLs.');
    if ('sku' in result && result.sku !== null && typeof result.sku !== 'string') throw fail('Invalid SKU.');
    if ('display_order' in result && !Number.isSafeInteger(result.display_order)) throw fail('Display order must be a whole number.');
    for (const key of ['description', 'gender']) if (key in result && (typeof result[key] !== 'string' || result[key].length > 10000)) throw fail('Invalid product details.');
    if (!Object.keys(result).length) throw fail('No product changes supplied.');
    return result;
}

export function storedStatus(status) {
    const mapping = { placed:'pending', processing:'confirmed', pending:'pending', confirmed:'confirmed', shipped:'shipped', delivered:'delivered', cancelled:'cancelled' };
    return typeof status === 'string' && Object.hasOwn(mapping,status) ? mapping[status] : undefined;
}
