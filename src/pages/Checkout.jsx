import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { formatCurrency } from '../utils/formatCurrency';
import CartItem from '../components/features/CartItem';

export default function Checkout() {
    const { cartItems, subtotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        city: '',
        address: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);

    if (cartItems.length === 0) return <Navigate to="/bag" />;

    const shippingCost = subtotal > 1000 ? 0 : 50;
    const total = subtotal + shippingCost;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await orderService.placeOrder(formData, cartItems);
            clearCart();
            navigate('/order-confirmation', { state: { orderId: result.orderId, total: result.total } });
        } catch (err) {
            console.error(err);
            alert(err.message || 'Failed to place order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="container mx-auto px-4 py-8 md:py-12 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
                {/* Form */}
                <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold uppercase mb-6">Delivery Details</h2>
                    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Full Name</label>
                            <input required name="fullName" onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-black focus:border-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone Number</label>
                            <input required name="phone" type="tel" onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-black focus:border-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">City</label>
                            <input required name="city" onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-black focus:border-black" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Full Address (Building, Floor, Apt)</label>
                            <textarea required name="address" rows="3" onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-black focus:border-black"></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Order Notes (Optional)</label>
                            <textarea name="notes" rows="2" onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-black focus:border-black"></textarea>
                        </div>
                    </form>
                </div>

                {/* Summary */}
                <div>
                    <div className="bg-white p-6 md:p-8 rounded-lg shadow-sm sticky top-24">
                        <h3 className="text-lg font-bold uppercase mb-4">Your Order</h3>
                        <div className="max-h-60 overflow-y-auto mb-4 border-b border-gray-100">
                            {cartItems.map((item, idx) => (
                                <CartItem key={idx} item={item} editable={false} />
                            ))}
                        </div>

                        <div className="space-y-2 text-sm mb-4">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping</span>
                                <span>{shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}</span>
                            </div>
                        </div>

                        <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-4 mb-6">
                            <span>Total</span>
                            <span>{formatCurrency(total)}</span>
                        </div>

                        <button
                            type="submit"
                            form="checkout-form"
                            disabled={loading}
                            className="w-full bg-brand-blue text-white py-4 font-bold uppercase hover:brightness-90 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : `Place Order (COD)`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
