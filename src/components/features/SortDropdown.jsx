import { useFilters } from '../../context/FilterContext';

export default function SortDropdown() {
    const { filters, updateFilter } = useFilters();

    return (
        <div className="flex items-center space-x-2">
            <label htmlFor="sort" className="text-sm text-gray-600">Sort by:</label>
            <select
                id="sort"
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="text-sm border-gray-300 rounded-md focus:ring-black focus:border-black py-1.5 pl-3 pr-8 bg-transparent"
            >
                <option value="newest">New In</option>
                <option value="price-low-high">Price: Low to High</option>
                <option value="price-high-low">Price: High to Low</option>
            </select>
        </div>
    );
}
