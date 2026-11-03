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
        email: '',
        city: '',
        address: '',
        notes: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    if (!orderPlaced && cartItems.length === 0) return <Navigate to="/bag" />;

    // const shippingCost = subtotal > 1000 ? 0 : 50;
    // const total = subtotal + shippingCost;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setError('');
        setLoading(true);

        try {
            const result = await orderService.placeOrder(formData, cartItems);
            setOrderPlaced(true);
            navigate('/order-confirmation', {
                state: {
                    orderId: result.orderId,
                    orderCode: result.orderCode,
                    orderNo: result.orderNo,
                    total: result.total
                },
                replace: true
            });
            clearCart();
        } catch (err) {
            console.error(err);
            setError(err.message || 'We could not place your order. Please try again.');
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
                    <h1 className="text-xl font-bold uppercase mb-6">Delivery Details</h1>
                    {error && <div role="alert" className="mb-4 border border-red-200 bg-red-50 text-red-800 p-4 rounded">{error} Your bag and delivery details have been kept.</div>}
                    <form aria-busy={loading} id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium mb-1">Full Name</label>
                            <input required id="fullName" name="fullName" autoComplete="name" value={formData.fullName} disabled={loading} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-black focus:border-black" />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone Number</label>
                            <input required id="phone" name="phone" autoComplete="tel" value={formData.phone} disabled={loading} type="tel" onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-black focus:border-black" />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                            <input required id="email" name="email" autoComplete="email" value={formData.email} disabled={loading} type="email" onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-black focus:border-black" />
                        </div>

                        <div>
                            <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
                            <input required id="city" name="city" autoComplete="address-level2" value={formData.city} disabled={loading} onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-black focus:border-black" />
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium mb-1">Full Address (Building, Floor, Apt)</label>
                            <textarea required id="address" name="address" autoComplete="street-address" value={formData.address} disabled={loading} rows="3" onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-black focus:border-black"></textarea>
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium mb-1">Order Notes (Optional)</label>
                            <textarea id="notes" name="notes" autoComplete="off" value={formData.notes} disabled={loading} rows="2" onChange={handleChange} className="w-full border border-gray-300 p-2 rounded focus:ring-black focus:border-black"></textarea>
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
                                <span>80 - 100 EGP (Based on location)</span>
                            </div>
                        </div>

                        <div className="flex justify-between text-xl font-bold border-t border-gray-200 pt-4 mb-2">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 text-right">
                            *Delivery fees (80-100 EGP) will be added to your total upon delivery.
                        </p>

                        <p className="text-sm text-gray-600 mb-4">Pay with cash when your order arrives.</p>
                        <button
                            type="submit"
                            form="checkout-form"
                            disabled={loading}
                            className="w-full bg-brand-blue text-white py-4 font-bold uppercase hover:brightness-90 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : `Place Order (Cash on Delivery)`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
