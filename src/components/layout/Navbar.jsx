import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingBag, Heart, Search, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { totalItems } = useCart();
    const { wishlistItems } = useWishlist();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
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
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>

                    {/* Logo */}
                    <Link to="/" className="text-2xl font-black tracking-tight uppercase flex-shrink-0">
                        From London
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex space-x-8 font-medium">
                        {navLinks.map((link) => (
                            <NavLink
                                key={link.name}
                                to={link.path}
                                className={({ isActive }) =>
                                    `hover:text-brand-blue transition-colors ${isActive ? 'text-black' : 'text-gray-600'}`
                                }
                            >
                                {link.name}
                            </NavLink>
                        ))}
                    </div>

                    {/* Icons */}
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:block relative">
                            <form onSubmit={handleSearch}>
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="pl-8 pr-4 py-1.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black w-32 focus:w-48 transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                <Search className="absolute left-2.5 top-2 text-gray-400" size={16} />
                            </form>
                        </div>

                        <Link to="/wishlist" className="relative p-2 hover:bg-gray-100 rounded-full">
                            <Heart size={22} className="text-black" />
                            {wishlistItems.length > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full">
                                    {wishlistItems.length}
                                </span>
                            )}
                        </Link>

                        <Link to="/bag" className="relative p-2 hover:bg-gray-100 rounded-full">
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
                    <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in-down">
                        <form onSubmit={handleSearch} className="mb-4 relative">
                            <input
                                type="text"
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
