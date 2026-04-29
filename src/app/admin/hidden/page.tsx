'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminShell, { useAdmin } from '@/components/admin/AdminShell';
import StatusBadge from '@/components/admin/StatusBadge';

function HiddenDataContent() {
  const { user } = useAdmin();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchHiddenOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch orders that have visibility == "hidden"
      // This uses the existing admin orders API — super_admin sees hidden orders too
      const res = await fetch('/api/admin/orders?status=');
      const data = await res.json();
      // Filter client-side to show only hidden ones (backend returns all for super_admin)
      const hidden = (data.orders || []).filter((o: any) => o.visibility === 'hidden');
      setOrders(hidden);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHiddenOrders();
  }, [fetchHiddenOrders]);

  const toggleVisibility = async (docId: string, currentVisibility: string) => {
    setToggling(docId);
    try {
      const newVisibility = currentVisibility === 'hidden' ? 'public' : 'hidden';
      const res = await fetch('/api/admin/hide-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, visibility: newVisibility }),
      });
      if ((await res.json()).success) {
        // Remove from list if unhidden
        if (newVisibility === 'public') {
          setOrders(prev => prev.filter(o => o._id !== docId));
        }
      }
    } catch {
      // silently fail
    } finally {
      setToggling(null);
    }
  };

  if (user?.role !== 'super_admin') {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--as-muted)', fontSize: 14 }}>
        🔒 Hidden data access is restricted to super admins.
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: 'var(--as-muted)', margin: 0 }}>
          Orders and documents hidden from admin/employee views. Only you can see and manage these.
        </p>
      </div>

      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Order', 'Customer', 'Amount', 'Status', 'Payment', 'Action'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--as-muted)' }}>Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--as-muted)' }}>No hidden documents found.</td></tr>
            ) : orders.map(o => (
              <tr key={o._id} style={{ borderBottom: '1px solid var(--as-border)' }}>
                <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--as-text)' }}>#{o.orderNumber}</td>
                <td style={{ padding: '10px 12px', color: 'var(--as-muted)' }}>{o.customerName}</td>
                <td style={{ padding: '10px 12px', color: 'var(--as-text)' }}>₹{o.total?.toLocaleString('en-IN')}</td>
                <td style={{ padding: '10px 12px' }}><StatusBadge status={o.status} /></td>
                <td style={{ padding: '10px 12px' }}><StatusBadge status={o.paymentStatus} /></td>
                <td style={{ padding: '10px 12px' }}>
                  <button
                    onClick={() => toggleVisibility(o._id, 'hidden')}
                    disabled={toggling === o._id}
                    style={{
                      padding: '4px 10px', fontSize: 11, fontWeight: 600,
                      background: 'var(--as-badge-green)', color: 'var(--as-badge-green-text)',
                      border: 'none', borderRadius: 4, cursor: 'pointer',
                      opacity: toggling === o._id ? 0.5 : 1,
                    }}
                  >
                    {toggling === o._id ? '...' : '👁️ Unhide'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function HiddenDataPage() {
  return (
    <AdminShell>
      <HiddenDataContent />
    </AdminShell>
  );
}
