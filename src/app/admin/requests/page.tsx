'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import StatusBadge from '@/components/admin/StatusBadge';
import OTPModal from '@/components/admin/OTPModal';
import { useAdmin } from '@/components/admin/AdminShell';

function RequestsContent() {
  const { user } = useAdmin();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [otpTarget, setOtpTarget] = useState<{ id: string; code: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const canApprove = user?.role === 'admin' || user?.role === 'super_admin';

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/logs?action=COUPON_REQUEST&action=COUPON_APPROVE&action=COUPON_REJECT');
      // Use Sanity directly via a dedicated endpoint
      const r2 = await fetch('/api/admin/requests');
      const data = await r2.json();
      setRequests(data.requests || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  async function handleReject(requestId: string) {
    setRejecting(true);
    try {
      await fetch('/api/admin/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action: 'reject', rejectionReason: rejectReason }),
      });
      setRejectTarget(null);
      setRejectReason('');
      fetchRequests();
    } finally {
      setRejecting(false);
    }
  }

  return (
    <>
      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Code', 'Type', 'Value', 'Requested By', 'Date', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>Loading...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>No requests found.</td></tr>
            ) : requests.map(r => {
              const cd = r.couponData || {};
              const isPending = r.status === 'pending' || r.status === 'otp_sent';
              return (
                <tr key={r._id} style={{ borderBottom: '1px solid var(--as-border)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--as-text)', fontFamily: 'monospace' }}>{cd.code || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--as-muted)', textTransform: 'capitalize' }}>{cd.type || '—'}</td>
                  <td style={{ padding: '10px 14px', color: 'var(--as-text)' }}>
                    {cd.type === 'percent' ? `${cd.value}%` : cd.value ? `₹${cd.value}` : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--as-text)' }}>
                    <div>{r.requestedByName}</div>
                    <div style={{ fontSize: 11, color: 'var(--as-muted)' }}>{r.requestedByEmployeeId}</div>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--as-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 14px' }}><StatusBadge status={r.status} /></td>
                  <td style={{ padding: '10px 14px' }}>
                    {isPending && canApprove ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => setOtpTarget({ id: r._id, code: cd.code })}
                          style={{ padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--as-badge-green)', color: 'var(--as-badge-green-text)', border: 'none', borderRadius: 5 }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectTarget(r._id)}
                          style={{ padding: '4px 10px', fontSize: 12, cursor: 'pointer', background: 'var(--as-badge-red)', color: 'var(--as-badge-red-text)', border: 'none', borderRadius: 5 }}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--as-muted)' }}>
                        {r.status === 'approved' ? `By ${r.resolvedByName}` : r.status === 'rejected' ? 'Rejected' : '—'}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* OTP Modal */}
      {otpTarget && (
        <OTPModal
          requestId={otpTarget.id}
          couponCode={otpTarget.code}
          onSuccess={() => { setOtpTarget(null); fetchRequests(); }}
          onClose={() => setOtpTarget(null)}
        />
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <>
          <div onClick={() => setRejectTarget(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 380, background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 12, zIndex: 301, padding: 28 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: 'var(--as-text)' }}>Reject Request</h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              rows={3}
              style={{ width: '100%', marginBottom: 16, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleReject(rejectTarget)} disabled={rejecting} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-badge-red-text)', color: '#fff', border: 'none', borderRadius: 6 }}>
                {rejecting ? '...' : 'Confirm Reject'}
              </button>
              <button onClick={() => setRejectTarget(null)} style={{ padding: '9px 16px', fontSize: 13, cursor: 'pointer', background: 'transparent', color: 'var(--as-muted)', border: '1px solid var(--as-border)', borderRadius: 6 }}>
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default function RequestsPage() {
  return (
    <AdminShell>
      <RequestsContent />
    </AdminShell>
  );
}
