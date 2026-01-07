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

    const { orderId, orderCode, orderNo, total } = location.state || {};

    if (!orderId) return null;

    const displayOrderNumber = orderCode || `#${orderNo || orderId.slice(0, 8)}`;

    const copyToClipboard = () => {
        navigator.clipboard.writeText(displayOrderNumber);
        alert("Order number copied!");
    };

    return (
        <div className="container mx-auto px-4 py-20 text-center min-h-[60vh] flex flex-col items-center justify-center">
            <CheckCircle size={64} className="text-green-500 mb-6" />
            <h1 className="text-3xl font-black uppercase mb-2">Order Placed Successfully </h1>

            <div className="bg-gray-50 p-6 rounded-lg mb-8 w-full max-w-md border border-gray-100">
                <p className="text-gray-500 text-sm uppercase tracking-wider mb-1">Order Number</p>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-2xl font-bold font-mono">{displayOrderNumber}</span>
                    <button onClick={copyToClipboard} className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded transition-colors">
                        COPY
                    </button>
                </div>

                <div className="border-t border-gray-200 my-4"></div>

                <div className="flex justify-between items-center text-sm font-medium">
                    <span>Total Amount</span>
                    <span className="text-lg">{total ? `${total.toLocaleString()} EGP + Delivery Fees` : '---'}</span>
                </div>
            </div>

            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                <span className="font-bold block mb-2 text-black">What happens next?</span>
                We’ll contact you on WhatsApp or phone shortly to confirm your delivery details.
            </p>

            <button
                onClick={() => navigate('/', { replace: true })}
                className="bg-black text-white px-8 py-3 font-bold uppercase hover:bg-gray-800 w-full max-w-xs transition-all"
            >
                Continue Shopping
            </button>
        </div>
    );
}
