'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { useAdmin } from '@/components/admin/AdminShell';

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Active now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatJoined(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getOnlineStatus(lastActivityAt: string | null | undefined): 'online' | 'idle' | 'offline' {
  if (!lastActivityAt) return 'offline';
  const diff = Date.now() - new Date(lastActivityAt).getTime();
  if (diff < 5 * 60 * 1000) return 'online';
  if (diff < 30 * 60 * 1000) return 'idle';
  return 'offline';
}

// ── Action log colours (preserved from original) ──────────────────────────────
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

// ── Small reusable atoms ──────────────────────────────────────────────────────

function Avatar({ u, size = 40 }: { u: any; size?: number }) {
  const initials = (u.name || '?').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
  const grad =
    u.role === 'super_admin' ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' :
    u.role === 'admin'       ? 'linear-gradient(135deg,#0284c7,#38bdf8)' :
                               'linear-gradient(135deg,#059669,#34d399)';
  const r = Math.round(size * 0.25);
  if (u.profileImageUrl) {
    return (
      <img src={u.profileImageUrl} alt={u.name}
        style={{ width: size, height: size, borderRadius: r, objectFit: 'cover',
          border: '1.5px solid var(--as-border)', flexShrink: 0 }} />
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: r, background: grad, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.3), fontWeight: 700, color: '#fff',
      letterSpacing: '0.02em', userSelect: 'none' }}>
      {initials}
    </div>
  );
}

function StatusDot({ status }: { status: 'online' | 'idle' | 'offline' }) {
  const c = { online: '#22c55e', idle: '#f59e0b', offline: 'var(--as-muted)' }[status];
  const l = { online: 'Online', idle: 'Idle', offline: 'Offline' }[status];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, flexShrink: 0,
        boxShadow: status === 'online' ? `0 0 0 2px #22c55e33` : 'none' }} />
      <span style={{ fontSize: 12, color: c }}>{l}</span>
    </div>
  );
}

function AccessBadge({ role, forAdmin }: { role: string; forAdmin: boolean }) {
  if (forAdmin) {
    const cfg =
      role === 'super_admin' ? { label: 'Super Admin', bg: 'var(--as-badge-purple)',  text: 'var(--as-badge-purple-text)' } :
      role === 'admin'       ? { label: 'Core',        bg: 'var(--as-badge-blue)',    text: 'var(--as-badge-blue-text)'   } :
                               { label: 'Member',      bg: 'var(--as-badge-gray)',    text: 'var(--as-badge-gray-text)'   };
    return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
      background: cfg.bg, color: cfg.text, whiteSpace: 'nowrap' }}>{cfg.label}</span>;
  }
  const isCore = role === 'super_admin' || role === 'admin';
  return <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
    background: isCore ? 'var(--as-badge-blue)' : 'var(--as-badge-gray)',
    color: isCore ? 'var(--as-badge-blue-text)' : 'var(--as-badge-gray-text)',
    whiteSpace: 'nowrap' }}>{isCore ? 'Core Team' : 'Member'}</span>;
}

function StatCard({ label, value, accent, dot }: { label: string; value: number; accent?: string; dot?: string }) {
  return (
    <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10,
      padding: '16px 20px', minWidth: 110, flex: 1, boxShadow: 'var(--as-shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        {dot && <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }} />}
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: accent || 'var(--as-text)', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)',
        marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  );
}

const INP: React.CSSProperties = {
  padding: '8px 12px', fontSize: 13, border: '1px solid var(--as-input-border)',
  borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)', width: '100%',
};

function ActionBtn({ label, color, textColor, onClick, disabled, title }: {
  label: string; color: string; textColor: string;
  onClick: (e: React.MouseEvent) => void; disabled?: boolean; title?: string;
}) {
  return (
    <button onClick={e => { e.stopPropagation(); onClick(e); }} disabled={disabled} title={title}
      style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: color, color: textColor, border: 'none', borderRadius: 5,
        opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap' }}>
      {label}
    </button>
  );
}

