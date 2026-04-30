'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { useAdmin } from '@/components/admin/AdminShell';

// ── Types ─────────────────────────────────────────────────────────────────────
interface MailRecord {
  _id: string;
  subject: string;
  to: string;
  toName?: string;
  from: string;
  fromName?: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'pending';
  sentByName?: string;
}

interface Staff {
  employeeId: string;
  name: string;
  email: string;
  role: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function statusStyle(s: string) {
  if (s === 'sent') return { bg: 'var(--as-badge-green)', text: 'var(--as-badge-green-text)' };
  if (s === 'failed') return { bg: 'var(--as-badge-red)', text: 'var(--as-badge-red-text)' };
  return { bg: 'var(--as-badge-yellow)', text: 'var(--as-badge-yellow-text)' };
}

const inputSt: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  border: '1px solid var(--as-input-border)', borderRadius: 6,
  background: 'var(--as-input-bg)', color: 'var(--as-text)',
  fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
};

// ── Compose Modal ─────────────────────────────────────────────────────────────
function ComposeModal({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const { user } = useAdmin();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState({ to: '', toName: '', subject: '', body: '', fromAlias: 'admin' });
  const [isCustomTo, setIsCustomTo] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(d => setStaff(d.users || [])).catch(() => {});
  }, []);

  function onSelectRecipient(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomTo(true);
      setForm(f => ({ ...f, to: '', toName: '' }));
      return;
    }
    setIsCustomTo(false);
    const s = staff.find(s => s.email === val);
    setForm(f => ({ ...f, to: val, toName: s?.name || '' }));
  }

  async function send() {
    if (!form.to || !form.subject || !form.body) { setError('To, Subject, and Body are required.'); return; }
    setSending(true); setError('');
    try {
      const res = await fetch('/api/admin/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send.'); return; }
      onSent();
    } catch { setError('Network error.'); }
    finally { setSending(false); }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: 'var(--as-card)', border: '1px solid var(--as-border)',
        borderRadius: 14, width: 560, maxWidth: '94vw', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', zIndex: 401,
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--as-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--as-text)' }}>Compose Email</div>
            <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 2 }}>Send internal communication to staff</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--as-muted)', fontSize: 20 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* From alias selector */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>From (Sender Alias)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['admin', 'support', 'noreply'] as const).map(alias => (
                <button
                  key={alias}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, fromAlias: alias }))}
                  style={{
                    flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600,
                    border: '1px solid var(--as-border)', borderRadius: 6, cursor: 'pointer',
                    background: form.fromAlias === alias ? 'var(--as-accent)' : 'transparent',
                    color: form.fromAlias === alias ? '#fff' : 'var(--as-muted)',
                    transition: 'all 0.12s',
                  }}
                >
                  {alias}@dripngrid.in
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: 'var(--as-muted)', marginTop: 5 }}>
              Sending as: <strong style={{ color: 'var(--as-text)' }}>{form.fromAlias}@dripngrid.in</strong>
            </div>
          </div>

          {/* To (staff picker or custom) */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>To *</label>
            <select 
              value={isCustomTo ? '__custom__' : (staff.some(s => s.email === form.to) ? form.to : (form.to ? '__custom__' : ''))}
              onChange={onSelectRecipient} 
              style={inputSt}
            >
              <option value="">— Select staff member —</option>
              {staff.map(s => (
                <option key={s.employeeId} value={s.email}>{s.name} ({s.email})</option>
              ))}
              <option value="__custom__">Custom email…</option>
            </select>
            {isCustomTo && (
              <input
                value={form.to}
                onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                placeholder="Enter email address"
                style={{ ...inputSt, marginTop: 6 }}
              />
            )}
          </div>

          {/* Subject */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subject *</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Email subject…" style={inputSt} />
          </div>

          {/* Body */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--as-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message *</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              rows={7}
              placeholder="Write your message…"
              style={{ ...inputSt, resize: 'vertical', minHeight: 140 }}
            />
          </div>

          {error && <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', padding: '8px 12px', background: 'var(--as-badge-red)', borderRadius: 6 }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--as-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', border: '1px solid var(--as-border)', borderRadius: 6, background: 'transparent', color: 'var(--as-text)' }}>
            Cancel
          </button>
          <button onClick={send} disabled={sending} style={{ padding: '8px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'var(--as-accent)', color: '#fff', border: 'none', borderRadius: 6, opacity: sending ? 0.7 : 1 }}>
            {sending ? 'Sending…' : '✉ Send Email'}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Mail History Row ──────────────────────────────────────────────────────────
function MailRow({ mail }: { mail: MailRecord }) {
  const [expanded, setExpanded] = useState(false);
  const st = statusStyle(mail.status);
  return (
    <div style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      <div
        onClick={() => setExpanded(v => !v)}
        style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.1s' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--as-hover)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--as-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mail.subject}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: st.bg, color: st.text, flexShrink: 0 }}>{mail.status}</span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--as-muted)' }}>
            To: <strong style={{ color: 'var(--as-text)' }}>{mail.toName || mail.to}</strong>
            {' · '}From: {mail.fromName || mail.from}
            {' · '}{timeAgo(mail.sentAt)}
          </div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.18s', flexShrink: 0, opacity: 0.4 }}>
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </div>
      {expanded && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--as-border)', fontSize: 13, color: 'var(--as-text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
          <div style={{ marginTop: 12 }}>{mail.body}</div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function CommunicationsContent() {
  const { user } = useAdmin();
  const [mails, setMails] = useState<MailRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [search, setSearch] = useState('');

  const canCompose = user?.role === 'admin' || user?.role === 'super_admin';

  const fetchMails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/communications');
      const data = await res.json();
      setMails(data.mails || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMails(); }, [fetchMails]);

  const filtered = mails.filter(m => {
    const q = search.toLowerCase();
    return !q || m.subject.toLowerCase().includes(q) || (m.toName || m.to).toLowerCase().includes(q);
  });

  return (
    <>
      {showCompose && <ComposeModal onClose={() => setShowCompose(false)} onSent={() => { setShowCompose(false); fetchMails(); }} />}

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--as-text)', margin: 0, letterSpacing: '-0.02em' }}>Communications</h2>
          <p style={{ fontSize: 13, color: 'var(--as-muted)', margin: '4px 0 0' }}>Internal email log and compose tool</p>
        </div>
        {canCompose && (
          <button
            onClick={() => setShowCompose(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', fontSize: 13, fontWeight: 600, background: 'var(--as-accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            ✉ Compose
          </button>
        )}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 18, maxWidth: 400 }}>
        <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--as-muted)' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by subject or recipient…"
          style={{ width: '100%', padding: '9px 12px 9px 32px', fontSize: 13, border: '1px solid var(--as-border)', borderRadius: 8, background: 'var(--as-input-bg)', color: 'var(--as-text)', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* Stats bar */}
      {mails.length > 0 && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', val: mails.length, color: 'var(--as-text)' },
            { label: 'Sent', val: mails.filter(m => m.status === 'sent').length, color: 'var(--as-badge-green-text)' },
            { label: 'Failed', val: mails.filter(m => m.status === 'failed').length, color: 'var(--as-badge-red-text)' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'var(--as-card)', border: '1px solid var(--as-border)', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20, fontWeight: 700, color: stat.color }}>{stat.val}</span>
              <span style={{ fontSize: 12, color: 'var(--as-muted)' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Mail history */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--as-muted)' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--as-muted)', border: '2px dashed var(--as-border)', borderRadius: 12, fontSize: 14 }}>
          {search ? `No emails matching "${search}"` : 'No emails sent yet.'}
        </div>
      ) : (
        <div>
          {filtered.map(m => <MailRow key={m._id} mail={m} />)}
        </div>
      )}
    </>
  );
}

export default function CommunicationsPage() {
  return <AdminShell><CommunicationsContent /></AdminShell>;
}
