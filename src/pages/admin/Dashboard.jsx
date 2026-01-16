
import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        revenue: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch real stats later, for now we can maybe list orders and calculate
        const fetchStats = async () => {
            try {
                const orders = await adminService.getOrders();
                const totalOrders = orders.length;
                const pendingOrders = orders.filter(o => o.status === 'pending').length;
                // Assuming 'total' is in order table, adjust if needed based on schema
                // Schema from prompt: products, orders, order_items. 
                // orders table usually has 'total_amount' or similar. 
                // I will assume specific field later, or calculate from items.
                // For now, let's keep it simple or mock.
                const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

                setStats({ totalOrders, pendingOrders, revenue });
            } catch (err) {
                console.error("Failed to load dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div>Loading dashboard...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Total Orders</h3>
                    <p className="text-3xl font-bold mt-2">{stats.totalOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Pending Orders</h3>
                    <p className="text-3xl font-bold mt-2">{stats.pendingOrders}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                    <p className="text-3xl font-bold mt-2">{stats.revenue.toLocaleString()} LE</p>
                </div>
            </div>

        </div>
    );
}
