import { X } from 'lucide-react';
import FilterSidebar from './FilterSidebar';
import { useEffect } from 'react';

export default function MobileFilterDrawer({ isOpen, onClose }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 transition-opacity" onClick={onClose}></div>

            {/* Drawer */}
            <div className="relative w-full max-w-xs bg-white h-full shadow-xl flex flex-col animate-slide-in-right">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold">Filters</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <FilterSidebar className="" />
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
