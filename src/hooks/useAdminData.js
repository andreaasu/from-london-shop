import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { adminService } from '../services/adminService';
export const AdminDataContext = createContext(null);
export const useAdminData = () => useContext(AdminDataContext);
export function useAdminSource() {
    const [data, setData] = useState({ products: [], orders: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [version, setVersion] = useState(0);
    const [threshold, setThreshold] = useState(() => { try { return Math.max(0, Number(localStorage.getItem('admin-low-stock') ?? 5)) || 0; } catch { return 5; } });
    const reload = useCallback(() => { setLoading(true); setVersion(v => v + 1); }, []);
    useEffect(() => {
        let active = true;
        Promise.all([adminService.getProducts(), adminService.getOrders()]).then(([products, orders]) => {
            if (active) { setData({ products, orders }); setError(''); }
        }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [version]);
    return { ...data, loading, error, reload, threshold, setThreshold };
}
