import { useFilters } from '../../context/FilterContext';

export default function FilterSidebar({ className }) {
    const { filters, updateFilter, resetFilters } = useFilters();

    // Safe Accessors
    const selectedGender = filters.gender || ''; // String default
    const selectedCategories = Array.isArray(filters.category) ? filters.category : [];
    const selectedCollections = Array.isArray(filters.collection) ? filters.collection : [];
    const selectedPriceRange = Array.isArray(filters.priceRange) && filters.priceRange.length === 2 ? filters.priceRange : [0, 100];
    const inStockOnly = !!filters.inStockOnly;

    // Hardcoded options
    const categories = ['clothing', 'footwear', 'accessories'];
    const genders = ['women', 'men', 'kids', 'baby'];
    const collections = ['new-in', 'basics', 'sale', 'winter-collection', 'summer-collection'];

    // For array-based filters (Category, Collection)
    const handleCheckboxChange = (group, value) => {
        // Determine safe current array based on group
        let current = [];
        if (group === 'category') current = selectedCategories;
        if (group === 'collection') current = selectedCollections;

        if (current.includes(value)) {
            updateFilter(group, current.filter(item => item !== value));
        } else {
            updateFilter(group, [...current, value]);
        }
    };

    return (
        <div className={`space-y-8 pb-10 ${className}`}>
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Filters</h3>
                <button onClick={resetFilters} className="text-xs underline text-gray-500 hover:text-black">
                    Clear All
                </button>
            </div>

            {/* Gender (Single Select/String) */}
            <div>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">Department</h4>
                <div className="space-y-2">
                    {genders.map(g => (
                        <label key={g} className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700">
                            <input
                                type="radio"
                                name="gender_filter"
                                checked={selectedGender === g}
                                onChange={() => updateFilter('gender', g)}
                                className="rounded-full border-gray-300 text-brand-blue focus:ring-brand-blue"
                            />
                            <span className="capitalize">{g}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Category (Multi Select/Array) */}
            <div>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">Category</h4>
                <div className="space-y-2">
                    {categories.map(c => (
                        <label key={c} className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(c)}
                                onChange={() => handleCheckboxChange('category', c)}
                                className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                            />
                            <span className="capitalize">{c}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">Price</h4>
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <span>0 LE</span>
                    <input
                        type="range"
                        min="0"
                        max="5000"
                        value={selectedPriceRange[1]}
                        onChange={(e) => updateFilter('priceRange', [0, parseInt(e.target.value) || 5000])}
                        className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span>{selectedPriceRange[1]} LE+</span>
                </div>
            </div>

            {/* Collections (Multi Select/Array) */}
            {/* <div>
                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide">Collection</h4>
                <div className="space-y-2">
                    {collections.map(c => (
                        <label key={c} className="flex items-center space-x-2 cursor-pointer text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={selectedCollections.includes(c)}
                                onChange={() => handleCheckboxChange('collection', c)}
                                className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                            />
                            <span className="capitalize">{c.replace('-', ' ')}</span>
                        </label>
                    ))}
                </div>
            </div> */}

            {/* In Stock */}
            <div className="pt-4 border-t border-gray-100">
                <label className="flex items-center space-x-2 cursor-pointer text-sm font-medium text-gray-900">
                    <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => updateFilter('inStockOnly', e.target.checked)}
                        className="rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                    />
                    <span>In Stock Only</span>
                </label>
            </div>

        </div>
    );
}
