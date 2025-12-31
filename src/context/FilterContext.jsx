import { createContext, useContext, useState, useMemo } from 'react';

const FilterContext = createContext();

export const useFilters = () => useContext(FilterContext);

export const FilterProvider = ({ children }) => {
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

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
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
    };

    // Explicitly allow replacing all filters for URL sync
    const setAllFilters = (newFilters) => setFilters(newFilters);

    const value = useMemo(() => ({ filters, updateFilter, resetFilters, setAllFilters }), [filters]);

    return (
        <FilterContext.Provider value={value}>
            {children}
        </FilterContext.Provider>
    );
};
