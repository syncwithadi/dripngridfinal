'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { useAdmin } from '@/components/admin/AdminShell';

const TYPE_META: Record<string, { label: string; icon: string; bg: string; text: string }> = {
  issue:      { label: 'Issue', icon: '🐛', bg: 'var(--as-badge-red)', text: 'var(--as-badge-red-text)' },
  suggestion: { label: 'Suggestion', icon: '💡', bg: 'var(--as-badge-yellow)', text: 'var(--as-badge-yellow-text)' },
  request:    { label: 'Request', icon: '📩', bg: 'var(--as-badge-blue)', text: 'var(--as-badge-blue-text)' },
};
const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  open:        { label: 'Open', bg: 'var(--as-badge-yellow)', text: 'var(--as-badge-yellow-text)' },
  in_progress: { label: 'In Progress', bg: 'var(--as-badge-blue)', text: 'var(--as-badge-blue-text)' },
  resolved:    { label: 'Resolved', bg: 'var(--as-badge-green)', text: 'var(--as-badge-green-text)' },
};
const PRIORITY_META: Record<string, { label: string; bg: string; text: string }> = {
  low:    { label: 'Low', bg: 'var(--as-badge-gray)', text: 'var(--as-badge-gray-text)' },
  medium: { label: 'Medium', bg: 'var(--as-badge-blue)', text: 'var(--as-badge-blue-text)' },
  high:   { label: 'High', bg: 'var(--as-badge-yellow)', text: 'var(--as-badge-yellow-text)' },
  urgent: { label: 'Urgent', bg: 'var(--as-badge-red)', text: 'var(--as-badge-red-text)' },
};

function NewReportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ title: '', type: 'issue', description: '', priority: 'medium' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!form.title || !form.description) { setError('Title and description required.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/admin/internal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed.'); return; }
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 12, padding: 28, width: 460, maxWidth: '92vw', zIndex: 301, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--as-text)', marginBottom: 20 }}>Submit Report</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Title *</label>
          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Brief title..."
            style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Type</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)', boxSizing: 'border-box' }}>
              <option value="issue">Issue</option>
              <option value="suggestion">Suggestion</option>
              <option value="request">Request</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Priority</label>
            <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
              style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)', boxSizing: 'border-box' }}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Description *</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Describe the issue, suggestion, or request in detail..."
            style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        {error && <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', padding: '8px 10px', background: 'var(--as-badge-red)', borderRadius: 6, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'transparent', color: 'var(--as-text)' }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 6 }}>
            {loading ? 'Submitting…' : 'Submit Report'}
          </button>
        </div>
      </div>
    </>
  );
}

function RespondModal({ report, onClose, onDone }: { report: any; onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState(report.status);
  const [note, setNote] = useState(report.responseNote || '');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await fetch(`/api/admin/internal/${report._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, responseNote: note }),
      });
      onDone();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 12, padding: 28, width: 440, maxWidth: '92vw', zIndex: 301, boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--as-text)', marginBottom: 4 }}>Respond to Report</div>
        <div style={{ fontSize: 12, color: 'var(--as-muted)', marginBottom: 16 }}>{report.title}</div>
        <div style={{ padding: '12px 14px', background: 'var(--as-hover)', borderRadius: 8, marginBottom: 16, fontSize: 13, color: 'var(--as-text)', lineHeight: 1.5 }}>{report.description}</div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Update Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)', boxSizing: 'border-box' }}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Response Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Your response to the team member..."
            style={{ width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid var(--as-input-border)', borderRadius: 6, background: 'var(--as-input-bg)', color: 'var(--as-text)', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'transparent', color: 'var(--as-text)' }}>Cancel</button>
          <button onClick={submit} disabled={loading} style={{ flex: 1, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 6 }}>
            {loading ? 'Saving…' : 'Save Response'}
          </button>
        </div>
      </div>
    </>
  );
}

function InternalContent() {
  const { user } = useAdmin();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [respondTarget, setRespondTarget] = useState<any>(null);

  const canRespond = user?.role === 'admin' || user?.role === 'super_admin';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      const res = await fetch(`/api/admin/internal?${params}`);
      const data = await res.json();
      setReports(data.reports || []);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <>
      {showNew && <NewReportModal onClose={() => setShowNew(false)} onDone={() => { setShowNew(false); fetchData(); }} />}
      {respondTarget && <RespondModal report={respondTarget} onClose={() => setRespondTarget(null)} onDone={() => { setRespondTarget(null); fetchData(); }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['', 'open', 'in_progress', 'resolved'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 6,
              border: '1px solid var(--as-border)',
              background: statusFilter === s ? 'var(--as-accent)' : 'transparent',
              color: statusFilter === s ? 'var(--as-bg)' : 'var(--as-muted)',
            }}>
              {s ? STATUS_META[s]?.label || s : 'All'}
            </button>
          ))}
          <span style={{ color: 'var(--as-border)', fontSize: 18, alignSelf: 'center' }}>|</span>
          {['', 'issue', 'suggestion', 'request'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} style={{
              padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 6,
              border: '1px solid var(--as-border)',
              background: typeFilter === t ? 'var(--as-hover)' : 'transparent',
              color: typeFilter === t ? 'var(--as-text)' : 'var(--as-muted)',
            }}>
              {t ? TYPE_META[t]?.icon + ' ' + TYPE_META[t]?.label : 'All Types'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowNew(true)} style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: 'var(--as-bg)', border: 'none', borderRadius: 6 }}>
          + Submit Report
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--as-muted)' }}>Loading…</div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--as-muted)', background: 'var(--as-card)', borderRadius: 10, border: '1px solid var(--as-border)' }}>No reports found.</div>
        ) : reports.map(r => {
          const tm = TYPE_META[r.type] || TYPE_META.issue;
          const sm = STATUS_META[r.status] || STATUS_META.open;
          const pm = PRIORITY_META[r.priority] || PRIORITY_META.medium;
          return (
            <div key={r._id} style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, padding: '16px 18px', boxShadow: 'var(--as-shadow)', display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                  <span style={{ fontSize: 15 }}>{tm.icon}</span>
                  <span style={{ fontWeight: 600, color: 'var(--as-text)', fontSize: 14 }}>{r.title}</span>
                  <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: sm.bg, color: sm.text }}>{sm.label}</span>
                  <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: pm.bg, color: pm.text }}>{pm.label}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--as-muted)', marginBottom: 6 }}>{r.submittedByName} · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                {r.responseNote && (
                  <div style={{ fontSize: 12, color: 'var(--as-badge-green-text)', padding: '6px 10px', background: 'var(--as-badge-green)', borderRadius: 6, marginTop: 6 }}>
                    Admin response: {r.responseNote}
                  </div>
                )}
              </div>
              {canRespond && r.status !== 'resolved' && (
                <button onClick={() => setRespondTarget(r)} style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--as-badge-blue)', color: 'var(--as-badge-blue-text)', border: 'none', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Respond
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function InternalPage() {
  return <AdminShell><InternalContent /></AdminShell>;
}
