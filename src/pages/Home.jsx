import { useEffect, useState } from 'react';
import HeroBanner from '../components/features/HeroBanner';
import CategoryTiles from '../components/features/CategoryTiles';
import ProductCard from '../components/features/ProductCard';
import { productService } from '../services/productService';

export default function Home() {
    const [featured, setFeatured] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        productService.getFeaturedProducts().then(data => {
            setFeatured(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="pb-12">
            <HeroBanner />
            <CategoryTiles />

            {/* New In Section */}
            <section className="container mx-auto px-4 py-12">
                <div className="flex justify-between items-end mb-8">
                    <h2 className="text-2xl font-bold uppercase tracking-wider">New Arrivals</h2>
                    <a href="/shop?collection=new-in" className="text-sm border-b border-black hover:text-gray-600 transition-colors">View All</a>
                </div>

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
                    <a href="/shop" className="bg-black text-white px-8 py-3 font-bold uppercase inline-block hover:opacity-80">Shop Sale</a>
                </div>
            </section>
        </div>
    );
}
