import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const savedFilters = new Map();
export function readShopFilters(key) { return savedFilters.get(key); }

const FilterContext = createContext();

export const useFilters = () => useContext(FilterContext);

export const FilterProvider = ({ children }) => {
    const { key: locationKey, pathname } = useLocation();
    const [filters, setFilters] = useState({
        search: '',
        gender: '', // String (single select)
        category: [],
        type: [],
        size: [],
        color: [],
        priceRange: [0, 5000],
        inStockOnly: false,
        sort: 'newest', // 'price-low-high', 'price-high-low', 'best-sellers', 'newest'
    });

    const updateFilter = useCallback((key, value) => {
        setFilters(prev => {
            const next = { ...prev, [key]: value };
            if (pathname === '/shop') savedFilters.set(locationKey, next);
            return next;
        });
    }, [locationKey, pathname]);

    const resetFilters = useCallback(() => {
        setFilters({
            search: '',
            gender: '',
            category: [],
            type: [],
            size: [],
            color: [],
            priceRange: [0, 5000],
            inStockOnly: false,
            sort: 'newest',
        });
    }, []);

    // Explicitly allow replacing all filters for URL sync
    const setAllFilters = useCallback((newFilters) => {
        if (pathname === '/shop') savedFilters.set(locationKey, newFilters);
        setFilters(newFilters);
    }, [locationKey, pathname]);

    const value = useMemo(() => ({ filters, updateFilter, resetFilters, setAllFilters }), [filters, updateFilter, resetFilters, setAllFilters]);

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};
