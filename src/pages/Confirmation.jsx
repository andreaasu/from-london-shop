import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export default function Confirmation() {
    // We could pass order ID via state to show "Order #123"
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!location.state?.orderId) {
            navigate('/', { replace: true });
        }
    }, [location, navigate]);

    if (!location.state?.orderId) return null;

    return (
        <div className="container mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
            <CheckCircle size={64} className="text-green-500 mb-6" />
            <h1 className="text-3xl font-black uppercase mb-4">Order Placed Successfully!</h1>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Thank you for shopping with From London. Your order has been received and will be shipped shortly.
                <br /><br />
                <strong>Payment Method: Cash on Delivery</strong>
                <br />
                Please have the exact amount ready when our courier arrives.
            </p>
            <button
                onClick={() => navigate('/', { replace: true })}
                className="bg-black text-white px-8 py-3 font-bold uppercase hover:bg-gray-800"
            >
                Continue Shopping
            </button>
        </div>
    );
}
