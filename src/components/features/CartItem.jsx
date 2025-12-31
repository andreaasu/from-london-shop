import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/formatCurrency';
import { Link } from 'react-router-dom';

export default function CartItem({ item, editable = true }) {
    const { updateQuantity, removeFromCart } = useCart();
    const image = item.images?.[0] || 'https://via.placeholder.com/100';

    if (!editable) {
        return (
            <div className="flex py-4">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-gray-200">
                    <img src={image} alt={item.name} className="h-full w-full object-cover object-center" />
                </div>
                <div className="ml-4 flex flex-1 flex-col">
                    <div className="flex justify-between text-sm font-medium text-gray-900">
                        <h3 className="line-clamp-1">{item.name}</h3>
                        <p className="ml-4">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">{item.selectedColor} | {item.selectedSize} | Qty {item.quantity}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex py-6 border-b border-gray-100 last:border-0">
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                <Link to={`/product/${item.id}`}>
                    <img src={image} alt={item.name} className="h-full w-full object-cover object-center" />
                </Link>
            </div>

            <div className="ml-4 flex flex-1 flex-col justify-between">
                <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3><Link to={`/product/${item.id}`}>{item.name}</Link></h3>
                        <p className="ml-4">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{item.selectedColor}</p>
                    <p className="mt-1 text-sm text-gray-500">Size: {item.selectedSize}</p>
                </div>
                <div className="flex flex-1 items-end justify-between text-sm">
                    <div className="flex items-center border border-gray-300 rounded">
                        <button
                            onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, -1)}
                            className="p-1 hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                        >
                            <Minus size={14} />
                        </button>
                        <span className="px-2 font-medium">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.id, item.selectedSize, item.selectedColor, 1)}
                            className="p-1 hover:bg-gray-100 text-gray-600"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <button
                        type="button"
                        className="font-medium text-red-600 hover:text-red-500 flex items-center gap-1"
                        onClick={() => removeFromCart(item.id, item.selectedSize, item.selectedColor)}
                    >
                        <Trash2 size={16} /> <span className="hidden sm:inline">Remove</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
