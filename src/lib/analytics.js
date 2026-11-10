const CONSENT_KEY = 'from-london-analytics-consent-v1';
const PURCHASE_KEY = 'from-london-tracked-orders-v1';
const META_PURCHASE_KEY = 'from-london-meta-tracked-orders-v1';

// Only explicitly approved fields enter analytics. Never pass customer objects,
// form values, router state, query strings, hashes, or document.referrer.
export function ecommerceItems(products) {
    return products.map(product => ({
        item_id: String(product.id),
        price: Number(product.price),
        quantity: Number(product.quantity ?? 1),
    }));
}

export function createAnalytics(win, doc, gaId, clarityId, metaId) {
    let consent = null;
    try {
        const saved = JSON.parse(win.localStorage.getItem(CONSENT_KEY));
        if (saved && Date.now() - saved.at < 180 * 86400000) consent = saved.accepted === true;
    } catch { /* Storage may be disabled. Default to no tracking. */ }
    const privacyOptOut = win.navigator?.globalPrivacyControl === true || win.navigator?.doNotTrack === '1';
    let policy = 'pending';
    let policyRequest;
    const effectiveConsent = () => privacyOptOut ? false : (consent ?? (policy === 'optional' ? true : null));
    let started = false;
    let clarityStarted = false;
    let clarityStopped = false;
    let lastPage = '';
    const sentPurchases = new Set();
    const sentMetaPurchases = new Set();
    const pendingPixels = new Set();
    let pixelSequence = 0;
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
    // Image pixels deliberately avoid the SDK's automatic URL/referrer, form,
    // and advanced-matching collection. Only this allowlisted payload is sent.
    const metaEvent = (name, fields = {}, eventId) => {
        if (!metaId || effectiveConsent() !== true || !allowed()) return false;
        try {
            const params = new URLSearchParams({
                id: String(metaId), ev: name, dl: win.location.origin + safePath(),
                rl: '', if: 'false', noscript: '1', ts: String(Date.now()),
                // Distinct legitimate actions must not share a cached image URL.
                r: String(++pixelSequence),
            });
            for (const [key, value] of Object.entries(fields)) {
                params.set(`cd[${key}]`, typeof value === 'object' ? JSON.stringify(value) : String(value));
            }
            if (eventId) params.set('eid', eventId);
            const pixel = doc.createElement('img');
            pixel.referrerPolicy = 'no-referrer';
            pendingPixels.add(pixel);
            pixel.onload = pixel.onerror = () => pendingPixels.delete(pixel);
            pixel.src = `https://www.facebook.com/tr/?${params}`;
            return true;
        } catch { return false; }
    };
    const metaFields = (items, value) => ({
        content_type: 'product', content_ids: items.map(item => item.item_id),
        contents: items.map(item => ({ id: item.item_id, quantity: item.quantity, item_price: item.price })),
        num_items: items.reduce((sum, item) => sum + item.quantity, 0),
        currency: 'EGP', value,
    });
    const start = () => {
        if (effectiveConsent() !== true || !allowed()) return;
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
            win.clarity('consentv2', { analytics_Storage: consent === true ? 'granted' : 'denied', ad_Storage: 'denied' });
            script('from-london-clarity', `https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`);
        }
        if (clarityStarted && clarityStopped && !win.location.search && !win.location.hash) {
            win.clarity('start');
            win.clarity('consentv2', { analytics_Storage: consent === true ? 'granted' : 'denied', ad_Storage: 'denied' });
            clarityStopped = false;
        }
    };
    const event = (name, fields) => {
        if (effectiveConsent() !== true || !allowed() || !gaId) return false;
        try {
            start();
            win.gtag('event', name, { ...fields, ...pageFields() });
            return true;
        } catch { return false; } // Optional analytics cannot block shopping.
    };
    return {
        getConsent: effectiveConsent,
        getPolicy: () => policy,
        isPrivacyOptOut: () => privacyOptOut,
        isConfigured: () => Boolean(gaId || clarityId || metaId),
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        resolvePolicy() {
            if (policyRequest) return policyRequest;
            policyRequest = Promise.resolve().then(async () => {
                try {
                    const response = await win.fetch('/api/analytics-policy', { credentials: 'same-origin', cache: 'no-store' });
                    const result = response.ok ? await response.json() : null;
                    policy = result?.requiresConsent === false ? 'optional' : 'required';
                } catch { policy = 'required'; }
                listeners.forEach(listener => listener());
            });
            return policyRequest;
        },
        setConsent(accepted) {
            consent = accepted === true && !privacyOptOut;
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
            if (consent && clarityStarted) win.clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' });
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
            if (effectiveConsent() !== true || key === lastPage) return;
            win[`ga-disable-${gaId}`] = false;
            start();
            if (started) win.gtag('set', pageFields());
            lastPage = key;
            event('page_view', {});
            metaEvent('PageView');
        },
        ecommerce(name, products) {
            const items = ecommerceItems(products);
            const value = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const gaSent = event(name, { currency: 'EGP', value, items });
            const metaName = { view_item: 'ViewContent', add_to_cart: 'AddToCart', begin_checkout: 'InitiateCheckout' }[name];
            const metaSent = metaName ? metaEvent(metaName, metaFields(items, value)) : false;
            return gaSent || metaSent;
        },
        purchase(order, products) {
            if (effectiveConsent() !== true || !order?.orderId || !Number.isFinite(Number(order.total))) return;
            const id = String(order.orderId);
            let saved = [];
            try {
                const stored = JSON.parse(win.localStorage.getItem(PURCHASE_KEY) || '[]');
                if (Array.isArray(stored)) saved = stored;
            } catch { /* In-memory and GA transaction ID deduplication still apply. */ }
            if (!sentPurchases.has(id) && !saved.includes(id) &&
                event('purchase', { transaction_id: id, currency: 'EGP', value: Number(order.total), items: ecommerceItems(products) })) {
                sentPurchases.add(id);
                try { win.localStorage.setItem(PURCHASE_KEY, JSON.stringify([...saved, id])); } catch { /* Tracking must never interrupt checkout. */ }
            }
            let metaSaved = [];
            try {
                const stored = JSON.parse(win.localStorage.getItem(META_PURCHASE_KEY) || '[]');
                if (Array.isArray(stored)) metaSaved = stored;
            } catch { /* In-memory deduplication still applies. */ }
            if (!sentMetaPurchases.has(id) && !metaSaved.includes(id) &&
                metaEvent('Purchase', metaFields(ecommerceItems(products), Number(order.total)), `purchase-${id}`)) {
                sentMetaPurchases.add(id);
                try { win.localStorage.setItem(META_PURCHASE_KEY, JSON.stringify([...metaSaved, id])); } catch { /* Optional analytics. */ }
            }
        },
    };
}

export const analytics = createAnalytics(window, document,
    import.meta.env.VITE_GA_MEASUREMENT_ID, import.meta.env.VITE_CLARITY_PROJECT_ID, import.meta.env.VITE_META_PIXEL_ID);
