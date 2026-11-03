import { X } from 'lucide-react';
import FilterSidebar from './FilterSidebar';
import { useEffect, useRef } from 'react';

export default function MobileFilterDrawer({ isOpen, onClose, availableSizes = [] }) {
    const drawerRef = useRef(null);
    useEffect(() => {
        if (!isOpen) return;
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const drawer = drawerRef.current;
        drawer.querySelector('button')?.focus();
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
            if (event.key !== 'Tab') return;
            const controls = Array.from(drawer.querySelectorAll('button, input, select, a[href], [tabindex="0"]'))
                .filter(element => !element.disabled && element.getClientRects().length > 0);
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        };
        drawer.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            drawer.removeEventListener('keydown', handleKeyDown);
            previousFocus?.focus();
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose}></div>

            {/* Drawer */}
            <div ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby="filter-title" className="relative w-full max-w-xs bg-white h-full shadow-xl flex flex-col animate-slide-in-right">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 id="filter-title" className="text-lg font-bold">Filters</h2>
                    <button aria-label="Close filters" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <FilterSidebar className="" availableSizes={availableSizes} />
                </div>

                <div className="p-4 border-t border-gray-100 bg-white">
                    <button onClick={onClose} className="w-full bg-black text-white py-3 font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors">
                        Show Results
                    </button>
                </div>
            </div>
        </div>
    );
}
