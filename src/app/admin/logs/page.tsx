'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';

const ACTION_TYPES = [
  '', 'LOGIN', 'LOGOUT', 'ORDER_UPDATE', 'COUPON_REQUEST', 'COUPON_APPROVE',
  'COUPON_REJECT', 'COUPON_CREATE', 'INVENTORY_UPDATE', 'USER_CREATE',
  'USER_UPDATE', 'USER_DISABLE', 'USER_FORCE_LOGOUT', 'USER_PASSWORD_RESET',
  'PASSWORD_CHANGE', 'OTP_SEND', 'OTP_VERIFY', 'OTP_FAIL',
];

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'var(--as-badge-green)',
  LOGOUT: 'var(--as-badge-gray)',
  ORDER_UPDATE: 'var(--as-badge-blue)',
  COUPON_REQUEST: 'var(--as-badge-yellow)',
  COUPON_APPROVE: 'var(--as-badge-green)',
  COUPON_REJECT: 'var(--as-badge-red)',
  COUPON_CREATE: 'var(--as-badge-green)',
  INVENTORY_UPDATE: 'var(--as-badge-blue)',
  USER_CREATE: 'var(--as-badge-blue)',
  USER_UPDATE: 'var(--as-badge-blue)',
  USER_DISABLE: 'var(--as-badge-red)',
  USER_FORCE_LOGOUT: 'var(--as-badge-red)',
  USER_PASSWORD_RESET: 'var(--as-badge-yellow)',
  PASSWORD_CHANGE: 'var(--as-badge-yellow)',
  OTP_FAIL: 'var(--as-badge-red)',
};

const ACTION_TEXT_COLORS: Record<string, string> = {
  LOGIN: 'var(--as-badge-green-text)',
  LOGOUT: 'var(--as-badge-gray-text)',
  ORDER_UPDATE: 'var(--as-badge-blue-text)',
  COUPON_REQUEST: 'var(--as-badge-yellow-text)',
  COUPON_APPROVE: 'var(--as-badge-green-text)',
  COUPON_REJECT: 'var(--as-badge-red-text)',
  COUPON_CREATE: 'var(--as-badge-green-text)',
  INVENTORY_UPDATE: 'var(--as-badge-blue-text)',
  USER_CREATE: 'var(--as-badge-blue-text)',
  USER_UPDATE: 'var(--as-badge-blue-text)',
  USER_DISABLE: 'var(--as-badge-red-text)',
  USER_FORCE_LOGOUT: 'var(--as-badge-red-text)',
  USER_PASSWORD_RESET: 'var(--as-badge-yellow-text)',
  PASSWORD_CHANGE: 'var(--as-badge-yellow-text)',
  OTP_FAIL: 'var(--as-badge-red-text)',
};

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (action) params.set('action', action);
    if (from) params.set('from', new Date(from).toISOString());
    if (to) params.set('to', new Date(to + 'T23:59:59').toISOString());
    try {
      const res = await fetch(`/api/admin/logs?${params}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, search, action, from, to]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function exportCSV() {
    const headers = ['Timestamp', 'Employee', 'Role', 'Action', 'Entity', 'Entity ID', 'Details', 'IP'];
    const rows = logs.map(l => [
      new Date(l.timestamp).toLocaleString('en-IN'),
      `${l.employeeName} (${l.employeeId})`,
      l.role,
      l.action,
      l.entity || '',
      l.entityId || '',
      (l.details || '').replace(/,/g, ';'),
      l.ip || '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / 25);

  return (
    <AdminShell>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px', minWidth: 200 }}>
          <label style={LABEL}>Search</label>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Name, action, entity..." style={FILTER_INPUT} />
        </div>
        <div>
          <label style={LABEL}>Action</label>
          <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }} style={FILTER_INPUT}>
            <option value="">All Actions</option>
            {ACTION_TYPES.slice(1).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label style={LABEL}>From</label>
          <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} style={FILTER_INPUT} />
        </div>
        <div>
          <label style={LABEL}>To</label>
          <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} style={FILTER_INPUT} />
        </div>
        <button onClick={exportCSV} style={{ padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'transparent', color: 'var(--as-text)', border: '1px solid var(--as-border)', borderRadius: 6, whiteSpace: 'nowrap', alignSelf: 'flex-end' }}>
          Export CSV
        </button>
        <div style={{ fontSize: 13, color: 'var(--as-muted)', alignSelf: 'flex-end', paddingBottom: 2 }}>
          {total} log{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--as-shadow)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Timestamp', 'Employee', 'Action', 'Entity', 'Details', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'var(--as-table-header)', borderBottom: '1px solid var(--as-border)', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--as-muted)' }}>No logs found.</td></tr>
            ) : logs.map(log => (
              <React.Fragment key={log._id}>
                <tr
                  onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                  style={{ borderBottom: '1px solid var(--as-border)', cursor: 'pointer', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--as-table-row-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = expanded === log._id ? 'var(--as-hover)' : 'transparent')}
                >
                  <td style={{ padding: '9px 14px', color: 'var(--as-muted)', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {new Date(log.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: '9px 14px', color: 'var(--as-text)' }}>
                    <div style={{ fontWeight: 500 }}>{log.employeeName}</div>
                    <div style={{ fontSize: 11, color: 'var(--as-muted)' }}>{log.employeeId}</div>
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <span style={{
                      display: 'inline-flex', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                      background: ACTION_COLORS[log.action] || 'var(--as-badge-gray)',
                      color: ACTION_TEXT_COLORS[log.action] || 'var(--as-badge-gray-text)',
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '9px 14px', color: 'var(--as-muted)', fontSize: 12 }}>
                    {log.entity || '—'}
                    {log.entityId && <span style={{ fontSize: 10, marginLeft: 4, opacity: 0.6 }}>{log.entityId.slice(0, 8)}…</span>}
                  </td>
                  <td style={{ padding: '9px 14px', color: 'var(--as-muted)', fontSize: 12, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.details || '—'}
                  </td>
                  <td style={{ padding: '9px 14px', color: 'var(--as-muted)', fontSize: 14 }}>
                    {expanded === log._id ? '▲' : '▼'}
                  </td>
                </tr>
                {expanded === log._id && (
                  <tr style={{ background: 'var(--as-hover)' }}>
                    <td colSpan={6} style={{ padding: '12px 14px', borderBottom: '1px solid var(--as-border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, fontSize: 12 }}>
                        <ExpRow label="Full Timestamp" value={new Date(log.timestamp).toLocaleString('en-IN')} />
                        <ExpRow label="ID" value={log.employeeId} />
                        <ExpRow label="Role" value={log.role} />
                        <ExpRow label="Entity ID" value={log.entityId || '—'} />
                        <ExpRow label="IP Address" value={log.ip || '—'} />
                        {log.details && <ExpRow label="Full Details" value={log.details} />}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <PagBtn label="← Prev" disabled={page === 1} onClick={() => setPage(p => p - 1)} />
          <span style={{ fontSize: 13, color: 'var(--as-muted)', padding: '6px 12px' }}>{page} / {totalPages}</span>
          <PagBtn label="Next →" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} />
        </div>
      )}
    </AdminShell>
  );
}

const LABEL: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' };
const FILTER_INPUT: React.CSSProperties = { padding: '8px 10px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)', minWidth: 140 };

function ExpRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--as-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ color: 'var(--as-text)', wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}

function PagBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ padding: '6px 14px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'var(--as-card)', color: 'var(--as-text)', opacity: disabled ? 0.4 : 1 }}>
      {label}
    </button>
  );
}
