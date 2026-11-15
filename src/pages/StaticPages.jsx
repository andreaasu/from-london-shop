import { Instagram, Facebook, Mail, ArrowUpRight } from 'lucide-react';

// About.jsx
export function About() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <h1 className="text-3xl font-black uppercase mb-6">About Us</h1>
            <p className="mb-4 text-gray-700 leading-relaxed">
                Welcome to From London. We bring you the latest fashion trends inspired by the energetic vibe of London.
                From everyday basics to standout seasonal pieces, we believe style should be accessible to everyone.
            </p>
            <p className="text-gray-700 leading-relaxed">
                Our mission is simple: Great fashion, affordable prices, and a shopping experience you'll love.
            </p>
        </div>
    );
}

// Contact.jsx
export function Contact() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <h1 className="text-3xl font-black uppercase mb-6">Contact Us</h1>
            <p className="text-gray-600 mb-8">Have a question about sizing or your order? Send us a message wherever you prefer.</p>
            <div className="space-y-3">
                {[
                    { label: 'Message us on Instagram', detail: '@therancystore', href: 'https://ig.me/m/therancystore', icon: Instagram },
                    { label: 'Message us on Facebook', detail: 'Chat with From London on Messenger', href: 'https://m.me/100071128491885', icon: Facebook },
                    { label: 'Email us', detail: 'storefromlondon@gmail.com', href: 'mailto:storefromlondon@gmail.com', icon: Mail },
                ].map(({ label, detail, href, icon: Icon }) => (
                    <a key={href} href={href} {...(href.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="group flex items-center gap-4 rounded-xl border border-gray-200 p-5 hover:border-black hover:bg-gray-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
                        <Icon size={24} className="shrink-0" aria-hidden="true" />
                        <span className="min-w-0 flex-1"><span className="block font-bold">{label}</span><span className="block text-sm text-gray-600 break-words mt-1">{detail}</span></span>
                        <ArrowUpRight size={20} className="shrink-0 text-gray-400 group-hover:text-black" aria-hidden="true" />
                    </a>
                ))}
            </div>
        </div>
    );
}

export function ReturnsPolicy() {
    return (
        <article className="container mx-auto px-4 py-12 max-w-2xl">
            <h1 className="text-3xl font-black uppercase mb-6">Inspection &amp; Returns Policy</h1>
            <p className="text-gray-700 leading-relaxed mb-8">At <strong>From London</strong>, we want you to shop with confidence.</p>
            <section className="mb-8">
                <h2 className="text-lg font-bold mb-3">Inspection Upon Delivery</h2>
                <p className="text-gray-700 leading-relaxed mb-4">Customers may inspect their order in the presence of the courier before accepting it, where permitted by the delivery company.</p>
                <p className="text-gray-700 leading-relaxed">Please check that the items, sizes, quantities, and condition match your order. If you receive an incorrect or damaged item, please notify us immediately.</p>
            </section>
            <section className="mb-8">
                <h2 className="text-lg font-bold mb-3">Returns &amp; Exchanges</h2>
                <p className="text-gray-700 leading-relaxed">Once an order has been accepted, all sales are considered final.</p>
            </section>
            <section>
                <h2 className="text-lg font-bold mb-3">Need Assistance?</h2>
                <p className="text-gray-700 leading-relaxed">Contact us at <a href="mailto:storefromlondon@gmail.com" className="underline text-brand-blue break-words">storefromlondon@gmail.com</a> for any concerns regarding your order.</p>
            </section>
        </article>
    );
}

// NotFound.jsx
import { Link } from 'react-router-dom';
export function NotFound() {
    return (
        <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-6xl font-black mb-4">404</h1>
            <p className="text-xl mb-8">Page not found</p>
            <Link to="/" className="underline text-lg">Go Home</Link>
        </div>
    );
}
