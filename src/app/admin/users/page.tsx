'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import StatusBadge from '@/components/admin/StatusBadge';
import { useAdmin } from '@/components/admin/AdminShell';

const INPUT: React.CSSProperties = {
  padding: '8px 12px', fontSize: 13, border: '1px solid var(--as-input-border)',
  borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)', width: '100%',
};

// ─── Activity Drawer ─────────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'var(--as-badge-green)', LOGOUT: 'var(--as-badge-gray)',
  ORDER_UPDATE: 'var(--as-badge-blue)', COUPON_REQUEST: 'var(--as-badge-yellow)',
  COUPON_APPROVE: 'var(--as-badge-green)', COUPON_REJECT: 'var(--as-badge-red)',
  COUPON_CREATE: 'var(--as-badge-green)', INVENTORY_UPDATE: 'var(--as-badge-blue)',
  USER_CREATE: 'var(--as-badge-blue)', USER_UPDATE: 'var(--as-badge-blue)',
  USER_DISABLE: 'var(--as-badge-red)', USER_FORCE_LOGOUT: 'var(--as-badge-red)',
  USER_PASSWORD_RESET: 'var(--as-badge-yellow)', PASSWORD_CHANGE: 'var(--as-badge-yellow)',
  OTP_SEND: 'var(--as-badge-blue)', OTP_VERIFY: 'var(--as-badge-green)', OTP_FAIL: 'var(--as-badge-red)',
};
const ACTION_TEXT: Record<string, string> = {
  LOGIN: 'var(--as-badge-green-text)', LOGOUT: 'var(--as-badge-gray-text)',
  ORDER_UPDATE: 'var(--as-badge-blue-text)', COUPON_REQUEST: 'var(--as-badge-yellow-text)',
  COUPON_APPROVE: 'var(--as-badge-green-text)', COUPON_REJECT: 'var(--as-badge-red-text)',
  COUPON_CREATE: 'var(--as-badge-green-text)', INVENTORY_UPDATE: 'var(--as-badge-blue-text)',
  USER_CREATE: 'var(--as-badge-blue-text)', USER_UPDATE: 'var(--as-badge-blue-text)',
  USER_DISABLE: 'var(--as-badge-red-text)', USER_FORCE_LOGOUT: 'var(--as-badge-red-text)',
  USER_PASSWORD_RESET: 'var(--as-badge-yellow-text)', PASSWORD_CHANGE: 'var(--as-badge-yellow-text)',
  OTP_SEND: 'var(--as-badge-blue-text)', OTP_VERIFY: 'var(--as-badge-green-text)', OTP_FAIL: 'var(--as-badge-red-text)',
};

