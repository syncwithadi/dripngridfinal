'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mustChange, setMustChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const saved = localStorage.getItem('admin_theme') as 'light' | 'dark' | null;
    if (saved) setTheme(saved);
    // If already logged in, redirect
    fetch('/api/admin/auth/me').then(r => {
      if (r.ok) router.push(searchParams.get('from') || '/admin');
    });
  }, [router, searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed.'); return; }
      if (data.mustChangePassword) {
        setMustChange(true);
        setCurrentPassword(password);
        return;
      }
      router.push(searchParams.get('from') || '/admin');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to change password.'); return; }
      router.push('/admin');
    } catch {
      setError('Network error. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const isDark = theme === 'dark';
  const bg = isDark ? '#0d0d0f' : '#f6f7f9';
  const card = isDark ? '#18181b' : '#ffffff';
  const border = isDark ? '#27272a' : '#e4e6ea';
  const text = isDark ? '#f4f4f5' : '#111827';
  const muted = isDark ? '#71717a' : '#6b7280';
  const inputBg = isDark ? '#18181b' : '#ffffff';
  const inputBorder = isDark ? '#3f3f46' : '#d1d5db';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, padding: 24, transition: 'background 0.2s' }}>
      {/* Theme toggle */}
      <button
        onClick={() => {
          const next = isDark ? 'light' : 'dark';
          setTheme(next);
          localStorage.setItem('admin_theme', next);
        }}
        style={{
          position: 'fixed', top: 20, right: 20,
          width: 36, height: 36, borderRadius: 8,
          border: `1px solid ${border}`, background: card,
          cursor: 'pointer', fontSize: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: text,
        }}
      >
        {isDark ? '☀️' : '🌙'}
      </button>

      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.25em', color: text, textTransform: 'uppercase' }}>
            DRIPNGRID
          </div>
          <div style={{ fontSize: 11, color: muted, marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Admin Panel
          </div>
        </div>

        {/* Card */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 32, boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)' }}>
          {mustChange ? (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: text, marginBottom: 6, marginTop: 0 }}>Set New Password</h2>
              <p style={{ fontSize: 13, color: muted, marginBottom: 24, marginTop: 0 }}>
                For security, please set a new password before continuing.
              </p>
              <form onSubmit={handleChangePassword}>
                <Field label="New Password" isDark={isDark} inputBg={inputBg} inputBorder={inputBorder} text={text} muted={muted}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${inputBorder}`, borderRadius: 6, background: inputBg, color: text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </Field>
                {error && <ErrorMsg msg={error} isDark={isDark} />}
                <SubmitBtn loading={loading} label="Set Password" isDark={isDark} text={text} bg={bg} />
              </form>
            </>
          ) : (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: text, marginBottom: 6, marginTop: 0 }}>Sign In</h2>
              <p style={{ fontSize: 13, color: muted, marginBottom: 24, marginTop: 0 }}>
                Enter your Employee ID and password to continue.
              </p>
              <form onSubmit={handleLogin}>
                <Field label="Employee ID" isDark={isDark} inputBg={inputBg} inputBorder={inputBorder} text={text} muted={muted}>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={e => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP001"
                    required
                    autoComplete="username"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${inputBorder}`, borderRadius: 6, background: inputBg, color: text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </Field>
                <Field label="Password" isDark={isDark} inputBg={inputBg} inputBorder={inputBorder} text={text} muted={muted}>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    autoComplete="current-password"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${inputBorder}`, borderRadius: 6, background: inputBg, color: text, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </Field>
                {error && <ErrorMsg msg={error} isDark={isDark} />}
                <SubmitBtn loading={loading} label="Sign In" isDark={isDark} text={text} bg={bg} />
              </form>
            </>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: muted }}>
          Restricted access · DRIPNGRID Internal
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, muted }: any) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrorMsg({ msg, isDark }: any) {
  return (
    <div style={{ fontSize: 12, color: isDark ? '#fca5a5' : '#991b1b', marginBottom: 14, padding: '8px 12px', background: isDark ? '#450a0a' : '#fee2e2', borderRadius: 6 }}>
      {msg}
    </div>
  );
}

function SubmitBtn({ loading, label, isDark, text, bg }: any) {
  return (
    <button
      type="submit"
      disabled={loading}
      style={{
        width: '100%', padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
        background: isDark ? '#f4f4f5' : '#111827', color: isDark ? '#111827' : '#f4f4f5',
        border: 'none', borderRadius: 6, marginTop: 4, letterSpacing: '0.04em',
        opacity: loading ? 0.6 : 1, transition: 'opacity 0.12s',
      }}
    >
      {loading ? 'Please wait...' : label}
    </button>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
