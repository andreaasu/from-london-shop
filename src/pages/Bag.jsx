import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/features/CartItem';
import { formatCurrency } from '../utils/formatCurrency';

export default function Bag() {
    const { cartItems, subtotal } = useCart();

    if (cartItems.length === 0) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Your Bag is Empty</h1>
                <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
                <Link to="/shop" className="bg-black text-white px-8 py-3 font-bold uppercase hover:bg-gray-800">Start Shopping</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <h1 className="text-3xl font-black uppercase mb-8">Shopping Bag ({cartItems.length})</h1>

            <div className="flex flex-col lg:flex-row gap-12">
                {/* Items */}
                <div className="flex-1">
                    <div className="border-t border-gray-200">
                        {cartItems.map((item, idx) => (
                            // specific key using combination because id alone isn't unique for variants
                            <CartItem key={`${item.id}-${item.selectedSize}-${item.selectedColor}-${idx}`} item={item} />
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="lg:w-96">
                    <div className="bg-gray-50 p-6 rounded-lg sticky top-24">
                        <h2 className="text-lg font-bold mb-4 uppercase">Order Summary</h2>
                        <div className="space-y-3 text-sm mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-medium">Calculated next step</span>
                            </div>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-4 mb-6">
                            <span>Total</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>

                        <Link to="/checkout" className="block w-full bg-black text-white text-center py-4 font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors">
                            Checkout
                        </Link>
                        <div className="mt-4 text-xs text-center text-gray-500">
                            <p>We accept Cash on Delivery.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
