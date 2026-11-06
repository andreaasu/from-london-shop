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
            <div className="space-y-4 mb-8">
                <p><strong>Email:</strong> <a href="mailto:storefromlondon@gmail.com" className="underline text-brand-blue">storefromlondon@gmail.com</a></p>
            </div>

            {/* <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
                <input placeholder="Your Name" className="w-full border p-3 rounded" required />
                <input placeholder="Your Email" type="email" className="w-full border p-3 rounded" required />
                <textarea placeholder="Message" rows="4" className="w-full border p-3 rounded" required></textarea>
                <button className="bg-black text-white px-8 py-3 font-bold uppercase hover:bg-gray-800">Send Message</button>
            </form> */}
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
