import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import ProductCard from '../components/features/ProductCard';
import FilterSidebar from '../components/features/FilterSidebar';
import MobileFilterDrawer from '../components/features/MobileFilterDrawer';
import SortDropdown from '../components/features/SortDropdown';
import { useFilters } from '../context/FilterContext';
import { productService } from '../services/productService';

export default function Shop() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const { filters, updateFilter, setAllFilters, resetFilters } = useFilters();

    // Initial fetch
    useEffect(() => {
        productService.getProducts().then(data => {
            setProducts(data);
            setLoading(false);
        });
    }, []);

    // Sync URL params to Context on mount/update - STRICT SYNC
    useEffect(() => {
        const gender = searchParams.get('gender');
        const category = searchParams.get('category');
        const collection = searchParams.get('collection');
        const search = searchParams.get('search');

        // Construct fresh state based on URL, defaulting everything else to empty
        const nextFilters = {
            search: search || '',
            gender: gender || '',
            category: category ? [category] : [],
            collection: collection ? [collection] : [],
            type: [],
            size: [],
            color: [],
            priceRange: [0, 5000], // Ensure max matches context default
            inStockOnly: false,
            sort: 'newest' // Persist or reset sort? Usually reset on new nav, or keep. Let's reset to default for consistency with "default to empty".
        };

        setAllFilters(nextFilters);
    }, [searchParams]);

    // Helper to check if a product matches filters (except size)
    const matchesBaseFilters = (product) => {
        // Null checks and defaults for product data
        const pName = (product.name || '').toLowerCase().trim();
        const pTags = Array.isArray(product.tags) ? product.tags : [];
        const pGender = (product.gender || '').toLowerCase().trim();
        const pCategory = (product.category || '').toLowerCase().trim();
        const pCollection = (product.collection || '').toLowerCase().trim();
        const pPrice = typeof product.price === 'number' ? product.price : 0;
        const pInStock = !!product.inStock;

        // Safe filter values
        const filterSearch = (filters.search || '').toLowerCase().trim();
        const filterGender = (filters.gender || '').toLowerCase().trim(); // String
        const filterCategory = Array.isArray(filters.category) ? filters.category : [];
        const filterCollection = Array.isArray(filters.collection) ? filters.collection : [];
        const filterPriceRange = Array.isArray(filters.priceRange) && filters.priceRange.length === 2
            ? filters.priceRange
            : [0, 1000]; // Default range if invalid

        // Search
        if (filterSearch) {
            const nameMatch = pName.includes(filterSearch);
            // Safe check for tags: join array to string then check includes, or some()
            const tagMatch = pTags.some(t => (t || '').toLowerCase().includes(filterSearch));
            if (!nameMatch && !tagMatch) {
                return false;
            }
        }

        // Gender (Strict equality string check)
        if (filterGender) {
            // Match if exact gender match, OR if product is unisex (shows in all gender queries usually, or specific logic)
            if (pGender !== filterGender && pGender !== 'unisex') {
                return false;
            }
        }

        // Category
        if (filterCategory.length > 0) {
            const matches = filterCategory.some(c => (c || '').toLowerCase() === pCategory);
            if (!matches) return false;
        }

        // Collection
        if (filterCollection.length > 0) {
            const matches = filterCollection.some(c => (c || '').toLowerCase() === pCollection);
            if (!matches) return false;
        }

        // Price
        if (pPrice < filterPriceRange[0] || pPrice > filterPriceRange[1]) return false;

        // In Stock
        if (filters.inStockOnly && !pInStock) return false;

        return true;
    };

    // 1. Derive Available Sizes based on products filtered by everything EXCEPT size
    const availableSizes = useMemo(() => {
        const relevantProducts = products.filter(matchesBaseFilters);
        const sizesSet = new Set();

        relevantProducts.forEach(p => {
            const stockObj = p.stock_by_size || {};
            // If explicit stock by size exists
            if (Object.keys(stockObj).length > 0) {
                Object.entries(stockObj).forEach(([size, qty]) => {
                    if (Number(qty) > 0) sizesSet.add(size);
                });
            } else if (Array.isArray(p.sizes)) {
                // Fallback if stock_by_size not populated but sizes array exists (less accurate for stock)
                p.sizes.forEach(s => sizesSet.add(s));
            }
        });

        // Optional: Sort sizes if needed (XS, S, M, L... or numerical)
        // For now, simple alphabetical or standard sort
        const sorter = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL', '0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M', '2-3Y', '3-4Y'];
        return Array.from(sizesSet).sort((a, b) => {
            const idxA = sorter.indexOf(a);
            const idxB = sorter.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [products, filters.search, filters.gender, filters.category, filters.collection, filters.priceRange, filters.inStockOnly]);

    // 2. Cleanup selected sizes that are no longer available
    useEffect(() => {
        const selectedSizes = Array.isArray(filters.size) ? filters.size : [];
        if (selectedSizes.length > 0) {
            const validSizes = selectedSizes.filter(s => availableSizes.includes(s));
            if (validSizes.length !== selectedSizes.length) {
                // If the arrays differ, it means some selected sizes are invalid
                updateFilter('size', validSizes);
            }
        }
    }, [availableSizes, filters.size]);


    // 3. Final Filtered Products (including size filter)
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            if (!matchesBaseFilters(product)) return false;

            // Size Filter
            const filterSize = Array.isArray(filters.size) ? filters.size : [];
            if (filterSize.length > 0) {
                // Check if product has ANY of the selected sizes in stock
                const stockObj = product.stock_by_size || {};
                const hasStock = filterSize.some(size => (stockObj[size] ?? 0) > 0);

                // Fallback check if stock_by_size is empty but sizes array exists (though we prefer stock check)
                const hasSizeListed = Array.isArray(product.sizes) && filterSize.some(size => product.sizes.includes(size));

                if (Object.keys(stockObj).length > 0) {
                    if (!hasStock) return false;
                } else {
                    if (!hasSizeListed) return false;
                }
            }

            return true;
        }).sort((a, b) => {
            const orderA = Number(a.display_order ?? 0);
            const orderB = Number(b.display_order ?? 0);
            if (orderA !== orderB) return orderB - orderA;

            const priceA = a.price || 0;
            const priceB = b.price || 0;
            switch (filters.sort) {
                case 'price-low-high': return priceA - priceB;
                case 'price-high-low': return priceB - priceA;
                case 'newest': return 0; // Assuming API returns newest first or we have date field
                default: return 0;
            }
        });
    }, [products, filters, availableSizes]); // availableSizes dependency not strictly needed for logic but good for consistency

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Mobile Header / Controls */}
            <div className="flex md:hidden justify-between items-center mb-6">
                <button onClick={() => setIsDrawerOpen(true)} className="flex items-center gap-2 font-bold uppercase text-sm border border-gray-300 px-4 py-2 rounded">
                    <Filter size={16} /> Filters
                </button>
                <SortDropdown />
            </div>

            <div className="flex gap-8">
                {/* Desktop Sidebar */}
                <div className="hidden md:block w-64 flex-shrink-0">
                    <FilterSidebar availableSizes={availableSizes} />
                </div>

                {/* Product Grid */}
                <div className="flex-1">
                    {/* Desktop Header */}
                    <div className="hidden md:flex justify-between items-center mb-6">
                        <h1 className="text-xl font-bold uppercase">{filteredProducts.length} Products</h1>
                        <SortDropdown />
                    </div>

                    {/* Active Filters pills (optional, good for UX) */}

                    {filters.search && (
                        <div className="mb-4">
                            <span className="text-gray-500">Searching for: </span>
                            <span className="font-bold">"{filters.search}"</span>
                            <button onClick={() => updateFilter('search', '')} className="ml-2 text-red-500 text-sm"><X size={12} className="inline" /></button>
                        </div>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {Array(8).fill(0).map((_, i) => <ProductCard key={i} isLoading={true} />)}
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in-up">
                            {filteredProducts.map(p => <ProductCard key={p.id} product={p} />)}
                        </div>
                    ) : (
                        <div className="py-20 text-center text-gray-500">
                            <p className="text-xl">No products found.</p>
                            <button
                                onClick={() => {
                                    resetFilters();
                                    setSearchParams({});
                                }}
                                className="mt-4 underline"
                            >
                                Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <MobileFilterDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                availableSizes={availableSizes}
            />
        </div>
    );
}
