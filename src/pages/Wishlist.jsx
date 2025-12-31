import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/features/ProductCard';
import { Link } from 'react-router-dom';

export default function Wishlist() {
    const { wishlistItems } = useWishlist();

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-black uppercase mb-8">My Wishlist ({wishlistItems.length})</h1>
            {wishlistItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {wishlistItems.map(item => (
                        <ProductCard key={item.id} product={item} />
                    ))}
                </div>
            ) : (
                <div className="py-20 text-center">
                    <p className="text-gray-500 mb-4">No saved items yet.</p>
                    <Link to="/shop" className="underline">Browse Products</Link>
                </div>
            )}
        </div>
    );
}
