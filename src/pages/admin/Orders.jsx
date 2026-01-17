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
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            alert('Failed to load orders');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await adminService.updateOrderStatus(id, status);
            loadOrders();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const getItemQty = (item) => item?.quantity ?? item?.qty ?? 1;
    const getItemPrice = (item) => item?.unit_price ?? item?.price ?? 0;

    const getItemProduct = (item) =>
        item?.product || item?.products || item?.product_ref || null;

    const getFirstImage = (item) => {
        const prod = getItemProduct(item);
        const imgs = prod?.images;
        if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
        if (typeof prod?.image === 'string' && prod.image) return prod.image;
        return null;
    };

    const getProductName = (item) => {
        const prod = getItemProduct(item);
        return prod?.name || `Product ${item?.product_id || ''}`;
    };

    const renderOrderItems = (order) => (
        <div className="bg-gray-50 px-4 py-4 md:px-6 rounded-b">
            <div className="text-sm">
                <h4 className="font-bold mb-3">Order Items:</h4>

                <div className="space-y-3">
                    {(order.order_items || []).map((item, i) => {
                        const img = getFirstImage(item);
                        const qty = getItemQty(item);
                        const price = getItemPrice(item);
                        const name = getProductName(item);

                        return (
                            <div
                                key={item.id || i}
                                className="flex items-center gap-3 bg-white border rounded p-3"
                            >
                                <div className="w-14 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                    <img
                                        src={img || 'https://via.placeholder.com/60x80?text=No+Image'}
                                        alt={name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className="flex-1">
                                    <div className="font-semibold text-sm md:text-base">{name}</div>
                                    <div className="text-xs md:text-sm text-gray-600">
                                        ID: {item.product_id} <br className="md:hidden" />
                                        Size: {item.size || '—'} | Qty: {qty} | Price: {price} LE
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <strong>Phone:</strong> {order.phone || '—'}
                    </div>
                    <div>
                        <strong>Address:</strong> {order.address || '—'}
                        {order.city ? `, ${order.city}` : ''}
                    </div>
                </div>
            </div>
        </div>
    );

    if (loading) return <div>Loading orders...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Orders</h2>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
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
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td colSpan={6} className="p-0">
                                    <div>
                                        <div className="grid grid-cols-6 items-center hover:bg-gray-50">
                                            <div className="px-6 py-4 whitespace-nowrap text-sm font-medium">{order.id}</div>
                                            <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                                            </div>
                                            <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer_name || 'N/A'}</div>
                                            <div className="px-6 py-4 whitespace-nowrap text-sm font-bold">{order.total ?? '—'} LE</div>
                                            <div className="px-6 py-4 whitespace-nowrap text-sm">
                                                <select
                                                    value={order.status || 'pending'}
                                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                                    className="border rounded text-xs p-1"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="delivered">Delivered</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </div>
                                            <div className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {expandedOrder === order.id ? 'Hide' : 'View'}
                                                </button>
                                            </div>
                                        </div>
                                        {expandedOrder === order.id && renderOrderItems(order)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-4">
                {orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-bold text-gray-900">Order #{order.id}</span>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900">{order.total ?? '—'} LE</span>
                            </div>

                            <div className="text-sm text-gray-700 mb-3">
                                <span className="text-gray-500">Customer:</span> {order.customer_name || 'N/A'}
                            </div>

                            <div className="flex justify-between items-center gap-2">
                                <select
                                    value={order.status || 'pending'}
                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                    className="border rounded text-sm p-1.5 flex-1 max-w-[140px]"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                <button
                                    onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                                    className="text-blue-600 font-medium text-sm px-2 py-1"
                                >
                                    {expandedOrder === order.id ? 'Hide Details' : 'View Details'}
                                </button>
                            </div>
                        </div>

                        {expandedOrder === order.id && (
                            <div className="border-t border-gray-100">
                                {renderOrderItems(order)}
                            </div>
                        )}
                    </div>
                ))}
                {!orders.length && !loading && (
                    <div className="text-center py-8 text-gray-500">No orders found.</div>
                )}
            </div>
        </div>
    );
}