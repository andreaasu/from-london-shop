import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../../lib/analytics';

export default function AnalyticsConsent() {
    const location = useLocation();
    const consent = useSyncExternalStore(analytics.subscribe, analytics.getConsent);
    const policy = useSyncExternalStore(analytics.subscribe, analytics.getPolicy);
    const [editing, setEditing] = useState(false);
    const panel = useRef(null);
    const trigger = useRef(null);
    useEffect(() => {
        if (analytics.isConfigured() && !location.pathname.startsWith('/admin')) void analytics.resolvePolicy();
    }, [location.pathname]);
    useEffect(() => {
        const open = () => { trigger.current = document.activeElement; setEditing(true); };
        window.addEventListener('analytics:privacy-settings', open);
        return () => window.removeEventListener('analytics:privacy-settings', open);
    }, []);
    useEffect(() => { if (editing) panel.current?.focus(); }, [editing]);
    useLayoutEffect(() => {
        analytics.pageView(location.key);
    }, [location, consent]);
    if (location.pathname.startsWith('/admin')) return null;
    const close = () => { setEditing(false); trigger.current?.focus(); };
    const choose = accepted => { close(); analytics.setConsent(accepted); };
    const showNotice = analytics.isConfigured() && policy === 'required' && consent === null;
    if (!showNotice && !editing) return null;
    return <section ref={panel} tabIndex={-1} aria-label="Analytics privacy settings" aria-describedby="analytics-privacy-description"
        onKeyDown={event => { if (editing && event.key === 'Escape') close(); }}
        className="fixed bottom-3 left-3 right-3 z-[60] rounded-lg border border-gray-200 bg-white p-4 text-gray-700 shadow-md sm:left-auto sm:w-96">
        <p id="analytics-privacy-description" className="text-xs leading-relaxed">
            {analytics.isPrivacyOptOut()
                ? 'Your browser privacy signal keeps optional analytics off.'
                : 'We use Google Analytics cookies and Microsoft Clarity for shopping analytics, heatmaps and masked recordings. Customer details are masked. You can change your choice in the footer.'}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" disabled={analytics.isPrivacyOptOut()} onClick={() => choose(true)} className="rounded border border-gray-400 px-4 py-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50">Accept</button>
            <button type="button" onClick={() => choose(false)} className="rounded border border-gray-400 px-4 py-2 text-xs font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Decline</button>
            {editing && <button type="button" onClick={close} className="ml-auto px-2 py-2 text-xs underline focus-visible:outline focus-visible:outline-2">Close</button>}
        </div>
    </section>;
}
