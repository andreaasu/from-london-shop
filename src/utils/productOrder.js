// Null positions follow explicitly ordered products. Ties stay deterministic.
export function compareProductOrder(a, b) {
    const position = p => p.display_order == null ? Infinity : Number(p.display_order);
    const difference = position(a) - position(b);
    if (difference && !Number.isNaN(difference)) return difference;
    return String(a.created_at || '').localeCompare(String(b.created_at || '')) || String(a.id).localeCompare(String(b.id));
}

export function ordinal(position) {
    const lastTwo = position % 100;
    const suffix = lastTwo >= 11 && lastTwo <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[position % 10] || 'th');
    return `${position}${suffix}`;
}
