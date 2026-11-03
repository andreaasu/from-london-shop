import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart } from "lucide-react";
import { productService } from "../services/productService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatCurrency } from "../utils/formatCurrency";
import { sortSizes } from "../utils/sortSizes";
import ProductGallery from "../components/features/ProductGallery";

export default function ProductDetails() {
    const { id } = useParams();
    return <ProductDetailsView key={id} id={id} />;
}

function ProductDetailsView({ id }) {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    // activeImage state removed - handled in ProductGallery
    const [isAdded, setIsAdded] = useState(false);
    const [selectionError, setSelectionError] = useState('');
    const [loadError, setLoadError] = useState(false);
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        if (!isAdded) return;
        const timer = setTimeout(() => setIsAdded(false), 4000);
        return () => clearTimeout(timer);
    }, [isAdded]);

    // Fetch product
    useEffect(() => {
        let mounted = true;

        productService
            .getProductById(id)
            .then((data) => {
                if (!mounted) return;

                setProduct(data || null);

                // Reset selections when switching product
                setSelectedSize(null);

                const safeColors = Array.isArray(data?.colors) ? data.colors : [];
                setSelectedColor(safeColors[0] ?? null);

                // Image handling moved to ProductGallery component

                setLoading(false);
            })
            .catch(() => {
                if (mounted) setLoadError(true);
                if (!mounted) return;
                setProduct(null);
                setLoading(false);
            });

        return () => {
            mounted = false;
        };
    }, [id, retry]);

    // Safe derived fields (never undefined)
    const safe = useMemo(() => {
        const images = Array.isArray(product?.images) ? product.images : [];
        const colors = Array.isArray(product?.colors) ? product.colors : [];

        // Determine available sizes
        let sizes = [];
        if (product?.stock_by_size && typeof product.stock_by_size === 'object' && Object.keys(product.stock_by_size).length > 0) {
            sizes = Object.entries(product.stock_by_size)
                .filter((entry) => Number(entry[1]) > 0)
                .map(([size]) => size);
        } else {
            sizes = Array.isArray(product?.sizes) ? product.sizes : [];
        }

        return {
            images: images.length ? images : ["/placeholder.svg"],
            sizes: sortSizes(sizes),
            colors,
            brand: product?.brand || "From London",
            inStock: product?.inStock ?? product?.in_stock ?? true, // supports Supabase snake_case too
        };
    }, [product]);

    const handleAddToCart = () => {
        if (!product) return;

        // if product has sizes, enforce choosing one
        if (safe.sizes.length > 0 && !selectedSize) {
            setSelectionError("Please select a size before adding this item to your bag.");
            return;
        }

        const result = addToCart(product, selectedSize, selectedColor);
        if (!result.success) {
            setSelectionError(result.error);
            return;
        }
        setSelectionError('');
        setIsAdded(true);

    };



    // Rendering
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                Loading...
            </div>
        );
    }

    if (!product) {
        return (
            <div className="container mx-auto px-4 py-12 text-center">
                <h1 className="text-2xl font-bold mb-4">{loadError ? "We couldn't load this product" : "Product not found"}</h1>
                {loadError && <button className="underline mr-4" onClick={() => { setLoading(true); setLoadError(false); setRetry(value => value + 1); }}>Try again</button>}
                <Link to="/shop" className="underline">Continue shopping</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                {/* Gallery */}
                {/* Gallery */}
                <ProductGallery images={safe.images} productName={product.name} />

                {/* Info */}
                <div>
                    <span className="text-gray-500 text-sm tracking-widest uppercase">
                        {safe.brand}
                    </span>

                    <h1 className="text-3xl font-black text-gray-900 mt-2 mb-4">
                        {product.name}
                    </h1>

                    <div className="flex items-center gap-3 mb-6">
                        <p className={`text-2xl font-semibold ${product.oldPrice ? "text-red-600" : "text-gray-900"}`}>
                            {formatCurrency(product.price)}
                        </p>

                        {product.oldPrice && (
                            <p className="text-lg text-gray-500 line-through">
                                {formatCurrency(product.oldPrice)}
                            </p>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Colour (only if exists) */}
                        {safe.colors.length > 0 && (
                            <div>
                                <label className="block text-sm font-bold mb-2">
                                    Colour: {selectedColor}
                                </label>

                                <div className="flex gap-2">
                                    {safe.colors.map((col) => (
                                        <button
                                            key={col}
                                            aria-pressed={selectedColor === col}
                                            onClick={() => setSelectedColor(col)}
                                            className={`px-4 py-2 border text-sm ${selectedColor === col
                                                ? "border-black bg-black text-white"
                                                : "border-gray-300 hover:border-black"
                                                }`}
                                        >
                                            {col}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-sm font-bold">Size</label>
                                <Link to="/contact" className="text-sm underline text-gray-600 hover:text-black">Need sizing help?</Link>
                            </div>

                            {safe.sizes.length === 0 ? (
                                <p className="text-gray-500 text-sm">
                                    No sizes available for this item.
                                </p>
                            ) : (
                                <>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {safe.sizes.map((size) => (
                                            <button
                                                key={size}
                                                aria-pressed={selectedSize === size}
                                                onClick={() => { setSelectedSize(size); setSelectionError(''); }}
                                                className={`py-3 text-sm font-medium border rounded transition-colors ${selectedSize === size
                                                    ? "border-black bg-black text-white"
                                                    : "border-gray-200 hover:border-black"
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>

                                    {!selectedSize && (
                                        <p className="text-gray-600 text-sm mt-2">
                                            Please select a size
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        {selectionError && <p role="alert" className="text-sm text-red-700">{selectionError}</p>}
                        {isAdded && <p role="status" className="text-sm text-green-700">Added to your bag. <Link to="/bag" className="underline font-medium">View bag</Link></p>}
                        {/* Actions */}
                        <div className="flex gap-4 pt-4 border-t border-gray-100">
                            <button
                                onClick={handleAddToCart}
                                className={`flex-1 py-4 font-bold uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isAdded
                                    ? "bg-green-600 text-white"
                                    : "bg-brand-blue text-white hover:brightness-90"
                                    }`}
                                disabled={!safe.inStock || isAdded}
                            >
                                {safe.inStock ? (isAdded ? "✓ Added" : "Add to Bag") : "Out of Stock"}
                            </button>

                            <button
                                aria-label={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                                aria-pressed={isInWishlist(product.id)}
                                onClick={() => toggleWishlist(product)}
                                className={`p-4 border rounded hover:bg-gray-50 ${isInWishlist(product.id) ? "bg-red-50 border-red-200" : ""
                                    }`}
                            >
                                <Heart
                                    fill={isInWishlist(product.id) ? "currentColor" : "none"}
                                    className={isInWishlist(product.id) ? "text-red-500" : ""}
                                />
                            </button>
                        </div>

                        {/* USP */}
                        {/* <div className="space-y-3 pt-6 text-sm text-gray-600">
                            <div className="flex items-center gap-3">
                                <Truck size={20} />
                                <span>Free delivery on orders over 1000 LE</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <RefreshCw size={20} />
                                <span>Free returns within 30 days</span>
                            </div>
                        </div> */}

                        {/* Description */}
                        <div className="pt-6 border-t border-gray-100">
                            <h3 className="font-bold mb-2">Description</h3>
                            <p className="text-gray-600 leading-relaxed text-sm">
                                {product.description || "No description available."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
