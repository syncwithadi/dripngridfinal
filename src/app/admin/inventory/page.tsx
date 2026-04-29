'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { useAdmin } from '@/components/admin/AdminShell';

function InventoryContent() {
  const { user } = useAdmin();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editSizes, setEditSizes] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const isEmployee = user?.role === 'employee';

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (lowStockOnly) params.set('lowStock', 'true');
    try {
      const res = await fetch(`/api/admin/inventory?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
    } finally {
      setLoading(false);
    }
  }, [search, lowStockOnly]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function startEdit(product: any) {
    setEditing(product._id);
    setEditSizes(product.sizes?.map((s: any) => ({ ...s })) || []);
  }

  async function saveEdit(productId: string) {
    setSaving(true);
    try {
      await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, sizes: editSizes }),
      });
      setSaved(productId);
      setTimeout(() => setSaved(null), 2000);
      setEditing(null);
      fetchProducts();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          style={{ width: 260, padding: '8px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)' }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--as-text)', cursor: 'pointer' }}>
          <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)} style={{ width: 'auto' }} />
          Low stock only (≤5)
        </label>
        <div style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--as-muted)' }}>{products.length} products</div>
      </div>

      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Product', 'Category', 'Sizes & Stock', ...(isEmployee ? [] : ['Actions'])].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>No products found.</td></tr>
            ) : products.map(p => (
              <tr key={p._id} style={{ borderBottom: '1px solid var(--as-border)' }}>
                <td style={{ padding: '12px 14px', fontWeight: 500, color: 'var(--as-text)' }}>{p.name}</td>
                <td style={{ padding: '12px 14px', color: 'var(--as-muted)' }}>{p.category || '—'}</td>
                <td style={{ padding: '12px 14px' }}>
                  {editing === p._id ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {editSizes.map((s, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          <span style={{ color: 'var(--as-muted)' }}>{s.size}:</span>
                          <input
                            type="number"
                            value={s.stock ?? 0}
                            min={0}
                            onChange={e => {
                              const updated = [...editSizes];
                              updated[i] = { ...s, stock: parseInt(e.target.value) || 0 };
                              setEditSizes(updated);
                            }}
                            style={{ width: 56, padding: '4px 8px', textAlign: 'center', fontSize: 13 }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {(p.sizes || []).map((s: any, i: number) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 12, padding: '2px 8px', borderRadius: 4,
                            border: '1px solid var(--as-border)',
                            background: (s.stock ?? 0) <= 5 ? 'var(--as-badge-red)' : 'transparent',
                            color: (s.stock ?? 0) <= 5 ? 'var(--as-badge-red-text)' : 'var(--as-text)',
                          }}
                        >
                          {s.size}: {s.stock ?? 0}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                {!isEmployee && (
                  <td style={{ padding: '12px 14px' }}>
                    {editing === p._id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => saveEdit(p._id)}
                          disabled={saving}
                          style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 5 }}
                        >
                          {saving ? '...' : saved === p._id ? '✓' : 'Save'}
                        </button>
                        <button
                          onClick={() => setEditing(null)}
                          style={{ padding: '5px 10px', fontSize: 12, cursor: 'pointer', background: 'transparent', color: 'var(--as-muted)', border: '1px solid var(--as-border)', borderRadius: 5 }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(p)}
                        style={{ padding: '5px 12px', fontSize: 12, cursor: 'pointer', background: 'transparent', color: 'var(--as-text)', border: '1px solid var(--as-border)', borderRadius: 5 }}
                      >
                        Edit Stock
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function InventoryPage() {
  return (
    <AdminShell>
      <InventoryContent />
    </AdminShell>
  );
}
