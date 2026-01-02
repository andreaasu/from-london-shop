import { Link } from 'react-router-dom';

const categories = [
    { name: 'Women', image: 'https://images.unsplash.com/photo-1525845859779-54d477ff291f?auto=format&fit=crop&q=80&w=600', link: '/shop?gender=women' },
    { name: 'Men', image: 'https://images.unsplash.com/photo-1516257984-b1b4d8c92305?auto=format&fit=crop&q=80&w=600', link: '/shop?gender=men' },
    { name: 'Kids', image: 'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=600', link: '/shop?gender=kids' },
    { name: 'Baby', image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600', link: '/shop?gender=baby' },
    { name: 'Footwear', image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=600', link: '/shop?category=footwear' },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=600', link: '/shop?category=accessories' },
];

export default function CategoryTiles() {
    return (
        <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold mb-8 text-center uppercase tracking-wider">Shop by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {categories.map((cat) => (
                        <Link key={cat.name} to={cat.link} className="group relative h-64 overflow-hidden rounded-lg">
                            <img
                                src={cat.image}
                                alt={cat.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-white text-2xl font-black uppercase tracking-widest border-2 border-white/50 px-6 py-2 backdrop-blur-sm group-hover:bg-white group-hover:text-black transition-all">
                                    {cat.name}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
