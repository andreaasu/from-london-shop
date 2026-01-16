
import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await adminService.getOrders();
            setOrders(data);
        } catch (error) {
            // fail silently or show error
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await adminService.updateOrderStatus(id, status);
            loadOrders(); // Refresh
        } catch (err) {
            alert('Failed to update status');
        }
    };

    if (loading) return <div>Loading orders...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Orders</h2>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {orders.map(order => (
                            <>
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{order.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer_name || 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{order.total} LE</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateStatus(order.id, e.target.value)}
                                            className="border rounded text-xs p-1"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="confirmed">Confirmed</option>
                                            <option value="shipped">Shipped</option>
                                            <option value="delivered">Delivered</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {expandedOrder === order.id ? 'Hide' : 'View'}
                                        </button>
                                    </td>
                                </tr>
                                {expandedOrder === order.id && (
                                    <tr className="bg-gray-50">
                                        <td colSpan="6" className="px-6 py-4">
                                            <div className="text-sm">
                                                <h4 className="font-bold mb-2">Order Items:</h4>
                                                <ul className="list-disc pl-5">
                                                    {order.order_items?.map((item, i) => (
                                                        <li key={i}>
                                                            Product ID: {item.product_id} | Size: {item.size} | Qty: {item.quantity} | Price: {item.price}
                                                        </li>
                                                    ))}
                                                </ul>
                                                <div className="mt-2 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <strong>Phone:</strong> {order.phone}
                                                    </div>
                                                    <div>
                                                        <strong>Address:</strong> {order.address}, {order.city}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
