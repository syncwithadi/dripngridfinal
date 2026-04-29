'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  title: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

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

export default function AdminTopbar({ title, theme, onToggleTheme }: Props) {
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
      <h1 style={{ fontSize: 14, fontWeight: 600, color: 'var(--as-text)', letterSpacing: '-0.01em', margin: 0 }}>
        {title}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
