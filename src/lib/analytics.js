const CONSENT_KEY = 'from-london-analytics-consent-v1';
const PURCHASE_KEY = 'from-london-tracked-orders-v1';

// Only explicitly approved fields enter analytics. Never pass customer objects,
// form values, router state, query strings, hashes, or document.referrer.
export function ecommerceItems(products) {
    return products.map(product => ({
        item_id: String(product.id),
        price: Number(product.price),
        quantity: Number(product.quantity ?? 1),
    }));
}

export function createAnalytics(win, doc, gaId, clarityId) {
    let consent = null;
    try {
        const saved = JSON.parse(win.localStorage.getItem(CONSENT_KEY));
        if (saved && Date.now() - saved.at < 180 * 86400000) consent = saved.accepted === true;
    } catch { /* Storage may be disabled. Default to no tracking. */ }
    let started = false;
    let clarityStarted = false;
    let clarityStopped = false;
    let lastPage = '';
    const sentPurchases = new Set();
    const listeners = new Set();
    const script = (id, src) => {
        if (doc.getElementById(id)) return;
        const element = doc.createElement('script');
        element.id = id;
        element.async = true;
        element.referrerPolicy = 'no-referrer';
        element.src = src;
        doc.head.appendChild(element);
    };
    const allowed = () => !win.location.pathname.startsWith('/admin');
    const safePath = () => {
        const path = win.location.pathname;
        if (/^\/(shop|bag|checkout|order-confirmation|wishlist|about|contact|returns)?\/?$/.test(path)) return path;
        if (/^\/product\/[a-zA-Z0-9_-]+\/?$/.test(path)) return path;
        return '/other';
    };
    const pageFields = () => ({
        page_location: win.location.origin + safePath(),
        page_referrer: '',
        page_title: 'From London',
    });
    const start = () => {
        if (consent !== true || !allowed()) return;
        if (gaId && !started) {
            started = true;
            win.dataLayer = win.dataLayer || [];
            win.gtag = function () { win.dataLayer.push(arguments); };
            win.gtag('consent', 'default', {
                analytics_storage: 'granted', ad_storage: 'denied',
                ad_user_data: 'denied', ad_personalization: 'denied',
            });
            win.gtag('js', new Date());
            win.gtag('config', gaId, {
                send_page_view: false, allow_google_signals: false,
                allow_ad_personalization_signals: false, ...pageFields(),
            });
            script('from-london-ga', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`);
        }
        // Avoid loading recordings on URLs that could contain private parameters.
        if (clarityId && !clarityStarted && !win.location.search && !win.location.hash) {
            clarityStarted = true;
            win.clarity = win.clarity || function () { (win.clarity.q = win.clarity.q || []).push(arguments); };
            win.clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' });
            script('from-london-clarity', `https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`);
        }
        if (clarityStarted && clarityStopped && !win.location.search && !win.location.hash) {
            win.clarity('start');
            win.clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' });
            clarityStopped = false;
        }
    };
    const event = (name, fields) => {
        if (consent !== true || !allowed() || !gaId) return false;
        try {
            start();
            win.gtag('event', name, { ...fields, ...pageFields() });
            return true;
        } catch { return false; } // Optional analytics cannot block shopping.
    };
    return {
        getConsent: () => consent,
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        setConsent(accepted) {
            consent = accepted === true;
            try { win.localStorage.setItem(CONSENT_KEY, JSON.stringify({ accepted: consent, at: Date.now() })); } catch { /* Keep the choice in memory. */ }
            if (!consent) {
                if (started) {
                    win[`ga-disable-${gaId}`] = true;
                    win.gtag('consent', 'update', { analytics_storage: 'denied' });
                }
                if (clarityStarted) {
                    win.clarity('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' });
                    win.clarity('stop');
                }
                // A reload unloads third-party listeners as well as their scripts.
                if (started || clarityStarted) win.location.reload();
            }
            lastPage = '';
            listeners.forEach(listener => listener());
        },
        pageView(key) {
            if (clarityStarted && (!allowed() || win.location.search || win.location.hash)) {
                win.clarity('stop');
                clarityStopped = true;
            }
            if (!allowed()) {
                if (started) win[`ga-disable-${gaId}`] = true;
                lastPage = '';
                return;
            }
            if (consent !== true || key === lastPage) return;
            win[`ga-disable-${gaId}`] = false;
            start();
            if (started) win.gtag('set', pageFields());
            lastPage = key;
            event('page_view', {});
        },
        ecommerce(name, products) {
            const items = ecommerceItems(products);
            return event(name, { currency: 'EGP', value: items.reduce((sum, item) => sum + item.price * item.quantity, 0), items });
        },
        purchase(order, products) {
            if (consent !== true || !order?.orderId || !Number.isFinite(Number(order.total))) return;
            const id = String(order.orderId);
            let saved = [];
            try {
                const stored = JSON.parse(win.localStorage.getItem(PURCHASE_KEY) || '[]');
                if (Array.isArray(stored)) saved = stored;
            } catch { /* In-memory and GA transaction ID deduplication still apply. */ }
            if (sentPurchases.has(id) || saved.includes(id)) return;
            if (!event('purchase', { transaction_id: id, currency: 'EGP', value: Number(order.total), items: ecommerceItems(products) })) return;
            sentPurchases.add(id);
            try { win.localStorage.setItem(PURCHASE_KEY, JSON.stringify([...saved, id])); } catch { /* Tracking must never interrupt checkout. */ }
        },
    };
}

export const analytics = createAnalytics(window, document,
    import.meta.env.VITE_GA_MEASUREMENT_ID, import.meta.env.VITE_CLARITY_PROJECT_ID);
