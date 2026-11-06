export const money = value => new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(Number(value) || 0);
export const orderNumber = order => order.order_code || order.order_no || order.id;
export const statusKey = value => value === 'pending' ? 'placed' : value === 'confirmed' ? 'processing' : value || 'placed';
export const statuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
export const stockTotal = product => Object.values(product.stock_by_size || {}).reduce((sum, n) => sum + (Number(n) || 0), 0);
export const date = value => value ? new Date(value).toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'short', year: 'numeric' }) : 'Not recorded';
export function cairoDay(value) {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
    const get = type => parts.find(p => p.type === type).value;
    return `${get('year')}-${get('month')}-${get('day')}`;
}
export function customerHistory(orders) {
    const customers = new Map();
    for (const order of orders) {
        const key = order.email?.trim().toLowerCase() || order.phone?.replace(/\D/g, '') || `order:${order.id}`;
        if (!customers.has(key)) customers.set(key, { key, name: order.customer_name || 'Guest', email: order.email, phone: order.phone, orders: [], total: 0 });
        const customer = customers.get(key);
        customer.orders.push(order);
        if (statusKey(order.status) !== 'cancelled') customer.total += Number(order.total) || 0;
    }
    return [...customers.values()].sort((a, b) => b.total - a.total);
}
export function dashboardStats(orders, days = 30, now = new Date()) {
    const dayKey = cairoDay;
    const anchor = new Date(`${dayKey(now)}T12:00:00Z`);
    const series = Array.from({ length: days }, (_, i) => { const d = new Date(anchor); d.setUTCDate(d.getUTCDate() - days + 1 + i); return { day: dayKey(d), label: d.toLocaleDateString('en-GB', { timeZone: 'Africa/Cairo', day: 'numeric', month: 'short' }), total: 0, count: 0 }; });
    const byDay = new Map(series.map(s => [s.day, s]));
    let placed = 0, sales = 0, delivered = 0, active = 0;
    for (const order of orders) {
        if (!order.created_at || !Number.isFinite(new Date(order.created_at).getTime())) continue;
        const bucket = byDay.get(dayKey(new Date(order.created_at)));
        if (!bucket) continue;
        placed++;
        const status = statusKey(order.status);
        if (status !== 'cancelled') { const total = Number(order.total) || 0; sales += total; bucket.total += total; bucket.count++; }
        if (status === 'delivered') delivered += Number(order.total) || 0;
        if (['placed', 'processing'].includes(status)) active++;
    }
    return { placed, sales, delivered, active, series };
}
