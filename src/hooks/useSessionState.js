import { useEffect, useState } from 'react';

export function useSessionState(key, initial) {
    const [value, setValue] = useState(() => {
        if (!key) return initial;
        try { const stored = sessionStorage.getItem(key); return stored === null ? initial : JSON.parse(stored); }
        catch { return initial; }
    });
    useEffect(() => { if (!key) return; try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage may be unavailable. */ } }, [key, value]);
    return [value, setValue];
}
