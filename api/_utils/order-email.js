export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = value => `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))} EGP`;

export function buildOrderEmail(snapshot, kind) {
    const o = snapshot.order;
    const admin = kind === 'admin';
    const number = o.order_code ?? o.order_no ?? o.id;
    const title = admin ? 'A new order just arrived' : 'Thank you for your order';
    const details = [
        ['Order number', number], ['Order status', o.status || 'pending'],
        ['Customer', o.customer_name || o.name || 'Customer'],
        ...(admin ? [['Email', o.email || 'Not provided'], ['Phone', o.phone || 'Not provided']] : []),
        ['Delivery address', [o.address, o.city].filter(Boolean).join(', ') || 'Not provided'],
        ['Payment method', o.payment_method || 'Cash on delivery'],
        ['Payment status', o.payment_status || 'Awaiting cash on delivery'],
        ['Order date', o.created_at ? new Date(o.created_at).toLocaleString('en-GB', { timeZone: 'Africa/Cairo', dateStyle: 'medium', timeStyle: 'short' }) + ' (Cairo)' : 'Not recorded'],
        ...(admin && o.notes ? [['Order notes', o.notes]] : []),
    ];
    const items = snapshot.items.map(i => {
        const qty = Number(i.quantity ?? i.qty);
        const price = i.unit_price ?? i.price;
        if (!Number.isInteger(qty) || qty < 1 || price == null || !Number.isFinite(Number(price))) throw new Error('Invalid saved item pricing');
        return { name: i.product_name || i.name || `Product ${i.product_id}`, size: i.size, qty, price: money(price), total: money(Number(price) * qty) };
    });
    if (!items.length || o.total == null || !Number.isFinite(Number(o.total))) throw new Error('Incomplete saved order');
    const text = `From London\n${title}\n${details.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\n${items.map(i => `${i.name}${i.size ? ` (${i.size})` : ''} x ${i.qty} - ${i.price} each - ${i.total}`).join('\n')}\n\nOrder total: ${money(o.total)}\nDelivery fees of 80–100 EGP are payable on delivery, based on location.\nThank you for shopping with From London.`;
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;color:#111827"><div style="display:none;max-height:0;overflow:hidden">${escapeHtml(title)} · Order #${escapeHtml(number)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden">
<tr><td style="padding:28px 24px;background:#0070c9;color:#fff;font-size:25px;font-weight:800;letter-spacing:3px">FROM LONDON</td></tr>
<tr><td style="padding:28px 24px"><p style="color:#009999;text-transform:uppercase;font-size:12px;letter-spacing:2px">${admin ? 'Store notification' : 'Order received'}</p><h1 style="font-size:27px;line-height:1.25;margin:12px 0">${title}</h1><p style="color:#4b5563;line-height:1.7">${admin ? 'A new order has been saved. Here are the details for fulfilment.' : `Hi ${escapeHtml(o.customer_name || o.name || 'there')}, we have received your order and will contact you about delivery.`}</p>
<table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;line-height:1.6">${details.map(([k,v]) => `<tr><th scope="row" align="left" valign="top" style="padding:7px 8px 7px 0;width:38%;color:#6b7280;font-weight:400">${escapeHtml(k)}</th><td style="padding:7px 0;word-break:break-word">${escapeHtml(v)}</td></tr>`).join('')}</table>
<h2 style="font-size:17px;margin-top:28px">Your order</h2><table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse"><thead><tr style="background:#f3f4f6"><th align="left" style="padding:12px 8px">Product / unit price</th><th style="padding:12px 4px">Qty</th><th align="right" style="padding:12px 8px">Amount</th></tr></thead><tbody>${items.map(i => `<tr><td style="padding:15px 8px;border-bottom:1px solid #eee;word-break:break-word"><strong>${escapeHtml(i.name)}</strong><br><span style="color:#6b7280">${i.size ? `Size ${escapeHtml(i.size)} · ` : ''}${escapeHtml(i.price)}</span></td><td align="center" style="padding:15px 4px;border-bottom:1px solid #eee">${i.qty}</td><td align="right" style="padding:15px 8px;border-bottom:1px solid #eee">${escapeHtml(i.total)}</td></tr>`).join('')}</tbody></table>
<p style="font-size:20px;font-weight:700;text-align:right;color:#0070c9">Order total: ${escapeHtml(money(o.total))}</p><p style="font-size:12px;color:#6b7280;line-height:1.7">Delivery fees of 80–100 EGP are payable on delivery, based on location.</p></td></tr>
<tr><td style="padding:24px;background:#f9fafb;text-align:center;font-size:12px;color:#6b7280;line-height:1.7">FROM LONDON<br>Fashion for everyone.<br>Thank you for shopping with us.</td></tr></table></td></tr></table></body></html>`;
    return { subject: `${admin ? 'New order' : 'Your From London order'} #${number}`.replace(/[\r\n]/g, ' '), html, text };
}
