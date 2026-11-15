import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const positions = new Map();

export function ScrollToTop() {
    const { key, pathname } = useLocation();
    const navigationType = useNavigationType();

    useEffect(() => {
        const previous = window.history.scrollRestoration;
        window.history.scrollRestoration = 'manual';
        return () => { window.history.scrollRestoration = previous; };
    }, []);

    useLayoutEffect(() => {
        const target = navigationType === 'POP' ? positions.get(key) || 0 : 0;
        let restoring = navigationType === 'POP' && target > 0;
        let timer;
        const restore = () => window.scrollTo({ top: target, left: 0, behavior: 'instant' });
        restore();
        const observer = new ResizeObserver(() => { if (restoring) restore(); });
        if (restoring) observer.observe(document.body);
        const stop = () => { restoring = false; observer.disconnect(); };
        timer = window.setTimeout(stop, 5000);
        const save = () => { if (!restoring) positions.set(key, window.scrollY); };
        window.addEventListener('scroll', save, { passive: true });
        for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.addEventListener(event, stop, { passive: true });
        return () => {
            clearTimeout(timer);
            observer.disconnect();
            window.removeEventListener('scroll', save);
            for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) window.removeEventListener(event, stop);
        };
    }, [key, pathname, navigationType]);

    return null;
}