// ── Existing modals (preserved exactly) ──────────────────────────────────────

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
    } finally { setLoading(false); }
  }, [targetUser.employeeId, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  const totalPages = Math.ceil(total / 25);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 520, maxWidth: '95vw',
        background: 'var(--as-card)', borderLeft: '1px solid var(--as-border)',
        zIndex: 401, display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 24px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--as-border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--as-text)' }}>Activity Log</div>
            <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 2 }}>
              {targetUser.name} ({targetUser.employeeId}) · {total} event{total !== 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--as-muted)' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
          {loading ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>Loading…</div>
          : logs.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>No activity found.</div>
          : logs.map(log => (
            <div key={log._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--as-border)',
              display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'start' }}>
              <div>
                <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  background: ACTION_COLORS[log.action] || 'var(--as-badge-gray)',
                  color: ACTION_TEXT[log.action] || 'var(--as-badge-gray-text)', marginBottom: 4 }}>
                  {log.action}
                </span>
                {log.details && <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 3 }}>{log.details}</div>}
                {log.ip && <div style={{ fontSize: 11, color: 'var(--as-muted)', marginTop: 2, opacity: 0.7 }}>IP: {log.ip}</div>}
              </div>
              <div style={{ fontSize: 11, color: 'var(--as-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
        {totalPages > 1 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--as-border)', display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
              style={{ padding: '5px 14px', fontSize: 12, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'var(--as-bg)', color: 'var(--as-text)', opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ fontSize: 12, color: 'var(--as-muted)', padding: '5px 10px' }}>{page}/{totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
              style={{ padding: '5px 14px', fontSize: 12, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'var(--as-bg)', color: 'var(--as-text)', opacity: page >= totalPages ? 0.4 : 1 }}>Next →</button>
          </div>
        )}
      </div>
    </>
  );
}

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
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempPassword: tempPass }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to reset password.'); return; }
      onSuccess();
    } finally { setLoading(false); }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 12,
        padding: 28, width: 360, maxWidth: '92vw', zIndex: 501, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--as-text)', marginBottom: 6 }}>Reset Password</div>
        <div style={{ fontSize: 13, color: 'var(--as-muted)', marginBottom: 20 }}>
          Set a temporary password for <strong>{targetUser.name}</strong>. They will be required to change it on next login.
        </div>
        <form onSubmit={handleSubmit}>
          <Field label="Temporary Password">
            <input style={INP} type="password" value={tempPass} onChange={e => setTempPass(e.target.value)}
              placeholder="Min. 6 characters" autoFocus required />
          </Field>
          {error && <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', padding: '8px 10px', background: 'var(--as-badge-red)', borderRadius: 6, marginTop: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'transparent', color: 'var(--as-text)' }}>Cancel</button>
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
  const [name, setName]             = useState(targetUser.name || '');
  const [department, setDepartment] = useState(targetUser.department || '');
  const [internalTitle, setInternal]= useState(targetUser.internalTitle || '');
  const [phone, setPhone]           = useState(targetUser.phone || '');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/admin/users/${targetUser._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), department: department.trim(), internalTitle: internalTitle.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to update.'); return; }
      onSuccess();
    } finally { setLoading(false); }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 12,
        padding: 28, width: 480, maxWidth: '94vw', zIndex: 501, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--as-text)' }}>Edit Profile</div>
            <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 3 }}>{targetUser.employeeId} · {targetUser.role?.replace('_', ' ')}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--as-muted)', fontSize: 18 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Full Name *">
            <input style={INP} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" autoFocus required />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Department">
              <input style={INP} value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Operations" />
            </Field>
            <Field label="Internal Title">
              <input style={INP} value={internalTitle} onChange={e => setInternal(e.target.value)} placeholder="e.g. Logistics Lead" />
            </Field>
          </div>
          <Field label="Phone">
            <input style={INP} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXXXXXXX" />
          </Field>
          {error && <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', padding: '8px 10px', background: 'var(--as-badge-red)', borderRadius: 6 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '9px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'transparent', color: 'var(--as-text)' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: '#fff', border: 'none', borderRadius: 6 }}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function UserAnalysisDrawer({ targetUser, onClose }: { targetUser: any; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/users/${targetUser._id}/analysis`)
      .then(r => r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [targetUser._id]);

  return (
    <>
      <div onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500 }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 640, maxWidth: '95vw',
        background: 'var(--as-card)', borderLeft: '1px solid var(--as-border)',
        zIndex: 501, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 32px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--as-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Avatar u={targetUser} size={48} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--as-text)', marginBottom: 2 }}>{targetUser.name}</div>
              <div style={{ fontSize: 13, color: 'var(--as-muted)' }}>
                {targetUser.employeeId} · <span style={{ textTransform: 'capitalize' }}>{targetUser.role?.replace('_', ' ')}</span>
                {targetUser.department && ` · ${targetUser.department}`}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: 'var(--as-muted)' }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--as-bg)' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--as-muted)' }}>Loading analysis…</div>
          ) : !data || data.error ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--as-badge-red-text)', background: 'var(--as-badge-red)', borderRadius: 12 }}>
              {data?.error || 'Failed to load analysis'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                              <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                                background: ACTION_COLORS[log.action] || 'var(--as-badge-gray)',
                                color: ACTION_TEXT[log.action] || 'var(--as-badge-gray-text)' }}>
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

// ── Create Member Modal ───────────────────────────────────────────────────────

function CreateMemberModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ employeeId: '', name: '', email: '', role: 'employee', tempPassword: '', department: '', internalTitle: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create user.'); return; }
      onSuccess();
    } finally { setLoading(false); }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 500 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 14,
        padding: 32, width: 600, maxWidth: '94vw', zIndex: 501, boxShadow: '0 12px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--as-text)' }}>Add Team Member</div>
            <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 3 }}>They'll be prompted to change their password on first login.</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--as-muted)', fontSize: 20 }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="ID *">
              <input style={INP} value={form.employeeId}
                onChange={e => setForm(f => ({ ...f, employeeId: e.target.value.toUpperCase() }))}
                placeholder="ID001" required />
            </Field>
            <Field label="Full Name *">
              <input style={INP} value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jane Doe" required />
            </Field>
            <Field label="Email *">
              <input style={INP} type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="jane@dripngrid.in" required />
            </Field>
            <Field label="System Access Role *">
              <select style={INP} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="employee">Member Access (Default)</option>
                <option value="admin">Admin Access (Manager)</option>
                <option value="super_admin">Super Admin (Full Access)</option>
              </select>
            </Field>
            <Field label="Job Title (Optional)">
              <input style={INP} value={form.internalTitle}
                onChange={e => setForm(f => ({ ...f, internalTitle: e.target.value }))}
                placeholder="e.g. Graphic Designer" />
            </Field>
            <Field label="Department (Optional)">
              <input style={INP} value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                placeholder="e.g. Creative" />
            </Field>
            <Field label="Phone (Optional)">
              <input style={INP} value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+91..." />
            </Field>
            <Field label="Temporary Password *">
              <input style={INP} type="password" value={form.tempPassword}
                onChange={e => setForm(f => ({ ...f, tempPassword: e.target.value }))}
                placeholder="Min. 8 characters" required minLength={8} />
            </Field>
          </div>
          {error && <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', padding: '8px 12px', background: 'var(--as-badge-red)', borderRadius: 6 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 7, background: 'transparent', color: 'var(--as-text)' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 2, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'var(--as-accent)', color: '#fff', border: 'none', borderRadius: 7 }}>
              {loading ? 'Creating…' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

// ── Member Side Panel ─────────────────────────────────────────────────────────

function MemberPanel({ u, isAdmin, isSuperAdmin, isSelf, onClose, onEdit, onActivity, onAnalysis, onReset, onToggleActive, onForceLogout, logoutingId }: {
  u: any; isAdmin: boolean; isSuperAdmin: boolean; isSelf: boolean;
  onClose: () => void; onEdit: () => void; onActivity: () => void; onAnalysis: () => void;
  onReset: () => void; onToggleActive: () => void; onForceLogout: () => void; logoutingId: string | null;
}) {
  const status = getOnlineStatus(u.lastActivityAt);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 360, maxWidth: '90vw',
        background: 'var(--as-card)', borderLeft: '1px solid var(--as-border)',
        zIndex: 201, display: 'flex', flexDirection: 'column', boxShadow: '-6px 0 28px rgba(0,0,0,0.18)' }}>

        {/* Header */}
        <div style={{ padding: '22px 22px 18px', borderBottom: '1px solid var(--as-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--as-muted)', fontSize: 18, lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Avatar u={u} size={64} />
              <span style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%',
                background: status === 'online' ? '#22c55e' : status === 'idle' ? '#f59e0b' : 'var(--as-muted)',
                border: '2px solid var(--as-card)' }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--as-text)', lineHeight: 1.2 }}>{u.name}</div>
              {u.internalTitle && <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 3 }}>{u.internalTitle}</div>}
              <div style={{ marginTop: 8 }}>
                <AccessBadge role={u.role} forAdmin={isAdmin} />
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {/* Meta grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {[
              { icon: '🪪', label: 'ID', val: u.employeeId },
              u.department ? { icon: '🏢', label: 'Department', val: u.department } : null,
              isAdmin ? { icon: '✉️', label: 'Email', val: u.email } : null,
              isAdmin && u.phone ? { icon: '📱', label: 'Phone', val: u.phone } : null,
              isAdmin ? { icon: '📅', label: 'Joined', val: formatJoined(u.createdAt) } : null,
            ].filter(Boolean).map((row: any) => (
              <div key={row.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{row.icon}</span>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{row.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--as-text)', marginTop: 1 }}>{row.val}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Status + activity */}
          <div style={{ background: 'var(--as-bg)', borderRadius: 8, padding: '12px 14px', marginBottom: 20,
            border: '1px solid var(--as-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <StatusDot status={status} />
              <span style={{ fontSize: 11, color: 'var(--as-muted)' }}>
                {u.lastActivityAt ? `Last seen ${timeAgo(u.lastActivityAt)}` : 'No activity'}
              </span>
            </div>
            {u.mustChangePassword && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--as-badge-yellow-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>⚠</span> Must change password
              </div>
            )}
            {!u.active && (
              <div style={{ marginTop: 8, fontSize: 11, color: 'var(--as-badge-red-text)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>🚫</span> Account disabled
              </div>
            )}
          </div>

          {/* Primary actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            <button onClick={onAnalysis} style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'var(--as-accent)', color: '#fff', border: 'none', borderRadius: 7, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📊</span> View Full Analysis
            </button>
            <button onClick={onActivity} style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              background: 'var(--as-bg)', color: 'var(--as-text)', border: '1px solid var(--as-border)', borderRadius: 7, textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📋</span> View Activity Log
            </button>
          </div>

          {/* Super admin controls */}
          {isSuperAdmin && !isSelf && (
            <div style={{ borderTop: '1px solid var(--as-border)', paddingTop: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase',
                letterSpacing: '0.06em', marginBottom: 10 }}>Admin Controls</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                <ActionBtn label="Edit Profile" color="var(--as-badge-blue)" textColor="var(--as-badge-blue-text)" onClick={onEdit} />
                <ActionBtn
                  label={u.active ? 'Disable' : 'Enable'}
                  color={u.active ? 'var(--as-badge-red)' : 'var(--as-badge-green)'}
                  textColor={u.active ? 'var(--as-badge-red-text)' : 'var(--as-badge-green-text)'}
                  onClick={onToggleActive}
                />
                <ActionBtn label="Reset Pwd" color="var(--as-badge-yellow)" textColor="var(--as-badge-yellow-text)" onClick={onReset} />
                <ActionBtn
                  label={logoutingId === u._id ? '…' : 'Force Out'}
                  color="var(--as-badge-red)" textColor="var(--as-badge-red-text)"
                  onClick={onForceLogout} disabled={logoutingId === u._id}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main page component ───────────────────────────────────────────────────────

function TeamContent() {
  const { user } = useAdmin();
  const isAdmin     = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin= user?.role === 'super_admin';

  const [users, setUsers]           = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  // Filters
  const [search, setSearch]         = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Panel / modal state
  const [panelUser, setPanelUser]   = useState<any>(null);
  const [activityUser, setActivityUser] = useState<any>(null);
  const [analysisUser, setAnalysisUser] = useState<any>(null);
  const [resetUser, setResetUser]   = useState<any>(null);
  const [editUser, setEditUser]     = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [logoutingId, setLogoutingId] = useState<string | null>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) { setUsers([]); return; }
      const data = await res.json();
      setUsers(data.users || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function toggleActive(u: any) {
    await fetch(`/api/admin/users/${u._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !u.active }),
    });
    fetchUsers();
    showToast(`${u.name} ${u.active ? 'disabled' : 'enabled'}.`);
  }

  async function forceLogout(u: any) {
    setLogoutingId(u._id);
    try {
      const res = await fetch(`/api/admin/users/${u._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceLogout: true }),
      });
      const data = await res.json();
      if (!res.ok) showToast(data.error || 'Force logout failed.', 'err');
      else showToast('User has been logged out of all sessions.');
    } finally { setLogoutingId(null); }
  }

  function isSelf(u: any) { return u.employeeId === user?.employeeId; }

  // Stats
  const stats = useMemo(() => {
    const online  = users.filter(u => getOnlineStatus(u.lastActivityAt) === 'online').length;
    const idle    = users.filter(u => getOnlineStatus(u.lastActivityAt) === 'idle').length;
    const offline = users.filter(u => getOnlineStatus(u.lastActivityAt) === 'offline').length;
    const core    = users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
    return { total: users.length, online, idle, offline, core };
  }, [users]);

  // Departments (for filter dropdown)
  const departments = useMemo(() =>
    Array.from(new Set(users.map(u => u.department).filter(Boolean))).sort(), [users]);

  // Filtered list
  const filtered = useMemo(() => {
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.employeeId?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q)
      );
    }
    if (filterDept)   list = list.filter(u => u.department === filterDept);
    if (filterRole)   list = list.filter(u => u.role === filterRole);
    if (filterStatus) {
      list = list.filter(u => getOnlineStatus(u.lastActivityAt) === filterStatus);
    }
    return list;
  }, [users, search, filterDept, filterRole, filterStatus]);

  const SEL: React.CSSProperties = { ...INP, width: 'auto', flex: '0 0 auto', minWidth: 130 };

  // Admin table columns
  const ADMIN_COLS = ['Member', 'Department', 'Access', 'Status', 'Activity', 'Joined', 'Controls'];
  // Member (employee) table columns
  const MEMBER_COLS = ['Member', 'Department', 'Access', 'Status', 'Activity'];
  const COLS = isAdmin ? ADMIN_COLS : MEMBER_COLS;

  return (
    <>
      {/* Modals */}
      {analysisUser && <UserAnalysisDrawer targetUser={analysisUser} onClose={() => setAnalysisUser(null)} />}
      {activityUser && <ActivityDrawer targetUser={activityUser} onClose={() => setActivityUser(null)} />}
      {resetUser    && <ResetPasswordModal targetUser={resetUser} onClose={() => setResetUser(null)} onSuccess={() => { setResetUser(null); setPanelUser(null); showToast(`Password reset for ${resetUser.name}.`); fetchUsers(); }} />}
      {editUser     && <EditUserModal targetUser={editUser} onClose={() => setEditUser(null)} onSuccess={() => { setEditUser(null); setPanelUser(null); showToast('Profile updated.'); fetchUsers(); }} />}
      {showCreate   && <CreateMemberModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); showToast('Team member created successfully.'); fetchUsers(); }} />}

      {/* Side panel */}
      {panelUser && (
        <MemberPanel
          u={panelUser}
          isAdmin={isAdmin}
          isSuperAdmin={isSuperAdmin}
          isSelf={isSelf(panelUser)}
          onClose={() => setPanelUser(null)}
          onEdit={() => { setEditUser(panelUser); }}
          onActivity={() => { setPanelUser(null); setActivityUser(panelUser); }}
          onAnalysis={() => { setPanelUser(null); setAnalysisUser(panelUser); }}
          onReset={() => { setResetUser(panelUser); }}
          onToggleActive={() => { toggleActive(panelUser); }}
          onForceLogout={() => { forceLogout(panelUser); }}
          logoutingId={logoutingId}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 500, zIndex: 600,
          background: toast.type === 'ok' ? 'var(--as-badge-green)' : 'var(--as-badge-red)',
          color: toast.type === 'ok' ? 'var(--as-badge-green-text)' : 'var(--as-badge-red-text)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--as-text)', margin: 0, lineHeight: 1.2 }}>Team</h1>
          <p style={{ fontSize: 13, color: 'var(--as-muted)', marginTop: 4, marginBottom: 0 }}>
            {isAdmin ? 'Manage your team members and their access' : 'Meet the crew building DRIPNGRID'}
          </p>
        </div>
        {isSuperAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowCreate(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', background: 'var(--as-accent)', color: '#fff', border: 'none', borderRadius: 7 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Add Member
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Online" value={stats.online} dot="#22c55e" accent="#22c55e" />
        <StatCard label="Idle" value={stats.idle} dot="#f59e0b" accent="#f59e0b" />
        <StatCard label="Offline" value={stats.offline} dot="var(--as-muted)" />
        {isAdmin && <StatCard label="Core Members" value={stats.core} accent="var(--as-accent)" />}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 180 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--as-muted)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, email…"
            style={{ ...INP, paddingLeft: 34 }} />
        </div>
        {departments.length > 0 && (
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)} style={SEL}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        {isAdmin && (
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={SEL}>
            <option value="">All Access Levels</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Core</option>
            <option value="employee">Member</option>
          </select>
        )}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={SEL}>
          <option value="">All Statuses</option>
          <option value="online">Online</option>
          <option value="idle">Idle</option>
          <option value="offline">Offline</option>
        </select>
        {(search || filterDept || filterRole || filterStatus) && (
          <button onClick={() => { setSearch(''); setFilterDept(''); setFilterRole(''); setFilterStatus(''); }}
            style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', border: '1px solid var(--as-border)',
              borderRadius: 6, background: 'transparent', color: 'var(--as-muted)' }}>
            Clear
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--as-muted)', marginLeft: 'auto' }}>
          {filtered.length} / {users.length} member{users.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 12,
        overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {COLS.map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '11px 16px', fontSize: 10.5, fontWeight: 600,
                  color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
                  background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={COLS.length} style={{ textAlign: 'center', padding: 52, color: 'var(--as-muted)', fontSize: 13 }}>
                Loading team…
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={COLS.length} style={{ textAlign: 'center', padding: 52, color: 'var(--as-muted)', fontSize: 13 }}>
                {search || filterDept || filterRole || filterStatus ? 'No members match your filters.' : 'No team members found.'}
              </td></tr>
            ) : filtered.map(u => {
              const status = getOnlineStatus(u.lastActivityAt);
              const self = isSelf(u);
              return (
                <tr key={u._id}
                  onClick={() => isAdmin && setPanelUser(u)}
                  style={{ borderBottom: '1px solid var(--as-border)',
                    cursor: isAdmin ? 'pointer' : 'default',
                    transition: 'background 0.1s ease' }}
                  onMouseEnter={e => { if (isAdmin) (e.currentTarget as HTMLElement).style.background = 'var(--as-table-row-hover)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>

                  {/* Member */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar u={u} size={38} />
                        <span style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%',
                          background: status === 'online' ? '#22c55e' : status === 'idle' ? '#f59e0b' : 'var(--as-muted)',
                          border: '2px solid var(--as-card)' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--as-text)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {u.name}
                          {self && <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
                            background: 'var(--as-accent-subtle)', color: 'var(--as-accent)' }}>You</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--as-muted)', marginTop: 2 }}>
                          {u.employeeId}
                          {u.internalTitle && <span style={{ marginLeft: 6, opacity: 0.8 }}>· {u.internalTitle}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td style={{ padding: '12px 16px', color: u.department ? 'var(--as-text-secondary)' : 'var(--as-muted)', fontSize: 12 }}>
                    {u.department || <span style={{ opacity: 0.4 }}>—</span>}
                  </td>

                  {/* Access */}
                  <td style={{ padding: '12px 16px' }}>
                    <AccessBadge role={u.role} forAdmin={isAdmin} />
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <StatusDot status={status} />
                      {!u.active && (
                        <span style={{ fontSize: 10, color: 'var(--as-badge-red-text)', fontWeight: 600 }}>Disabled</span>
                      )}
                    </div>
                  </td>

                  {/* Activity */}
                  <td style={{ padding: '12px 16px', color: 'var(--as-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                    {timeAgo(u.lastActivityAt)}
                  </td>

                  {/* Joined — admin only */}
                  {isAdmin && (
                    <td style={{ padding: '12px 16px', color: 'var(--as-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {formatJoined(u.createdAt)}
                    </td>
                  )}

                  {/* Controls — super_admin only, not self */}
                  {isAdmin && (
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      {isSuperAdmin && !self ? (
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <ActionBtn label="Activity" color="var(--as-badge-blue)" textColor="var(--as-badge-blue-text)"
                            onClick={() => setActivityUser(u)} />
                          <ActionBtn label="Edit" color="var(--as-badge-gray)" textColor="var(--as-badge-gray-text)"
                            onClick={() => setEditUser(u)} />
                          <ActionBtn
                            label={u.active ? 'Disable' : 'Enable'}
                            color={u.active ? 'var(--as-badge-red)' : 'var(--as-badge-green)'}
                            textColor={u.active ? 'var(--as-badge-red-text)' : 'var(--as-badge-green-text)'}
                            onClick={() => toggleActive(u)} />
                        </div>
                      ) : isSuperAdmin && self ? (
                        <ActionBtn label="Activity" color="var(--as-badge-blue)" textColor="var(--as-badge-blue-text)"
                          onClick={() => setActivityUser(u)} />
                      ) : (
                        <ActionBtn label="Activity" color="var(--as-badge-blue)" textColor="var(--as-badge-blue-text)"
                          onClick={() => setActivityUser(u)} />
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function TeamPage() {
  return <AdminShell><TeamContent /></AdminShell>;
}
