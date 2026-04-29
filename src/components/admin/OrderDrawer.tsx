'use client';

import { useState, useEffect } from 'react';
import StatusBadge from './StatusBadge';

const STATUS_OPTIONS = ['processing', 'shipped', 'in-transit', 'delivered', 'cancelled'];

interface Props {
  orderId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

export default function OrderDrawer({ orderId, onClose, onUpdated }: Props) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) { setOrder(null); return; }
    setLoading(true);
    setError('');
    fetch(`/api/admin/orders/${orderId}`)
      .then(r => r.json())
      .then(data => {
        if (data.order) {
          setOrder(data.order);
          setStatus(data.order.status || 'processing');
          setTrackingId(data.order.trackingId || '');
          setNotes(data.order.notes || '');
        }
      })
      .catch(() => setError('Failed to load order.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  async function handleSave() {
    if (!orderId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, trackingId, notes }),
      });
      if (!res.ok) throw new Error('Save failed');
      onUpdated();
      onClose();
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  if (!orderId) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          zIndex: 200, backdropFilter: 'blur(2px)',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
          background: 'var(--as-card)',
          borderLeft: '1px solid var(--as-border)',
          zIndex: 201, display: 'flex', flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--as-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text)' }}>
              {order ? `Order #${order.orderNumber}` : 'Loading...'}
            </div>
            {order && (
              <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 2 }}>
                {new Date(order.createdAt).toLocaleString('en-IN')}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--as-muted)', padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {loading ? (
            <div style={{ color: 'var(--as-muted)', fontSize: 13, textAlign: 'center', padding: 40 }}>Loading order...</div>
          ) : !order ? (
            <div style={{ color: 'var(--as-muted)', fontSize: 13, textAlign: 'center', padding: 40 }}>Order not found.</div>
          ) : (
            <>
              {/* Customer */}
              <Section title="Customer">
                <Field label="Name" value={order.customer?.name} />
                <Field label="Email" value={order.customer?.email} />
                <Field label="Phone" value={order.customer?.phone} />
              </Section>

              {/* Items */}
              <Section title="Items">
                {(order.items || []).map((item: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--as-border)', fontSize: 13, color: 'var(--as-text)' }}>
                    <span>{item.productName} — {item.size} / {item.color} × {item.quantity}</span>
                    <span style={{ color: 'var(--as-muted)' }}>₹{(item.priceINR * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 600, fontSize: 13, color: 'var(--as-text)' }}>
                  <span>Total</span>
                  <span>₹{order.total?.toLocaleString('en-IN')}</span>
                </div>
              </Section>

              {/* Payment */}
              <Section title="Payment">
                <Field label="Method" value={order.paymentMethod} />
                <Field label="Razorpay Order" value={order.razorpayOrderId} />
                <Field label="Payment ID" value={order.razorpayPaymentId} />
              </Section>

              {/* Shipping */}
              <Section title="Shipping Address">
                {order.shippingAddress && (
                  <div style={{ fontSize: 13, color: 'var(--as-text)', lineHeight: 1.6 }}>
                    {order.shippingAddress.line1}<br />
                    {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
                    {order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}
                  </div>
                )}
              </Section>

              {/* Edit */}
              <Section title="Update Order">
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Status
                  </label>
                  <select value={status} onChange={e => setStatus(e.target.value)}>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Tracking ID
                  </label>
                  <input
                    value={trackingId}
                    onChange={e => setTrackingId(e.target.value)}
                    placeholder="e.g. DTDC123456789"
                  />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Internal Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Internal notes..."
                    style={{ resize: 'vertical' }}
                  />
                </div>
                {error && <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', marginBottom: 8 }}>{error}</div>}
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        {order && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--as-border)', display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: 'var(--as-accent)', color: 'var(--as-bg)',
                border: 'none', borderRadius: 6, transition: 'opacity 0.12s',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                background: 'transparent', color: 'var(--as-muted)',
                border: '1px solid var(--as-border)', borderRadius: 6,
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--as-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--as-text)' }}>
      <span style={{ color: 'var(--as-muted)' }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}
