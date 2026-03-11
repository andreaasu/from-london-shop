import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-gray-100 text-gray-700 pt-12 pb-6 border-t border-gray-200 mt-auto">
            <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Column 1 */}
                <div>
                    <h3 className="font-bold text-lg mb-4 text-black">FROM LONDON</h3>
                    <p className="text-sm">Bringing you the latest trends at affordable prices. Fashion for everyone.</p>
                </div>

                {/* Column 2 */}
                <div>
                    <h4 className="font-bold mb-4 text-black">Help</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/contact" className="hover:underline">Contact Us</Link></li>
                        <li><Link to="/about" className="hover:underline">About Us</Link></li>
                        {/* <li><Link to="/faq" className="hover:underline">FAQs</Link></li> */}
                        {/* <li><Link to="/returns" className="hover:underline">Returns</Link></li> */}
                    </ul>
                </div>

                {/* Column 3 */}
                <div>
                    <h4 className="font-bold mb-4 text-black">Shop</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link to="/shop?gender=women" className="hover:underline">Women</Link></li>
                        <li><Link to="/shop?gender=men" className="hover:underline">Men</Link></li>
                        <li><Link to="/shop?gender=kids" className="hover:underline">Kids</Link></li>
                        <li><Link to="/shop?gender=baby" className="hover:underline">Baby</Link></li>
                    </ul>
                </div>

                {/* Column 4 */}
                <div>
                    {/* <h4 className="font-bold mb-4 text-black">Connect</h4> */}
                    <div className="flex space-x-4 mb-4">
                        {<a href="https://www.instagram.com/therancystore/" className="hover:text-black"><Instagram size={20} /></a>}
                        {<a href="https://www.facebook.com/profile.php?id=100071128491885" className="hover:text-black"><Facebook size={20} /></a>}
                        {/* <a href="#" className="hover:text-black"><Twitter size={20} /></a> */}
                    </div>
                    <p className="text-xs text-gray-500">&copy; {new Date().getFullYear()} From London. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