function ActivityDrawer({ targetUser, onClose }: { targetUser: any; onClose: () => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ employeeId: targetUser.employeeId, page: String(page) });
      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [targetUser.employeeId, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / 25);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, maxWidth: '95vw',
        background: 'var(--as-card)', borderLeft: '1px solid var(--as-border)',
        zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--as-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--as-text)' }}>Activity Log</div>
            <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 2 }}>
              {targetUser.name} ({targetUser.employeeId}) · {total} event{total !== 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--as-muted)', lineHeight: 1 }}>✕</button>
        </div>

        {/* Log list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>Loading…</div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>No activity found.</div>
          ) : logs.map(log => (
            <div key={log._id} style={{
              padding: '12px 0', borderBottom: '1px solid var(--as-border)',
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'start',
            }}>
              <div>
                <span style={{
                  display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: ACTION_COLORS[log.action] || 'var(--as-badge-gray)',
                  color: ACTION_TEXT[log.action] || 'var(--as-badge-gray-text)',
                  marginBottom: 4,
                }}>
                  {log.action}
                </span>
                {log.details && (
                  <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 3 }}>{log.details}</div>
                )}
                {log.ip && (
                  <div style={{ fontSize: 11, color: 'var(--as-muted)', marginTop: 2, opacity: 0.7 }}>IP: {log.ip}</div>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--as-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--as-border)', display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
              style={{ padding: '5px 14px', fontSize: 12, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'var(--as-bg)', color: 'var(--as-text)', opacity: page === 1 ? 0.4 : 1 }}>
              ← Prev
            </button>
            <span style={{ fontSize: 12, color: 'var(--as-muted)', padding: '5px 10px' }}>{page}/{totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
              style={{ padding: '5px 14px', fontSize: 12, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'var(--as-bg)', color: 'var(--as-text)', opacity: page >= totalPages ? 0.4 : 1 }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Reset Password Modal ─────────────────────────────────────────────────────
function ResetPasswordModal({ targetUser, onClose, onSuccess }: { targetUser: any; onClose: () => void; onSuccess: () => void }) {
  const [tempPass, setTempPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (tempPass.length < 6) { setError('Must be at least 6 characters.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/users/${targetUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempPassword: tempPass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to reset password.'); return; }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 12,
        padding: 28, width: 360, maxWidth: '92vw', zIndex: 301, boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--as-text)', marginBottom: 6 }}>Reset Password</div>
        <div style={{ fontSize: 13, color: 'var(--as-muted)', marginBottom: 20 }}>
          Set a temporary password for <strong>{targetUser.name}</strong>. They will be required to change it on next login.
        </div>
        <form onSubmit={handleSubmit}>
          <Field label="Temporary Password">
            <input
              style={INPUT}
              type="password"
              value={tempPass}
              onChange={e => setTempPass(e.target.value)}
              placeholder="Min. 6 characters"
              autoFocus
              required
            />
          </Field>
          {error && (
            <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', padding: '8px 10px', background: 'var(--as-badge-red)', borderRadius: 6, marginTop: 10 }}>{error}</div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'transparent', color: 'var(--as-text)' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-badge-yellow)', color: 'var(--as-badge-yellow-text)', border: 'none', borderRadius: 6 }}>
              {loading ? 'Saving…' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function EditUserModal({ targetUser, onClose, onSuccess }: { targetUser: any; onClose: () => void; onSuccess: () => void }) {
  const [name, setName]               = useState(targetUser.name || '');
  const [department, setDepartment]   = useState(targetUser.department || '');
  const [internalTitle, setInternal]  = useState(targetUser.internalTitle || '');
  const [phone, setPhone]             = useState(targetUser.phone || '');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/users/${targetUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          department: department.trim(),
          internalTitle: internalTitle.trim(),
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to update.'); return; }
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  const inp: React.CSSProperties = { ...INPUT, marginBottom: 0 };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 12,
        padding: 28, width: 480, maxWidth: '94vw', zIndex: 301, boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--as-text)' }}>Edit Staff Profile</div>
            <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 3 }}>{targetUser.employeeId} · {targetUser.role?.replace('_',' ')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--as-muted)', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Full Name *">
            <input style={inp} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" autoFocus required />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Department">
              <input style={inp} value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Operations" />
            </Field>
            <Field label="Internal Title">
              <input style={inp} value={internalTitle} onChange={e => setInternal(e.target.value)} placeholder="e.g. Logistics Lead" />
            </Field>
          </div>

          <Field label="Phone">
            <input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXXXXXXX" />
          </Field>

          {error && <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', padding: '8px 10px', background: 'var(--as-badge-red)', borderRadius: 6 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'transparent', color: 'var(--as-text)' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 6 }}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ─── User Analysis Drawer ─────────────────────────────────────────────────────
function UserAnalysisDrawer({ targetUser, onClose }: { targetUser: any; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${targetUser._id}/analysis`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [targetUser._id]);

  return (
    <>
      <div onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 640, maxWidth: '95vw',
        background: 'var(--as-card)', borderLeft: '1px solid var(--as-border)',
        zIndex: 401, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.25)',
      }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--as-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: 'linear-gradient(135deg, var(--as-accent), #38bdf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700, color: '#fff'
            }}>
              {(targetUser.name || '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--as-text)', marginBottom: 2 }}>{targetUser.name}</div>
              <div style={{ fontSize: 13, color: 'var(--as-muted)' }}>
                {targetUser.employeeId} · <span style={{ textTransform: 'capitalize' }}>{targetUser.role?.replace('_', ' ')}</span>
                {targetUser.department && ` · ${targetUser.department}`}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--as-muted)', lineHeight: 1 }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--as-bg)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--as-muted)' }}>Loading analysis…</div>
          ) : !data || data.error ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--as-badge-red-text)', background: 'var(--as-badge-red)', borderRadius: 12 }}>
              {data?.error || 'Failed to load analysis'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{ background: 'var(--as-card)', padding: 18, borderRadius: 12, border: '1px solid var(--as-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Time Logged</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--as-text)', marginBottom: 4 }}>
                    {data.stats.hoursWorked} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--as-muted)' }}>hrs active</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--as-muted)' }}>Across {data.stats.sessionsCount} recent sessions</div>
                </div>

                <div style={{ background: 'var(--as-card)', padding: 18, borderRadius: 12, border: '1px solid var(--as-border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Task Completion</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--as-text)', marginBottom: 4 }}>
                    {data.stats.tasksCompleted} <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--as-muted)' }}>done</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--as-muted)' }}>{data.stats.tasksPending} tasks pending</div>
                </div>
              </div>

              {/* Recent Changes Log */}
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--as-text)', marginBottom: 12, marginTop: 8 }}>Recent Action Log</h3>
                <div style={{ background: 'var(--as-card)', borderRadius: 12, border: '1px solid var(--as-border)', overflow: 'hidden' }}>
                  {data.recentWork?.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--as-muted)', fontSize: 13 }}>No recent working actions logged.</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <tbody>
                        {data.recentWork?.map((log: any) => (
                          <tr key={log._id} style={{ borderBottom: '1px solid var(--as-border)' }}>
                            <td style={{ padding: '12px 16px', verticalAlign: 'top', width: '35%' }}>
                              <div style={{ fontSize: 11, color: 'var(--as-muted)', marginBottom: 4 }}>
                                {new Date(log.timestamp).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <span style={{
                                display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                                background: ACTION_COLORS[log.action] || 'var(--as-badge-gray)',
                                color: ACTION_TEXT[log.action] || 'var(--as-badge-gray-text)',
                              }}>
                                {log.action}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--as-text)' }}>
                              <div style={{ fontWeight: 500 }}>{log.details || 'Performed action'}</div>
                              {log.entity && <div style={{ fontSize: 11, color: 'var(--as-muted)', marginTop: 2 }}>Entity: {log.entity}</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function UsersContent() {
  const { user } = useAdmin();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ employeeId: '', name: '', email: '', role: 'employee', tempPassword: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Super Admin action state
  const [activityUser, setActivityUser] = useState<any>(null);
  const [resetUser, setResetUser] = useState<any>(null);
  const [editUser, setEditUser] = useState<any>(null);
  const [analysisUser, setAnalysisUser] = useState<any>(null);
  const [logoutingId, setLogoutingId] = useState<string | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create user.'); return; }
      setSuccess(`User ${form.name} (${form.employeeId}) created. They must change their password on first login.`);
      setForm({ employeeId: '', name: '', email: '', role: 'employee', tempPassword: '' });
      setShowCreate(false);
      fetchUsers();
    } finally {
      setCreating(false);
    }
  }

  async function toggleActive(userId: string, currentActive: boolean) {
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !currentActive }),
    });
    fetchUsers();
  }

  async function forceLogout(userId: string) {
    setLogoutingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceLogout: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSuccess('');
        setError(data.error || 'Failed to force logout.');
      } else {
        setError('');
        setSuccess('User has been logged out of all sessions.');
        setTimeout(() => setSuccess(''), 4000);
      }
    } finally {
      setLogoutingId(null);
    }
  }

  // Check if a user row is "self" — compare by employeeId (since user.employeeId is what we have)
  function isSelf(u: any) {
    return u.employeeId === user?.employeeId;
  }

  return (
    <>
      {/* Analysis Drawer */}
      {analysisUser && (
        <UserAnalysisDrawer targetUser={analysisUser} onClose={() => setAnalysisUser(null)} />
      )}

      {/* Activity Drawer */}
      {activityUser && (
        <ActivityDrawer targetUser={activityUser} onClose={() => setActivityUser(null)} />
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <ResetPasswordModal
          targetUser={resetUser}
          onClose={() => setResetUser(null)}
          onSuccess={() => {
            setResetUser(null);
            setSuccess(`Password reset for ${resetUser.name}. They must change it on next login.`);
            setTimeout(() => setSuccess(''), 5000);
            fetchUsers();
          }}
        />
      )}

      {/* Edit User Modal */}
      {editUser && (
        <EditUserModal
          targetUser={editUser}
          onClose={() => setEditUser(null)}
          onSuccess={() => {
            setEditUser(null);
            setSuccess(`Updated profile for ${editUser.employeeId}.`);
            setTimeout(() => setSuccess(''), 3000);
            fetchUsers();
          }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--as-muted)' }}>{users.length} user{users.length !== 1 ? 's' : ''}</div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 6 }}
          >
            {showCreate ? 'Cancel' : '+ New User'}
          </button>
        )}
      </div>

      {success && (
        <div style={{ fontSize: 12, color: 'var(--as-badge-green-text)', padding: '10px 14px', background: 'var(--as-badge-green)', borderRadius: 8, marginBottom: 16 }}>
          {success}
        </div>
      )}
      {error && (
        <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', padding: '10px 14px', background: 'var(--as-badge-red)', borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Create User Form */}
      {showCreate && (
        <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, padding: 24, marginBottom: 24, boxShadow: 'var(--as-shadow)' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 14, fontWeight: 600, color: 'var(--as-text)' }}>Create New User</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Field label="Employee ID">
                <input style={INPUT} value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value.toUpperCase() }))} placeholder="EMP001" required />
              </Field>
              <Field label="Full Name">
                <input style={INPUT} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" required />
              </Field>
              <Field label="Email">
                <input style={INPUT} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@dripngrid.in" required />
              </Field>
              <Field label="Role">
                <select style={INPUT} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </Field>
              <Field label="Temporary Password">
                <input style={INPUT} type="password" value={form.tempPassword} onChange={e => setForm(f => ({ ...f, tempPassword: e.target.value }))} placeholder="Min. 8 characters" required minLength={8} />
              </Field>
            </div>
            {error && (
              <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', padding: '8px 12px', background: 'var(--as-badge-red)', borderRadius: 6, marginBottom: 12 }}>{error}</div>
            )}
            <button type="submit" disabled={creating}
              style={{ padding: '9px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 6 }}>
              {creating ? 'Creating...' : 'Create User'}
            </button>
          </form>
        </div>
      )}

      {/* Users Table */}
      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Employee', 'Email', 'Role', 'Last Login', 'Status', ...(isSuperAdmin ? ['Actions'] : [])].map(h => (
                <th key={h} style={{
                  textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600,
                  color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>Loading...</td></tr>
            ) : users.map(u => (
              <tr 
                key={u._id} 
                onClick={() => setAnalysisUser(u)}
                style={{ borderBottom: '1px solid var(--as-border)', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--as-hover)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                {/* Employee */}
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Avatar — photo if uploaded, initials otherwise */}
                    {u.profileImageUrl ? (
                      <img
                        src={u.profileImageUrl}
                        alt={u.name}
                        style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          objectFit: 'cover', border: '1px solid var(--as-border)',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: u.role === 'super_admin'
                          ? 'linear-gradient(135deg,#6366f1,#8b5cf6)'
                          : u.role === 'admin'
                          ? 'linear-gradient(135deg,#0ea5e9,#38bdf8)'
                          : 'linear-gradient(135deg,#10b981,#34d399)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#fff',
                        letterSpacing: '0.03em', userSelect: 'none',
                      }}>
                        {(u.name || '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: 500, color: 'var(--as-text)', fontSize: 13 }}>{u.name}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--as-muted)', marginTop: 1 }}>
                        {u.employeeId}
                        {u.department && <span style={{ marginLeft: 5, opacity: 0.7 }}>· {u.department}</span>}
                        {u.internalTitle && <span style={{ marginLeft: 5, opacity: 0.7 }}>· {u.internalTitle}</span>}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Email */}
                <td style={{ padding: '10px 14px', color: 'var(--as-muted)', fontSize: 12 }}>{u.email}</td>

                {/* Role */}
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--as-text)', textTransform: 'capitalize' }}>
                    {u.role?.replace('_', ' ')}
                  </span>
                </td>

                {/* Last Login */}
                <td style={{ padding: '10px 14px', color: 'var(--as-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                  {u.lastLogin
                    ? new Date(u.lastLogin).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Never'}
                </td>

                {/* Status */}
                <td style={{ padding: '10px 14px' }}>
                  <StatusBadge status={u.active ? 'active' : 'inactive'} />
                  {u.mustChangePassword && (
                    <span style={{ fontSize: 10, color: 'var(--as-badge-yellow-text)', marginLeft: 6 }}>⚠ must reset</span>
                  )}
                </td>

                {/* Super Admin Actions */}
                {isSuperAdmin && (
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* View Activity — available for all users including self */}
                      <ActionBtn
                        label="Activity"
                        color="var(--as-badge-blue)"
                        textColor="var(--as-badge-blue-text)"
                        onClick={() => setActivityUser(u)}
                        title="View activity log"
                      />

                      {/* Actions only for other users (not self) */}
                      {!isSelf(u) && (
                        <>
                          {/* Edit User */}
                          <ActionBtn
                            label="Edit"
                            color="var(--as-badge-blue)"
                            textColor="var(--as-badge-blue-text)"
                            onClick={() => setEditUser(u)}
                            title="Edit user profile"
                          />

                          {/* Enable / Disable */}
                          <ActionBtn
                            label={u.active ? 'Disable' : 'Enable'}
                            color={u.active ? 'var(--as-badge-red)' : 'var(--as-badge-green)'}
                            textColor={u.active ? 'var(--as-badge-red-text)' : 'var(--as-badge-green-text)'}
                            onClick={() => toggleActive(u._id, u.active)}
                          />

                          {/* Reset Password */}
                          <ActionBtn
                            label="Reset Pwd"
                            color="var(--as-badge-yellow)"
                            textColor="var(--as-badge-yellow-text)"
                            onClick={() => setResetUser(u)}
                            title="Set a temporary password"
                          />

                          {/* Force Logout */}
                          <ActionBtn
                            label={logoutingId === u._id ? '…' : 'Force Out'}
                            color="var(--as-badge-red)"
                            textColor="var(--as-badge-red-text)"
                            onClick={() => forceLogout(u._id)}
                            disabled={logoutingId === u._id}
                            title="Immediately invalidate all active sessions"
                          />
                        </>
                      )}
                    </div>
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ActionBtn({ label, color, textColor, onClick, disabled, title }: {
  label: string; color: string; textColor: string;
  onClick: () => void; disabled?: boolean; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        padding: '4px 9px', fontSize: 11, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        background: color, color: textColor, border: 'none', borderRadius: 5,
        opacity: disabled ? 0.6 : 1, whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

export default function UsersPage() {
  return <AdminShell><UsersContent /></AdminShell>;
}
