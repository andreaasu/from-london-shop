import { Link } from 'react-router-dom';

export default function HeroBanner() {
    return (
        <div className="relative h-[500px] w-full bg-gray-900 text-white overflow-hidden">
            {/* Placeholder background image using a reliable unrelated image or color gradient if image fails */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-transparent z-10"></div>
            <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=2000"
                alt="Fashion Banner"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
            />

            <div className="relative z-20 container mx-auto px-4 h-full flex flex-col justify-center items-start">
                <span className="text-brand-blue font-bold tracking-widest uppercase mb-2">New Collection</span>
                <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                    WINTER <br /> ESSENTIALS
                </h1>
                <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-lg">
                    Discover the latest trends in womenswear, menswear and kids. Cozy knits, stylish coats and more.
                </p>
                <div className="flex gap-4">
                    <Link
                        to="/shop?collection=winter-collection"
                        className="bg-white text-black px-8 py-3 font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors"
                    >
                        Shop Winter
                    </Link>
                    <Link
                        to="/shop"
                        className="border-2 border-white text-white px-8 py-3 font-bold uppercase tracking-wider hover:bg-white hover:text-black transition-colors"
                    >
                        View All
                    </Link>
                </div>
            </div>
        </div>
    );
}
