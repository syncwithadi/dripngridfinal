'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import StatusBadge from '@/components/admin/StatusBadge';
import { useAdmin } from '@/components/admin/AdminShell';

const INPUT = { padding: '8px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)', width: '100%' } as React.CSSProperties;

function CouponsContent() {
  const { user } = useAdmin();
  const [tab, setTab] = useState<string>('list');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Define tabs based on role
  const availableTabs = ['list'];
  if (isSuperAdmin) {
    availableTabs.push('create', 'pending');
  } else {
    availableTabs.push('request');
  }


  // Request form state
  const [form, setForm] = useState({
    code: '', type: 'percent', value: '', maxDiscount: '', minOrder: '',
    maxUses: '', maxUsesPerUser: '1', expiresAt: '', description: '', isPublic: true,
    reason: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [c, r] = await Promise.all([
        fetch('/api/admin/coupons').then(x => x.json()),
        fetch('/api/admin/requests').then(x => x.json()),
      ]);
      setCoupons(c.coupons || []);
      setRequests(r.requests || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.value) { setError('Code and value are required.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/admin/coupons/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponData: {
            code: form.code.toUpperCase(),
            type: form.type,
            value: parseFloat(form.value),
            maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
            minOrder: form.minOrder ? parseFloat(form.minOrder) : 0,
            maxUses: form.maxUses ? parseInt(form.maxUses) : null,
            maxUsesPerUser: parseInt(form.maxUsesPerUser) || 1,
            expiresAt: form.expiresAt || null,
            description: form.description,
            isPublic: form.isPublic,
          },
          reason: form.reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to submit.'); return; }
      setSuccess('Request submitted! OTP sent to Super Admin for approval.');
      setForm({ code: '', type: 'percent', value: '', maxDiscount: '', minOrder: '', maxUses: '', maxUsesPerUser: '1', expiresAt: '', description: '', isPublic: true, reason: '' });
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch {
      setError('Submission failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInstantCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code || !form.value) { setError('Code and value are required.'); return; }
    setSubmitting(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create.'); return; }
      setSuccess('Coupon instantly created and active!');
      setForm({ code: '', type: 'percent', value: '', maxDiscount: '', minOrder: '', maxUses: '', maxUsesPerUser: '1', expiresAt: '', description: '', isPublic: true, reason: '' });
      fetchData();
      setTimeout(() => { setSuccess(''); setTab('list'); }, 1500);
    } catch {
      setError('Failed to create coupon.');
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(id: string, currentActive: boolean) {
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      });
      fetchData();
    } catch (err) { console.error(err); }
  }

  async function deleteCoupon(id: string) {
    if (!confirm('Are you sure you want to permanently delete this coupon?')) return;
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) { console.error(err); }
  }

  return (
    <>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, border: '1px solid var(--as-border)', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
        {availableTabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', fontSize: 13, fontWeight: tab === t ? 600 : 400,
              cursor: 'pointer', border: 'none',
              background: tab === t ? 'var(--as-accent)' : 'transparent',
              color: tab === t ? 'var(--as-bg)' : 'var(--as-muted)',
              transition: 'all 0.12s',
            }}
          >
            {t === 'list' && 'Active Coupons'}
            {t === 'request' && 'Request Coupon'}
            {t === 'create' && 'Create Coupon'}
            {t === 'pending' && 'Pending Requests'}
          </button>
        ))}
      </div>

      {tab === 'list' ? (
        <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Expires', 'Status', ...(isAdmin ? ['Actions'] : [])].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>Loading...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>No coupons yet.</td></tr>
              ) : coupons.map(c => {
                const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
                const exhausted = c.maxUses && c.usedCount >= c.maxUses;
                const statusVal = !c.active ? 'inactive' : expired || exhausted ? 'inactive' : 'active';
                return (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--as-border)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, color: 'var(--as-text)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{c.code}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--as-muted)', textTransform: 'capitalize' }}>{c.type}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--as-text)', fontWeight: 500 }}>
                      {c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}
                      {c.maxDiscount ? <span style={{ color: 'var(--as-muted)', fontSize: 11 }}> (max ₹{c.maxDiscount})</span> : ''}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--as-muted)' }}>{c.minOrder ? `₹${c.minOrder}` : '—'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--as-muted)' }}>
                      {c.usedCount || 0}{c.maxUses ? `/${c.maxUses}` : ''}
                    </td>
                    <td style={{ padding: '10px 14px', color: expired ? 'var(--as-badge-red-text)' : 'var(--as-muted)', fontSize: 12 }}>
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : '∞'}
                    </td>
                    <td style={{ padding: '10px 14px' }}><StatusBadge status={statusVal} /></td>
                    {isAdmin && (
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => toggleActive(c._id, c.active)} style={{ padding: '4px 8px', fontSize: 11, cursor: 'pointer', border: 'none', borderRadius: 4, background: c.active ? 'var(--as-badge-yellow)' : 'var(--as-badge-green)', color: c.active ? 'var(--as-badge-yellow-text)' : 'var(--as-badge-green-text)', fontWeight: 600 }}>
                            {c.active ? 'Disable' : 'Enable'}
                          </button>
                          <button onClick={() => deleteCoupon(c._id)} style={{ padding: '4px 8px', fontSize: 11, cursor: 'pointer', border: 'none', borderRadius: 4, background: 'var(--as-badge-red)', color: 'var(--as-badge-red-text)', fontWeight: 600 }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : tab === 'request' || tab === 'create' ? (
        /* Coupon form */
        <div style={{ maxWidth: 560 }}>
          <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, padding: 28, boxShadow: 'var(--as-shadow)' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600, color: 'var(--as-text)' }}>
              {tab === 'create' ? 'Instant Create Coupon' : 'Request New Coupon'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--as-muted)' }}>
              {tab === 'create' 
                ? 'Super Admins can create and activate coupons instantly.' 
                : 'Coupon requests require Super Admin approval via OTP before being activated.'}
            </p>
            <form onSubmit={tab === 'create' ? handleInstantCreate : handleRequest}>
              <Row label="Coupon Code">
                <input style={INPUT} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SUMMER20" required />
              </Row>
              <Row label="Type">
                <select style={INPUT} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </Row>
              <Row label={form.type === 'percent' ? 'Discount %' : 'Discount ₹'}>
                <input style={INPUT} type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder={form.type === 'percent' ? '20' : '200'} required min={1} />
              </Row>
              {form.type === 'percent' && (
                <Row label="Max Discount Cap (₹)">
                  <input style={INPUT} type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))} placeholder="Optional" min={0} />
                </Row>
              )}
              <Row label="Min Order Amount (₹)">
                <input style={INPUT} type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))} placeholder="0" min={0} />
              </Row>
              <Row label="Max Total Uses">
                <input style={INPUT} type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="Unlimited" min={1} />
              </Row>
              <Row label="Expires At">
                <input style={INPUT} type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
              </Row>
              <Row label="Description">
                <input style={INPUT} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Customer-facing description" />
              </Row>
              <Row label="Reason for Request">
                <textarea style={{ ...INPUT, resize: 'vertical' } as React.CSSProperties} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} placeholder="Why is this coupon needed?" />
              </Row>
              {error && <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', padding: '8px 12px', background: 'var(--as-badge-red)', borderRadius: 6, marginBottom: 14 }}>{error}</div>}
              {success && <div style={{ fontSize: 12, color: 'var(--as-badge-green-text)', padding: '8px 12px', background: 'var(--as-badge-green)', borderRadius: 6, marginBottom: 14 }}>{success}</div>}
              <button type="submit" disabled={submitting} style={{ width: '100%', padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 6, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : tab === 'create' ? 'Create Coupon Now' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      ) : tab === 'pending' ? (
        /* Admin view of pending requests */
        <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Code', 'Value', 'Requested By', 'Date', 'Status', 'Reason'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r._id} style={{ borderBottom: '1px solid var(--as-border)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--as-text)' }}>{r.couponData?.code}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--as-text)' }}>
                    {r.couponData?.type === 'percent' ? `${r.couponData.value}%` : `₹${r.couponData?.value}`}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--as-text)' }}>{r.requestedByName}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--as-muted)' }}>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: '10px 14px', color: 'var(--as-muted)', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '—'}</td>
                </tr>
              ))}
              {requests.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>No requests found.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : null}
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  );
}

export default function CouponsPage() {
  return <AdminShell><CouponsContent /></AdminShell>;
}
