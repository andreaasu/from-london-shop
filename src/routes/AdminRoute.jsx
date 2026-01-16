
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OWNER_EMAIL = 'andreaaziz83@gmail.com';

export default function AdminRoute() {
    const { user, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    if (user.email !== OWNER_EMAIL) {
        // Optionally sign out the user or show a dedicated access denied page
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                <div className="bg-white p-6 rounded-lg shadow-md text-center max-w-sm">
                    <h2 className="text-xl font-bold text-red-600 mb-2">Access Denied</h2>
                    <p className="text-gray-600 mb-4">You are not authorized to view this page.</p>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
                    >
                        Go to Shop
                    </button>
                </div>
            </div>
        );
    }

    return <Outlet />;
}
