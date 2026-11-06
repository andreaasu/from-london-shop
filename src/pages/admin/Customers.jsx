import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAdminData } from '../../hooks/useAdminData';
import { customerHistory, money, date, orderNumber } from '../../utils/admin';
import { PageHeading, DataState, PagedTable, Modal, StatusBadge } from '../../components/admin/AdminUI';

export default function Customers() {
    const data = useAdminData();
    const [search, setSearch] = useState(''), [selected, setSelected] = useState(null);
    const customers = customerHistory(data.orders);
    const rows = customers.filter(c => `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase()));
    const customer = customers.find(c => c.key === selected);
    return <><PageHeading title="Customers" description="Get to know the people behind your orders. History is grouped by email, or phone when email is unavailable."/><DataState {...data}/>{!data.loading && !data.error && <><div className="admin-toolbar"><div className="admin-search"><Search size={16}/><input className="admin-input" placeholder="Search name, email or phone…" aria-label="Search customers" value={search} onChange={e => setSearch(e.target.value)}/></div><span className="admin-muted">{customers.length} customer histories</span></div><PagedTable rows={rows} columns={['Customer','Contact','Orders','Order value','Last order','Actions']} renderRow={c => <tr key={c.key}><td className="font-semibold">{c.name}</td><td>{c.email || 'No email'}<div className="admin-muted">{c.phone || 'No phone'}</div></td><td>{c.orders.length}</td><td>{money(c.total)}</td><td>{date(c.orders[0]?.created_at)}</td><td><button className="admin-button" onClick={() => setSelected(c.key)}>View history</button></td></tr>}/><p className="admin-muted mt-4">Order value excludes cancellations. This history does not create customer accounts or alter past orders.</p></>}{customer && <Modal title={customer.name} wide onClose={() => setSelected(null)}><p className="admin-muted mb-5">{customer.email} · {customer.phone || 'No phone'} · {money(customer.total)} in non-cancelled orders</p><div className="admin-table-scroll"><table className="admin-table"><thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>{customer.orders.map(o => <tr key={o.id}><td><Link className="admin-link" to={`/admin/orders?order=${encodeURIComponent(o.id)}`}>#{orderNumber(o)}</Link></td><td>{date(o.created_at)}</td><td>{money(o.total)}</td><td><StatusBadge status={o.status}/></td></tr>)}</tbody></table></div></Modal>}</>;
}
