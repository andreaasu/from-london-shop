import { useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '../../lib/analytics';

export default function AnalyticsConsent() {
    const location = useLocation();
    const consent = useSyncExternalStore(analytics.subscribe, analytics.getConsent);
    const [editing, setEditing] = useState(false);
    useLayoutEffect(() => {
        analytics.pageView(location.key);
    }, [location, consent]);
    if (location.pathname.startsWith('/admin')) return null;
    const choose = accepted => { setEditing(false); analytics.setConsent(accepted); };
    return <>
        <button type="button" onClick={() => setEditing(true)} className="fixed bottom-3 left-3 z-50 rounded border bg-white px-3 py-2 text-xs shadow">Privacy settings</button>
        {(consent === null || editing) && <section aria-label="Analytics privacy preferences" className="fixed bottom-0 inset-x-0 z-[60] border-t bg-white p-5 shadow-lg">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
                <p className="max-w-2xl text-sm">With your permission, we use Google Analytics cookies to measure visits and shopping activity, and Microsoft Clarity for heatmaps and masked session recordings. Optional analytics stay off until you accept. You can change your choice here anytime.</p>
                <div className="flex gap-3">
                    <button type="button" onClick={() => choose(false)} className="rounded border border-black px-4 py-2 text-sm">Reject analytics</button>
                    <button type="button" onClick={() => choose(true)} className="rounded border border-black bg-black px-4 py-2 text-sm text-white">Accept analytics</button>
                </div>
            </div>
        </section>}
    </>;
}
