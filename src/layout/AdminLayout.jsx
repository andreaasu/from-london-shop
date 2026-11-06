import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Boxes, Users, Settings, LogOut, ArrowUpRight, Menu, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AdminDataContext, useAdminSource } from '../hooks/useAdminData';
import './admin.css';

const navigation = [
    ['/admin', 'Overview', LayoutDashboard], ['/admin/products', 'Products', Package],
    ['/admin/orders', 'Orders', ShoppingBag], ['/admin/inventory', 'Inventory', Boxes],
    ['/admin/customers', 'Customers', Users], ['/admin/settings', 'Settings', Settings],
];
export default function AdminLayout() {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const data = useAdminSource();
    const section = navigation.find(([path]) => path !== '/admin' && location.pathname.startsWith(path))?.[1] || 'Overview';
    return <AdminDataContext.Provider value={data}><div className="admin-shell">
        {open && <button className="admin-sidebar-overlay" aria-label="Close navigation" onClick={() => setOpen(false)}/>}
        <aside className={`admin-sidebar ${open ? 'sidebar-open' : ''}`}>
            <Link to="/admin" className="admin-brand" onClick={() => setOpen(false)}><span className="admin-brand-symbol">FL<span>•</span></span><span>FROM LONDON<small>COMMERCE STUDIO</small></span></Link>
            <button className="admin-mobile-close" aria-label="Close navigation" onClick={() => setOpen(false)}><X/></button>
            <p className="admin-nav-label">WORKSPACE</p><nav aria-label="Admin navigation">{navigation.map(([path, label, Icon]) => <NavLink key={path} to={path} end={path === '/admin'} onClick={() => setOpen(false)} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}><Icon size={19}/>{label}</NavLink>)}</nav>
            <div className="admin-sidebar-bottom"><Link to="/" className="admin-nav-link">View storefront<ArrowUpRight size={17}/></Link><button className="admin-nav-link w-full" onClick={async () => { try { await signOut(); navigate('/admin/login'); } catch { setError('Unable to sign out. Try again.'); } }}><LogOut size={18}/>Sign out</button>{error && <p role="alert">{error}</p>}<div className="admin-store-status"><span/>From London · EGP</div></div>
        </aside>
        <div className="admin-workspace"><header className="admin-topbar"><div className="admin-actions"><button className="admin-icon-button md:hidden" aria-label="Open navigation" onClick={() => setOpen(true)}><Menu/></button><span className="admin-muted">Workspace</span><span className="text-slate-300">/</span><strong>{section}</strong></div><div className="admin-actions"><button className="admin-icon-button" aria-label="Refresh store data" onClick={data.reload}><RefreshCw size={17}/></button><span className="admin-avatar" title={user?.email}>{user?.email?.slice(0, 2).toUpperCase() || 'FL'}</span><span className="hidden sm:block text-xs"><strong>Store owner</strong><br/><span className="admin-muted">Administrator</span></span></div></header>
        <main className="admin-main"><Outlet/></main><footer className="admin-workspace-footer">From London <span>Store operations · Africa/Cairo</span></footer></div>
    </div></AdminDataContext.Provider>;
}
