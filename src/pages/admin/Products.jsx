import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Star } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { useAdminData } from '../../hooks/useAdminData';
import { PageHeading, DataState, PagedTable, ConfirmDialog } from '../../components/admin/AdminUI';
import { money, stockTotal } from '../../utils/admin';

export default function Products() {
    const data = useAdminData();
    const { products, threshold } = data;
    const [search, setSearch] = useState(''), [gender, setGender] = useState(''), [stock, setStock] = useState(''), [sort, setSort] = useState('newest');
    const [selected, setSelected] = useState([]), [confirm, setConfirm] = useState(null), [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
    const [bulkPrice, setBulkPrice] = useState('');
    const [featuring, setFeaturing] = useState(null);
    const toggleFeatured = async product => {
        setFeaturing(product.id); setError('');
        try { await adminService.updateProduct(product.id,{ is_featured:!product.is_featured }); data.reload(); }
        catch (err) { setError(err.message); }
        finally { setFeaturing(null); }
    };
    const rows = products.filter(p => `${p.name} ${p.id} ${p.sku || ''}`.toLowerCase().includes(search.toLowerCase()) && (!gender || p.gender === gender) && (!stock || (stock === 'out' ? stockTotal(p) === 0 : stock === 'low' ? stockTotal(p) > 0 && stockTotal(p) <= threshold : stockTotal(p) > threshold))).sort((a,b) => sort === 'name' ? a.name.localeCompare(b.name) : sort === 'price-up' ? a.price-b.price : sort === 'price-down' ? b.price-a.price : sort === 'stock' ? stockTotal(a)-stockTotal(b) : new Date(b.created_at)-new Date(a.created_at));
    const toggle = id => setSelected(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids,id]);
    const run = async () => {
        setBusy(true); setError(''); setNotice('');
        try {
            const ids = confirm.id ? [confirm.id] : selected;
            const results = [];
            for (const id of ids) { try { if (confirm.type === 'delete') await adminService.deleteProduct(id); else await adminService.updateProduct(id, { price: Number(bulkPrice) }); results.push({ id, ok: true }); } catch (err) { results.push({ id, error: err.message }); } }
            const failed = results.filter(r => !r.ok);
            setSelected(failed.map(r => r.id));
            setNotice(`${results.length-failed.length} product(s) updated.`);
            if (failed.length) setError(failed.map(r => `${r.id}: ${r.error}`).join(' '));
            data.reload(); setConfirm(null);
        } finally { setBusy(false); }
    };
    return <><PageHeading title="Products" description={`${products.length} products. Thoughtfully manage every detail of your catalogue.`}><Link className="admin-button button-primary" to="/admin/products/new"><Plus size={16}/>Add product</Link></PageHeading><DataState {...data}/>
        {error && <div className="admin-alert" role="alert">{error}</div>}{notice && <div className="admin-notice" role="status">{notice}</div>}
        {!data.loading && !data.error && <><div className="admin-toolbar"><div className="admin-search"><Search size={16}/><input className="admin-input" aria-label="Search products" placeholder="Search products, SKU or ID…" value={search} onChange={e => setSearch(e.target.value)}/></div><select aria-label="Category" className="admin-select" value={gender} onChange={e => setGender(e.target.value)}><option value="">All categories</option>{[...new Set(products.map(p => p.gender).filter(Boolean))].map(g => <option key={g}>{g}</option>)}</select><select aria-label="Stock filter" className="admin-select" value={stock} onChange={e => setStock(e.target.value)}><option value="">All stock</option><option value="in">Healthy stock</option><option value="low">Low total stock</option><option value="out">Out of stock</option></select><select aria-label="Sort products" className="admin-select" value={sort} onChange={e => setSort(e.target.value)}><option value="newest">Newest first</option><option value="name">Name A–Z</option><option value="price-up">Price: low to high</option><option value="price-down">Price: high to low</option><option value="stock">Lowest stock</option></select></div>
        {!!selected.length && <div className="admin-notice admin-actions"><strong>{selected.length} selected</strong><input className="admin-input w-32" type="number" min="0" step="0.01" aria-label="Bulk price in EGP" placeholder="New price EGP" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)}/><button className="admin-button" disabled={bulkPrice === '' || Number(bulkPrice) < 0} onClick={() => setConfirm({ type: 'price' })}>Set price</button><button className="admin-button" onClick={() => setConfirm({ type: 'delete' })}>Delete selected</button><button className="admin-link" onClick={() => setSelected([])}>Clear</button></div>}
        <label className="admin-muted admin-actions mb-3"><input className="admin-check" type="checkbox" checked={rows.length > 0 && rows.every(p => selected.includes(p.id))} onChange={e => setSelected(e.target.checked ? rows.map(p => p.id) : [])}/>Select all {rows.length} filtered products</label>
        <PagedTable rows={rows} columns={['Select','Product','Category','Price','Inventory','Actions']} emptyTitle="No matching products" renderRow={p => <tr key={p.id}><td><input aria-label={`Select ${p.name}`} className="admin-check" type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)}/></td><td><Link to={`/admin/products/${encodeURIComponent(p.id)}`} className="admin-product-cell"><img className="admin-product-image" src={p.images?.[0] || '/placeholder.svg'} alt=""/><div><strong>{p.name}</strong><small>{p.sku || p.id}</small></div></Link></td><td className="capitalize">{p.gender}</td><td><strong>{money(p.price)}</strong>{p.oldPrice > p.price && <div className="admin-muted line-through">{money(p.oldPrice)}</div>}</td><td><span className={`admin-badge ${stockTotal(p) === 0 ? 'badge-out' : stockTotal(p) <= threshold ? 'badge-low' : 'badge-in-stock'}`}>{stockTotal(p)} units</span><div className="mt-1">{Object.entries(p.stock_by_size || {}).map(([size,q]) => <span key={size} className="admin-stock-chip">{size}: {q}</span>)}</div></td><td><div className="admin-actions">{p.is_featured !== undefined && <button className="admin-icon-button" aria-label={`${p.is_featured ? 'Remove' : 'Add'} ${p.name} ${p.is_featured ? 'from' : 'to'} Featured Picks`} aria-pressed={p.is_featured} disabled={featuring !== null} title={p.is_featured ? 'Remove from Featured Picks' : 'Add to Featured Picks'} onClick={() => toggleFeatured(p)}><Star size={17} fill={p.is_featured ? '#f2b544' : 'none'} color={p.is_featured ? '#d99918' : 'currentColor'}/></button>}<Link aria-label={`Edit ${p.name}`} className="admin-icon-button" to={`/admin/products/${encodeURIComponent(p.id)}`}><Pencil size={16}/></Link><button aria-label={`Delete ${p.name}`} className="admin-icon-button" onClick={() => setConfirm({ type:'delete', id:p.id })}><Trash2 size={16}/></button></div></td></tr>}/></>}
        {confirm && <ConfirmDialog title={confirm.type === 'delete' ? 'Delete products?' : 'Update selected prices?'} description={confirm.type === 'delete' ? 'Products used in historical orders will be protected. This permanently deletes eligible products; bulk results are reported individually.' : `Set the price of ${selected.length} products to ${money(bulkPrice)}. Stock and historical order prices stay unchanged.`} busy={busy} destructive={confirm.type === 'delete'} onClose={() => setConfirm(null)} onConfirm={run}/>}</>;
}
