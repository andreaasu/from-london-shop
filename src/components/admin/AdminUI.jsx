import { useEffect, useRef, useState } from 'react';
import { X, RefreshCw, PackageOpen } from 'lucide-react';
import { statusKey } from '../../utils/admin';

export function PageHeading({ eyebrow = 'Store management', title, description, children }) {
    return <div className="admin-heading"><div><p className="admin-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="admin-muted">{description}</p></div><div className="admin-actions">{children}</div></div>;
}
export function StatusBadge({ status }) { const value = statusKey(status); return <span className={`admin-badge badge-${value}`}>{value}</span>; }
export function DataState({ loading, error, reload }) {
    if (loading) return <div role="status" aria-label="Loading store data" className="space-y-4"><div className="admin-skeleton h-28"/><div className="admin-skeleton h-72"/></div>;
    if (error) return <div role="alert" className="admin-alert"><p>{error}</p><button className="admin-button" onClick={reload}><RefreshCw size={15}/>Try again</button></div>;
    return null;
}
export function EmptyState({ title = 'Nothing here yet', description = 'Try changing your search or filters.' }) { return <div className="admin-empty"><PackageOpen size={32}/><h3>{title}</h3><p>{description}</p></div>; }
export function Modal({ title, children, onClose, wide = false }) {
    const ref = useRef(null);
    const close = useRef(onClose);
    useEffect(() => { close.current = onClose; }, [onClose]);
    useEffect(() => {
        const previous = document.activeElement;
        const old = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        ref.current?.focus();
        const key = e => {
            if (ref.current !== [...document.querySelectorAll('[role="dialog"]')].at(-1)) return;
            if (e.key === 'Escape') close.current();
            if (e.key === 'Tab') {
                const nodes = [...ref.current.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')];
                const first = nodes[0], last = nodes.at(-1);
                if (!first) { e.preventDefault(); return; }
                if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        };
        document.addEventListener('keydown', key);
        return () => { document.removeEventListener('keydown', key); document.body.style.overflow = old; previous?.focus(); };
    }, []);
    return <div className="admin-modal-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(); }}><section ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`admin-modal ${wide ? 'modal-wide' : ''}`}><header className="no-print"><h2>{title}</h2><button aria-label="Close dialog" className="admin-icon-button" onClick={onClose}><X size={20}/></button></header>{children}</section></div>;
}
export function ConfirmDialog({ title, description, onConfirm, onClose, busy, error, destructive = false }) {
    return <Modal title={title} onClose={busy ? () => {} : onClose}><p className="admin-muted mb-6">{description}</p>{error && <p className="admin-alert" role="alert">{error}</p>}<div className="admin-actions justify-end"><button className="admin-button" disabled={busy} onClick={onClose}>Cancel</button><button disabled={busy} className={`admin-button ${destructive ? 'button-danger' : 'button-primary'}`} onClick={onConfirm}>{busy ? 'Saving…' : 'Confirm'}</button></div></Modal>;
}
export function PagedTable({ rows, columns, renderRow, emptyTitle }) {
    const [page, setPage] = useState(1);
    const pages = Math.max(1, Math.ceil(rows.length / 20));
    const current = Math.min(page, pages);
    return <div className="admin-panel overflow-hidden"><div className="admin-table-scroll"><table className="admin-table"><thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.slice((current - 1) * 20, current * 20).map(renderRow)}</tbody></table></div>{!rows.length && <EmptyState title={emptyTitle}/>}<footer className="admin-table-footer"><span>{rows.length} records · Page {current} of {pages}</span><div className="admin-actions"><button className="admin-button" disabled={current <= 1} onClick={() => setPage(current - 1)}>Previous</button><button className="admin-button" disabled={current >= pages} onClick={() => setPage(current + 1)}>Next</button></div></footer></div>;
}
