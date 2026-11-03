import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import HeroBanner from '../components/features/HeroBanner';
import CategoryTiles from '../components/features/CategoryTiles';
import ProductCard from '../components/features/ProductCard';
import { productService } from '../services/productService';

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        let active = true;
        productService.getFeaturedProducts().then(data => {
            if (active) setFeatured(data);
        }).catch(() => {
            if (active) setError("We couldn't load the products. Please try again.");
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [retry]);

    return (
        <div className="pb-12">
            <HeroBanner />
            <CategoryTiles />

            {/* New In Section */}
            <section className="container mx-auto px-4 py-12">
                <div className="flex justify-between items-end mb-8">
                    <h2 className="text-2xl font-bold uppercase tracking-wider">Featured Picks</h2>
                    <Link to="/shop" className="text-sm border-b border-black hover:text-gray-600 transition-colors">View All</Link>
                </div>

                {error && <div role="alert" className="rounded-lg border border-gray-200 bg-white p-6 mb-6 text-center"><p>{error}</p><button onClick={() => { setLoading(true); setError(''); setRetry(value => value + 1); }} className="mt-3 underline font-medium">Try again</button></div>}
                {!loading && !error && featured.length === 0 && <p className="text-gray-600">New arrivals are coming soon. Check back for the latest collection.</p>}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {loading
                        ? Array(4).fill(0).map((_, i) => <ProductCard key={i} isLoading={true} />)
                        : featured.slice(0, 4).map(product => <ProductCard key={product.id} product={product} />)
                    }
                </div>
            </section>

            {/* Another Section (e.g., Best Sellers or promo) */}
            <section className="bg-brand-blue/10 py-16 mt-8">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-black mb-4">WINTER COLLECTION</h2>
                    <p className="mb-8 text-lg">Select Your Style Now.</p>
                    <Link to="/shop" className="bg-black text-white px-8 py-3 font-bold uppercase inline-block hover:opacity-80">Explore the Collection</Link>
                </div>
            </section>
        </div>
    );
}
