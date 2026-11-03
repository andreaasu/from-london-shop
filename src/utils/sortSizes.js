const clothingOrder = new Map([
    ['XXXS', 0], ['3XS', 0], ['XXS', 1], ['2XS', 1],
    ['XS', 2], ['S', 3], ['M', 4], ['L', 5], ['XL', 6],
    ['XXL', 7], ['2XL', 7], ['XXXL', 8], ['3XL', 8],
    ['4XL', 9], ['5XL', 10], ['6XL', 11],
]);

function sizeKey(size) {
    const label = String(size).trim().toUpperCase();
    if (clothingOrder.has(label)) return [0, clothingOrder.get(label)];

    // Compare children's age ranges in months, even across M/Y units.
    const age = label.match(/^(\d+(?:\.\d+)?)(?:\s*-\s*\d+(?:\.\d+)?)?\s*(M|MO|MONTHS?|Y|YR|YEARS?)$/);
    if (age) return [1, Number(age[1]) * (age[2].startsWith('Y') ? 12 : 1)];
    if (/^\d+(?:\.\d+)?$/.test(label)) return [2, Number(label)];
    return [3, 0];
}

// Sort a copy and preserve original labels: they are also stock/cart keys.
export function sortSizes(sizes) {
    return [...sizes].sort((a, b) => {
        const [groupA, valueA] = sizeKey(a);
        const [groupB, valueB] = sizeKey(b);
        return groupA - groupB || valueA - valueB ||
            String(a).localeCompare(String(b), 'en', { numeric: true, sensitivity: 'base' });
    });
}
