'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes pulse {
  0%,100% { opacity: 0.5; }
  50%      { opacity: 1; }
}

* { box-sizing: border-box; margin: 0; padding: 0; }

.login-root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Inter', system-ui, sans-serif;
  background: #06060a;
  position: relative;
}

/* Dot grid texture */
.login-root::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%);
}

.login-form-panel {
  position: relative;
  z-index: 2;
  width: 100%;
  padding: 40px 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-card {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 360px;
  animation: fadeUp 0.5s 0.15s ease both;
}

/* ── Corner marks ─────────────────────────────────────── */
.corner { position: fixed; width: 16px; height: 16px; z-index: 2; opacity: 0.1; }
.corner-tl { top: 28px; left: 28px; border-top: 1px solid #fff; border-left: 1px solid #fff; }
.corner-br { bottom: 28px; right: 28px; border-bottom: 1px solid #fff; border-right: 1px solid #fff; }

/* ── Form header ──────────────────────────────────────── */
.form-eyebrow {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: rgba(255,255,255,0.2);
  text-transform: uppercase;
  margin-bottom: 20px;
}
.form-title {
  font-size: 26px;
  font-weight: 700;
  color: #f0f0f2;
  margin: 0 0 8px;
  letter-spacing: -0.03em;
  line-height: 1.1;
}
.form-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.28);
  margin: 0 0 32px;
  line-height: 1.55;
}

/* ── Form fields ──────────────────────────────────────── */
.field-group { margin-bottom: 14px; }

.field-label {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: rgba(255,255,255,0.25);
  text-transform: uppercase;
  margin-bottom: 7px;
}

.field-input {
  width: 100%;
  padding: 12px 14px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  color: #f0f0f2;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  -webkit-appearance: none;
}
.field-input::placeholder { color: rgba(255,255,255,0.1); }
.field-input:focus {
  border-color: rgba(99,102,241,0.55);
  background: rgba(255,255,255,0.05);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

/* ── Submit button ────────────────────────────────────── */
.submit-btn {
  width: 100%;
  padding: 13px;
  margin-top: 10px;
  font-size: 12px;
  font-weight: 700;
  font-family: inherit;
  letter-spacing: 0.1em;
  color: #06060a;
  background: #f0f0f2;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s, background 0.15s;
  text-transform: uppercase;
}
.submit-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
.submit-btn:active:not(:disabled) { transform: translateY(0); }
.submit-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── Error / Spinner ──────────────────────────────────── */
.error-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 13px;
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.18);
  border-radius: 7px;
  font-size: 12.5px;
  color: #fca5a5;
  margin-bottom: 14px;
  line-height: 1.4;
}

.spinner {
  width: 12px; height: 12px;
  border: 2px solid rgba(6,6,10,0.2);
  border-top-color: #06060a;
  border-radius: 50%;
  animation: spin 0.65s linear infinite;
  display: inline-block;
  vertical-align: middle;
  margin-right: 8px;
}

.form-footer {
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.04);
  font-size: 10px;
  color: rgba(255,255,255,0.1);
  letter-spacing: 0.06em;
}

/* ── Mobile stacking ──────────────────────────────────── */
@media (max-width: 768px) {
  .login-root {
    grid-template-columns: 1fr;
  }
  .login-brand {
    display: none;
  }
}
`;

function LoginForm() {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [mustChange, setMustChange] = useState(false);
  const [newPassword, setNewPassword]         = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch('/api/admin/auth/me').then(r => {
      if (r.ok) router.push(searchParams.get('from') || '/admin');
    }).catch(() => {});
  }, [router, searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
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
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true); setError('');
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
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="login-root">

        {/* Corner marks */}
        <div className="corner corner-tl" />
        <div className="corner corner-br" />

        {/* ── Form panel ── */}
        <div className="login-form-panel">
          <div className="form-card">
            <div className="form-eyebrow">Secure Login</div>

            {mustChange ? (
              <>
                <h1 className="form-title">Set New Password</h1>
                <p className="form-sub">Your account requires a password update before continuing.</p>
                <form onSubmit={handleChangePassword}>
                  <div className="field-group">
                    <label className="field-label">New Password</label>
                    <input
                      className="field-input"
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required autoFocus
                    />
                  </div>
                  {error && <div className="error-box">⚠ {error}</div>}
                  <button className="submit-btn" type="submit" disabled={loading}>
                    {loading ? <><span className="spinner" />Updating…</> : 'Set Password'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="form-title">Welcome back.</h1>
                <p className="form-sub">Sign in with your ID to access the admin panel.</p>
                <form onSubmit={handleLogin}>
                  <div className="field-group">
                    <label className="field-label">ID</label>
                    <input
                      className="field-input"
                      type="text"
                      value={employeeId}
                      onChange={e => setEmployeeId(e.target.value.toUpperCase())}
                      placeholder="e.g. ADMIN001"
                      required autoComplete="username" autoFocus
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Password</label>
                    <input
                      className="field-input"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Your password"
                      required autoComplete="current-password"
                    />
                  </div>
                  {error && <div className="error-box">⚠ {error}</div>}
                  <button className="submit-btn" type="submit" disabled={loading}>
                    {loading ? <><span className="spinner" />Signing in…</> : 'Sign In →'}
                  </button>
                </form>
              </>
            )}

            <div className="form-footer">
              Restricted access · DRIPNGRID Internal · {new Date().getFullYear()}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
