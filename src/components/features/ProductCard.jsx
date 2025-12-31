import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { formatCurrency } from '../../utils/formatCurrency';
import Skeleton from '../common/Skeleton';
import { useState } from 'react';

export default function ProductCard({ product, isLoading }) {
    const { isInWishlist, toggleWishlist } = useWishlist();
    const [isImageLoaded, setIsImageLoaded] = useState(false);

    if (isLoading) {
        return (
            <div className="flex flex-col space-y-3">
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
            </div>
        );
    }

    const isInList = isInWishlist(product.id);
    // Default to first image
    const image = product.images?.[0] || 'https://via.placeholder.com/300x400?text=No+Image';

    return (
        <div className="group relative flex flex-col">
            <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-gray-100 mb-3">
                <Link to={`/product/${product.id}`}>
                    <img
                        src={image}
                        alt={product.name}
                        className={`h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setIsImageLoaded(true)}
                        loading="lazy"
                    />
                </Link>
                {!isImageLoaded && <Skeleton className="absolute inset-0 w-full h-full" />}

                <button
                    onClick={(e) => {
                        e.preventDefault();
                        toggleWishlist(product);
                    }}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/80 hover:bg-white text-gray-900 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Add to wishlist"
                >
                    <Heart size={18} fill={isInList ? "currentColor" : "none"} className={isInList ? "text-red-500" : ""} />
                </button>

                {product.oldPrice && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                        SALE
                    </span>
                )}
                {!product.inStock && (
                    <span className="absolute bottom-2 left-2 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">
                        OUT OF STOCK
                    </span>
                )}
            </div>

            <div className="flex flex-col flex-1">
                <Link to={`/product/${product.id}`} className="text-sm text-gray-700 hover:underline line-clamp-2" title={product.name}>
                    {product.name}
                </Link>
                <div className="mt-1 flex items-center gap-2">
                    <p className={`text-sm font-semibold ${product.oldPrice ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCurrency(product.price)}
                    </p>
                    {product.oldPrice && (
                        <p className="text-xs text-gray-500 line-through">
                            {formatCurrency(product.oldPrice)}
                        </p>
                    )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{product.colors?.length} colours</p>
            </div>
        </div>
    );
}
