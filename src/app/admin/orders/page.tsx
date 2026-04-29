'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import StatusBadge from '@/components/admin/StatusBadge';
import OrderDrawer from '@/components/admin/OrderDrawer';

const STATUS_FILTERS = ['', 'processing', 'shipped', 'in-transit', 'delivered', 'cancelled'];

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    try {
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const totalPages = Math.ceil(total / 20);

  return (
    <AdminShell>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search order #, name, email..."
          style={{ width: 260, padding: '8px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)' }}
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: '8px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)' }}
        >
          <option value="">All Statuses</option>
          {STATUS_FILTERS.slice(1).map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--as-muted)' }}>
          {total} order{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Order #', 'Date', 'Customer', 'Items', 'Amount', 'Payment', 'Status', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>No orders found.</td></tr>
            ) : orders.map(o => (
              <tr
                key={o._id}
                style={{ borderBottom: '1px solid var(--as-border)', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--as-table-row-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => setSelectedOrderId(o._id)}
              >
                <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--as-text)' }}>#{o.orderNumber}</td>
                <td style={{ padding: '10px 14px', color: 'var(--as-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(o.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--as-text)' }}>
                  <div>{o.customerName}</div>
                  <div style={{ fontSize: 11, color: 'var(--as-muted)' }}>{o.customerEmail}</div>
                </td>
                <td style={{ padding: '10px 14px', color: 'var(--as-muted)', textAlign: 'center' }}>{o.itemCount}</td>
                <td style={{ padding: '10px 14px', color: 'var(--as-text)', fontWeight: 500 }}>₹{o.total?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '10px 14px', color: 'var(--as-muted)', textTransform: 'capitalize' }}>{o.paymentMethod}</td>
                <td style={{ padding: '10px 14px' }}><StatusBadge status={o.status} /></td>
                <td style={{ padding: '10px 14px', color: 'var(--as-muted)', fontSize: 16 }}>›</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <PagBtn label="← Prev" disabled={page === 1} onClick={() => setPage(p => p - 1)} />
          <span style={{ fontSize: 13, color: 'var(--as-muted)', padding: '6px 12px' }}>
            {page} / {totalPages}
          </span>
          <PagBtn label="Next →" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} />
        </div>
      )}

      <OrderDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onUpdated={fetchOrders}
      />
    </AdminShell>
  );
}

function PagBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '6px 14px', fontSize: 13, cursor: 'pointer',
        border: '1px solid var(--as-border)', borderRadius: 6,
        background: 'var(--as-card)', color: 'var(--as-text)',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {label}
    </button>
  );
}
