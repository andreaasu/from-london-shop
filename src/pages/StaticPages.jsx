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
                <p><strong>Email:</strong> andreaaziz83@gmail.com</p>
                <p><strong>Phone:</strong> +20 1224982556</p>
                {/* <p><strong>WhatsApp:</strong> <a href="#" className="underline text-brand-blue">Chat with us</a></p> */}
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
