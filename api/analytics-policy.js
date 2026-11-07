// Clarity's explicitly enforced opt-in regions must never be overridden.
const OPT_IN_COUNTRIES = new Set('AT BE BG HR CY CZ DK EE FI FR DE GR HU IS IE IT LI LV LT LU MT NL NO PL PT RO SK SI ES SE GB CH AX GF GP MQ RE YT MF'.split(' '));

export function requiresAnalyticsConsent(country, approvedCountries = '') {
    if (!/^[A-Z]{2}$/.test(country || '') || OPT_IN_COUNTRIES.has(country)) return true;
    const approved = approvedCountries.toUpperCase().split(',').map(value => value.trim());
    return !approved.includes(country);
}

export default function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    // Use Vercel's edge-provided country, never browser language or timezone.
    // Do not return/store the IP, country, or any other visitor data.
    const country = process.env.VERCEL === '1' ? req.headers['x-vercel-ip-country'] : undefined;
    return res.status(200).json({
        requiresConsent: requiresAnalyticsConsent(country, process.env.ANALYTICS_OPT_OUT_COUNTRIES),
    });
}
