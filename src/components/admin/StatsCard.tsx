'use client';

import { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  icon: string;
  accent?: string;
  sub?: string;
}

const STAT_ICONS: Record<string, ReactNode> = {
  default: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h18v18H3z"/>
    </svg>
  ),
  orders: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  pending: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  requests: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 0 2-2h2a2 2 0 0 0 2 2"/>
    </svg>
  ),
  stock: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9h18M9 21V9M3 3h18v4H3zM15 21V9"/>
    </svg>
  ),
  members: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  online: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
    </svg>
  ),
  tasks: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
};

function resolveIcon(icon: string): ReactNode {
  const map: Record<string, ReactNode> = {
    'orders':   STAT_ICONS.orders,
    'pending':  STAT_ICONS.pending,
    'requests': STAT_ICONS.requests,
    'stock':    STAT_ICONS.stock,
    'members':  STAT_ICONS.members,
    'online':   STAT_ICONS.online,
    'tasks':    STAT_ICONS.tasks,
    '\u{1F4E6}': STAT_ICONS.orders,
    '\u{23F3}': STAT_ICONS.pending,
    '\u{1F4CB}': STAT_ICONS.requests,
    '\u{1F5C4}\u{FE0F}': STAT_ICONS.stock,
  };
  return map[icon] ?? STAT_ICONS[icon] ?? STAT_ICONS.default;
}

export default function StatsCard({ label, value, icon, accent, sub }: Props) {
  const iconEl = resolveIcon(icon);
  const isAccented = !!accent;

  return (
    <div
      className="as-card-hover"
      style={{
        background: 'var(--as-card)',
        border: '1px solid var(--as-border)',
        borderRadius: 'var(--as-radius)',
        padding: '20px 22px',
        boxShadow: 'var(--as-shadow)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        cursor: 'default',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 11,
          color: 'var(--as-muted)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: 10,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: 30,
          fontWeight: 700,
          color: accent || 'var(--as-text)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: 'var(--as-muted)', marginTop: 7, lineHeight: 1.4 }}>{sub}</div>
        )}
      </div>

      <div style={{
        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
        background: isAccented ? `${accent}18` : 'var(--as-badge-gray)',
        color: accent || 'var(--as-muted)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {iconEl}
      </div>
    </div>
  );
}
