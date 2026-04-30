'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface Props {
  title: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onMenuOpen?: () => void;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
  </svg>
);

const BellIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
);

// ── Notification type colours ─────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  task_assigned:     'var(--as-badge-blue-text)',
  product_approved:  'var(--as-badge-green-text)',
  product_rejected:  'var(--as-badge-red-text)',
  report_resolved:   'var(--as-badge-green-text)',
  system:            'var(--as-muted)',
};

function notifColor(type: string) {
  return TYPE_COLOR[type] || 'var(--as-accent)';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Bell dropdown ─────────────────────────────────────────────────────────────
function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (!res.ok) return;
      const d = await res.json();
      setNotifications(d.notifications || []);
      setUnread(d.unreadCount || 0);
    } catch {}
  }, []);

  // Initial fetch + 12s poll (lightweight, near real-time)
  useEffect(() => {
    fetchNotifs();
    pollRef.current = setInterval(fetchNotifs, 12_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNotifs]);

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  async function handleOpen() {
    if (!open) {
      setLoading(true);
      await fetchNotifs();
      setLoading(false);
    }
    setOpen(v => !v);
  }

  async function markRead(id: string) {
    setNotifications(ns => ns.map(n => n._id === id ? { ...n, read: true } : n));
    setUnread(u => Math.max(0, u - 1));
    await fetch('/api/admin/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
  }

  async function markAllRead() {
    if (unread === 0) return;
    setMarkingAll(true);
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(ns => ns.map(n => ({ ...n, read: true })));
      setUnread(0);
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        title="Notifications"
        style={{
          width: 32, height: 32,
          borderRadius: 'var(--as-radius-sm)',
          border: '1px solid var(--as-border)',
          background: open ? 'var(--as-hover)' : 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--as-muted)',
          position: 'relative',
          transition: 'background 0.12s, color 0.12s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.background = 'var(--as-hover)';
          (e.currentTarget as HTMLElement).style.color = 'var(--as-text)';
        }}
        onMouseLeave={e => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--as-muted)';
          }
        }}
      >
        <BellIcon />
        {/* Unread badge */}
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            width: 16, height: 16,
            background: 'var(--as-accent)', color: '#fff',
            borderRadius: '50%', fontSize: 9, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, border: '1.5px solid var(--as-topbar)',
            pointerEvents: 'none',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 340, maxHeight: 440,
          background: 'var(--as-card)', border: '1px solid var(--as-border)',
          borderRadius: 'var(--as-radius)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          zIndex: 200, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Panel header */}
          <div style={{
            padding: '12px 14px 10px', borderBottom: '1px solid var(--as-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--as-text)' }}>Notifications</span>
              {unread > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                  background: 'var(--as-accent)', color: '#fff',
                }}>{unread} new</span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                style={{
                  fontSize: 11, color: 'var(--as-accent)', background: 'none', border: 'none',
                  cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3,
                  opacity: markingAll ? 0.5 : 1,
                }}
              >
                <CheckIcon /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? (
              <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: 12, color: 'var(--as-muted)' }}>
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '32px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>🔔</div>
                <div style={{ fontSize: 13, color: 'var(--as-text)', fontWeight: 600 }}>All caught up!</div>
                <div style={{ fontSize: 12, color: 'var(--as-muted)', marginTop: 3 }}>No notifications yet.</div>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => { if (!n.read) markRead(n._id); }}
                  style={{
                    padding: '11px 14px',
                    borderBottom: '1px solid var(--as-border)',
                    background: n.read ? 'transparent' : 'var(--as-active-bg)',
                    cursor: n.read ? 'default' : 'pointer',
                    display: 'flex', gap: 10, alignItems: 'flex-start',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (!n.read) (e.currentTarget as HTMLElement).style.background = 'var(--as-hover)'; }}
                  onMouseLeave={e => { if (!n.read) (e.currentTarget as HTMLElement).style.background = 'var(--as-active-bg)'; }}
                >
                  {/* Unread dot */}
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                    background: n.read ? 'transparent' : notifColor(n.type),
                    border: n.read ? '1.5px solid var(--as-border)' : 'none',
                  }} />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: n.read ? 500 : 700, color: 'var(--as-text)', lineHeight: 1.3 }}>
                      {n.link ? (
                        <Link href={n.link} style={{ color: 'inherit', textDecoration: 'none' }} onClick={() => setOpen(false)}>
                          {n.title}
                        </Link>
                      ) : n.title}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--as-muted)', marginTop: 2, lineHeight: 1.4 }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: 10.5, color: 'var(--as-muted)', marginTop: 4, opacity: 0.7 }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>

                  {/* Read indicator check */}
                  {n.read && (
                    <span style={{ color: 'var(--as-border)', flexShrink: 0, marginTop: 2 }}>
                      <CheckIcon />
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '8px 14px', borderTop: '1px solid var(--as-border)',
              flexShrink: 0, textAlign: 'center',
            }}>
              <span style={{ fontSize: 11.5, color: 'var(--as-muted)' }}>
                Showing last {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Topbar ─────────────────────────────────────────────────────────────────────
export default function AdminTopbar({ title, theme, onToggleTheme, onMenuOpen }: Props) {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <header
      style={{
        height: 54,
        background: 'var(--as-topbar)',
        borderBottom: '1px solid var(--as-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Hamburger — shown on mobile */}
        <button
          className="as-hamburger"
          onClick={onMenuOpen}
          title="Open menu"
          style={{
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            border: '1px solid var(--as-border)',
            borderRadius: 'var(--as-radius-sm)',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--as-muted)',
            transition: 'background 0.12s, color 0.12s',
            flexShrink: 0,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--as-hover)';
            (e.currentTarget as HTMLElement).style.color = 'var(--as-text)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--as-muted)';
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
        <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text)', letterSpacing: '-0.01em', margin: 0 }}>
          {title}
        </h1>

        {/* Ctrl+K palette trigger */}
        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          title="Open command palette (Ctrl+K)"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginLeft: 8, padding: '5px 10px',
            border: '1px solid var(--as-border)', borderRadius: 'var(--as-radius-sm)',
            background: 'transparent', color: 'var(--as-muted)',
            cursor: 'pointer', fontSize: 11, transition: 'all 0.12s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--as-hover)';
            (e.currentTarget as HTMLElement).style.color = 'var(--as-text)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--as-accent)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--as-muted)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--as-border)';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          Search
          <kbd style={{ fontSize: 9, padding: '1px 4px', border: '1px solid var(--as-border)', borderRadius: 3, background: 'var(--as-bg)', fontFamily: 'inherit', marginLeft: 2 }}>⌘K</kbd>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Notification bell */}
        <NotificationBell />

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          style={{
            width: 32, height: 32,
            borderRadius: 'var(--as-radius-sm)',
            border: '1px solid var(--as-border)',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--as-muted)',
            transition: 'background 0.12s, color 0.12s, border-color 0.12s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--as-hover)';
            (e.currentTarget as HTMLElement).style.color = 'var(--as-text)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--as-muted)';
          }}
        >
          {theme === 'light' ? <MoonIcon /> : <SunIcon />}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 18, background: 'var(--as-border)' }} />

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 500,
            border: '1px solid var(--as-border)',
            borderRadius: 'var(--as-radius-sm)',
            background: 'transparent',
            color: 'var(--as-muted)',
            cursor: 'pointer',
            transition: 'all 0.12s',
            letterSpacing: '0.01em',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--as-badge-red)';
            (e.currentTarget as HTMLElement).style.color = 'var(--as-badge-red-text)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--as-badge-red-text)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--as-muted)';
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--as-border)';
          }}
        >
          <LogoutIcon />
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </header>
  );
}
