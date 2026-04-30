'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Result {
  id: string;
  type: 'nav' | 'order' | 'user' | 'task';
  label: string;
  sub?: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: Result[] = [
  { id: 'nav-dash',     type: 'nav', label: 'Dashboard',         href: '/admin',                 icon: '⊞' },
  { id: 'nav-orders',   type: 'nav', label: 'Orders',            href: '/admin/orders',           icon: '📦' },
  { id: 'nav-inv',      type: 'nav', label: 'Inventory',         href: '/admin/inventory',        icon: '🗂' },
  { id: 'nav-coupons',  type: 'nav', label: 'Coupons',           href: '/admin/coupons',          icon: '🏷' },
  { id: 'nav-reqs',     type: 'nav', label: 'Coupon Requests',   href: '/admin/requests',         icon: '📋' },
  { id: 'nav-cust',     type: 'nav', label: 'Customers',         href: '/admin/customers',        icon: '👤' },
  { id: 'nav-logs',     type: 'nav', label: 'Audit Logs',        href: '/admin/logs',             icon: '📄' },
  { id: 'nav-prod',     type: 'nav', label: 'Product Requests',  href: '/admin/product-requests', icon: '✏️' },
  { id: 'nav-tasks',    type: 'nav', label: 'Tasks',             href: '/admin/tasks',            icon: '✅' },
  { id: 'nav-int',      type: 'nav', label: 'Internal Reports',  href: '/admin/internal',         icon: '💬' },
  { id: 'nav-res',      type: 'nav', label: 'Resource Hub',      href: '/admin/resources',        icon: '📚' },
  { id: 'nav-comm',     type: 'nav', label: 'Communications',    href: '/admin/communications',   icon: '✉️' },
  { id: 'nav-users',    type: 'nav', label: 'Staff',             href: '/admin/users',            icon: '👥' },
  { id: 'nav-settings', type: 'nav', label: 'Settings',          href: '/admin/settings',         icon: '⚙️' },
  { id: 'nav-hidden',   type: 'nav', label: 'Hidden Data',       href: '/admin/hidden',           icon: '🙈' },
  { id: 'nav-archive',  type: 'nav', label: 'Archive',           href: '/admin/archive',          icon: '🗄' },
];

const TYPE_LABEL: Record<string, string> = {
  nav: 'Navigate',
  order: 'Order',
  user: 'Staff',
  task: 'Task',
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setResults(NAV_ITEMS.slice(0, 8));
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    const filtered = NAV_ITEMS.filter(n =>
      n.label.toLowerCase().includes(q.toLowerCase())
    );

    if (!q.trim()) {
      setResults(filtered.slice(0, 8));
      return;
    }

    setLoading(true);
    try {
      const [ordersRes, usersRes, tasksRes] = await Promise.allSettled([
        fetch(`/api/admin/orders?search=${encodeURIComponent(q)}&limit=3`).then(r => r.json()),
        fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=3`).then(r => r.json()),
        fetch(`/api/admin/tasks?search=${encodeURIComponent(q)}&limit=3`).then(r => r.json()),
      ]);

      const dynamic: Result[] = [];

      if (ordersRes.status === 'fulfilled') {
        (ordersRes.value?.orders || []).slice(0, 3).forEach((o: any) => {
          dynamic.push({
            id: `order-${o._id}`,
            type: 'order',
            label: `Order #${o.orderId || o._id?.slice(-6)}`,
            sub: `${o.customerName || o.name || ''} · ₹${o.total || o.amount || '—'}`,
            href: `/admin/orders`,
            icon: '📦',
          });
        });
      }

      if (usersRes.status === 'fulfilled') {
        (usersRes.value?.users || []).slice(0, 3).forEach((u: any) => {
          dynamic.push({
            id: `user-${u._id}`,
            type: 'user',
            label: u.name,
            sub: `${u.employeeId} · ${u.role?.replace('_', ' ')}`,
            href: `/admin/users`,
            icon: '👤',
          });
        });
      }

      if (tasksRes.status === 'fulfilled') {
        (tasksRes.value?.tasks || []).slice(0, 3).forEach((t: any) => {
          dynamic.push({
            id: `task-${t._id}`,
            type: 'task',
            label: t.title,
            sub: `${t.assignedToName || ''} · ${t.status}`,
            href: `/admin/tasks`,
            icon: '✅',
          });
        });
      }

      setResults([...filtered.slice(0, 4), ...dynamic]);
    } catch {
      setResults(filtered.slice(0, 8));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => search(query), 220);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [query, search]);

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) { navigate(results[selected].href); }
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 9000, backdropFilter: 'blur(3px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: '18vh', left: '50%', transform: 'translateX(-50%)',
        width: 580, maxWidth: '92vw',
        background: 'var(--as-card)', border: '1px solid var(--as-border)',
        borderRadius: 14, boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        zIndex: 9001, overflow: 'hidden',
      }}>
        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 16px', borderBottom: '1px solid var(--as-border)',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--as-muted)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search pages, orders, staff, tasks…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--as-text)', fontSize: 15, padding: '16px 0',
              fontFamily: 'inherit',
            }}
          />
          {loading && (
            <div style={{ width: 12, height: 12, border: '2px solid var(--as-border)', borderTopColor: 'var(--as-accent)', borderRadius: '50%', animation: 'as-spin 0.7s linear infinite', flexShrink: 0 }} />
          )}
          <kbd style={{
            fontSize: 10, padding: '2px 6px', border: '1px solid var(--as-border)',
            borderRadius: 4, color: 'var(--as-muted)', background: 'var(--as-hover)',
            fontFamily: 'inherit', flexShrink: 0,
          }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 0' }}>
          {results.length === 0 ? (
            <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: 'var(--as-muted)' }}>
              No results for "{query}"
            </div>
          ) : results.map((r, i) => (
            <div
              key={r.id}
              onClick={() => navigate(r.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', cursor: 'pointer',
                background: i === selected ? 'var(--as-hover)' : 'transparent',
                borderRadius: 8, margin: '0 6px',
                transition: 'background 0.08s',
              }}
              onMouseEnter={() => setSelected(i)}
            >
              <span style={{ fontSize: 16, flexShrink: 0, width: 22, textAlign: 'center' }}>{r.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--as-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.label}
                </div>
                {r.sub && (
                  <div style={{ fontSize: 11, color: 'var(--as-muted)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.sub}
                  </div>
                )}
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px',
                borderRadius: 4, background: 'var(--as-hover)',
                color: 'var(--as-muted)', flexShrink: 0, border: '1px solid var(--as-border)',
              }}>
                {TYPE_LABEL[r.type]}
              </span>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div style={{
          padding: '8px 16px', borderTop: '1px solid var(--as-border)',
          display: 'flex', gap: 14, alignItems: 'center',
        }}>
          {[['↑↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Close']].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{ fontSize: 10, padding: '2px 5px', border: '1px solid var(--as-border)', borderRadius: 3, color: 'var(--as-muted)', background: 'var(--as-hover)', fontFamily: 'inherit' }}>{key}</kbd>
              <span style={{ fontSize: 11, color: 'var(--as-muted)' }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
