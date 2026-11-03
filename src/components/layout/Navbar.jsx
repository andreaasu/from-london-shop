import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, Heart, Search } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { totalItems } = useCart();
    const { wishlistItems } = useWishlist();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
            setIsMenuOpen(false);
        }
    };

    const navLinks = [
        { name: 'Women', path: '/shop?gender=women' },
        { name: 'Men', path: '/shop?gender=men' },
        { name: 'Kids', path: '/shop?gender=kids' },
        { name: 'Baby', path: '/shop?gender=baby' },
        { name: 'Footwear', path: '/shop?gender=footwear' },
        { name: 'Lingerie', path: '/shop?gender=lingerie' },
        { name: 'Home', path: '/' },
    ];

    return (
        <nav aria-label="Main navigation" onKeyDown={(event) => { if (event.key === 'Escape') setIsMenuOpen(false); }} className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">

                    {/* Mobile Menu Button */}
                    <button
                        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={isMenuOpen}
                        aria-controls="mobile-navigation"
                        className="xl:hidden p-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Logo */}
                    <Link to="/" className="text-xl sm:text-2xl font-black tracking-tight uppercase flex-shrink-0">
                        From London
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden xl:flex space-x-5 font-medium">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                aria-current={`${location.pathname}${location.search}` === link.path ? 'page' : undefined}
                                className={`hover:text-brand-blue transition-colors ${`${location.pathname}${location.search}` === link.path ? 'text-black font-semibold' : 'text-gray-600'}`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    {/* Icons */}
                    <div className="flex items-center space-x-1 sm:space-x-3">
                        <div className="hidden xl:block relative">
                            <form onSubmit={handleSearch}>
                                <input
                                    type="search"
                                    aria-label="Search products"
                                    placeholder="Search..."
                                    className="pl-8 pr-4 py-1.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black w-32 focus:w-48 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute left-2.5 top-2 text-gray-400" size={16} />
                            </form>
                        </div>

                        <Link aria-label={`Wishlist (${wishlistItems.length} items)`} to="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-full">
                            <Heart size={22} className="text-black" />
                            {wishlistItems.length > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                                    {wishlistItems.length}
                                </span>
                            )}
                        </Link>

                        <Link aria-label={`Shopping bag (${totalItems} items)`} to="/bag" className="relative p-2 hover:bg-gray-100 rounded-full">
                            <ShoppingBag size={22} className="text-black" />
                            {totalItems > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-brand-blue rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div id="mobile-navigation" className="xl:hidden max-h-[calc(100dvh-5rem)] overflow-y-auto py-4 border-t border-gray-100 animate-fade-in-down">
                        <form onSubmit={handleSearch} className="mb-4 relative">
                            <input
                                type="search"
                                aria-label="Search products"
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        </form>
                        <div className="flex flex-col space-y-3">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className="text-lg font-medium text-gray-800 py-2 border-b border-gray-50 last:border-0"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
