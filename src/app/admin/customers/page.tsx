'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/customers?${params}`);
      const data = await res.json();
      setCustomers(data.customers || []);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <AdminShell>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          style={{ width: 300, padding: '8px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)' }}
        />
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--as-muted)' }}>{customers.length} customers</div>
      </div>

      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Name', 'Email', 'Phone', 'Orders', 'Total Spent', 'Last Order'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>No customers found.</td></tr>
            ) : customers.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--as-border)' }}>
                <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--as-text)' }}>{c.name}</td>
                <td style={{ padding: '10px 14px', color: 'var(--as-muted)' }}>{c.email}</td>
                <td style={{ padding: '10px 14px', color: 'var(--as-muted)' }}>{c.phone || '—'}</td>
                <td style={{ padding: '10px 14px', color: 'var(--as-text)', textAlign: 'center' }}>{c.orderCount}</td>
                <td style={{ padding: '10px 14px', color: 'var(--as-text)', fontWeight: 500 }}>₹{c.totalSpent?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '10px 14px', color: 'var(--as-muted)', fontSize: 12 }}>
                  {c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-IN') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
