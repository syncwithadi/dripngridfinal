'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  requestId: string;
  couponCode: string;
  onSuccess: () => void;
  onClose: () => void;
}

const OTP_TTL = 5 * 60; // 5 minutes in seconds
const MAX_ATTEMPTS = 3;

export default function OTPModal({ requestId, couponCode, onSuccess, onClose }: Props) {
  const [otp, setOtp] = useState('');
  const [timeLeft, setTimeLeft] = useState(OTP_TTL);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const secs = String(timeLeft % 60).padStart(2, '0');
  const expired = timeLeft === 0;

  async function handleVerify() {
    if (!otp || otp.length !== 6) { setError('Enter the 6-digit OTP.'); return; }
    if (expired) { setError('OTP has expired. Please resend.'); return; }
    setVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/admin/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, otp, action: 'approve' }),
      });
      const data = await res.json();
      if (data.ok) {
        onSuccess();
      } else if (data.blocked) {
        setBlocked(true);
        setError('Maximum attempts exceeded. Request blocked.');
      } else {
        setAttempts(a => a + 1);
        setError(data.error || 'Incorrect OTP.');
        setOtp('');
        inputRef.current?.focus();
      }
    } catch {
      setError('Verification failed. Try again.');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError('');
    try {
      const res = await fetch('/api/admin/coupons/verify', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      });
      if (res.ok) {
        setTimeLeft(OTP_TTL);
        setAttempts(0);
        setOtp('');
        setBlocked(false);
        inputRef.current?.focus();
      } else {
        const d = await res.json();
        setError(d.error || 'Failed to resend OTP.');
      }
    } catch {
      setError('Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, backdropFilter: 'blur(3px)' }}
      />
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, background: 'var(--as-card)',
          border: '1px solid var(--as-border)', borderRadius: 12,
          zIndex: 301, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--as-text)', marginBottom: 6 }}>
            Approve Coupon
          </div>
          <div style={{ fontSize: 13, color: 'var(--as-muted)', lineHeight: 1.5 }}>
            Enter the OTP sent to the Super Admin email to approve <strong style={{ color: 'var(--as-text)' }}>{couponCode}</strong>
          </div>
        </div>

        {/* OTP Input */}
        <div style={{ marginBottom: 16 }}>
          <input
            ref={inputRef}
            type="text"
            value={otp}
            onChange={e => {
              const v = e.target.value.replace(/\D/g, '').slice(0, 6);
              setOtp(v);
              setError('');
            }}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            placeholder="000000"
            maxLength={6}
            disabled={blocked || verifying}
            style={{
              textAlign: 'center',
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '0.3em',
              padding: '14px 16px',
              width: '100%',
            }}
          />
        </div>

        {/* Timer */}
        <div style={{ textAlign: 'center', fontSize: 12, color: expired ? 'var(--as-badge-red-text)' : 'var(--as-muted)', marginBottom: 16 }}>
          {expired ? 'OTP expired' : `Expires in ${mins}:${secs}`}
          {` · ${MAX_ATTEMPTS - attempts} attempt${MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} left`}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--as-border)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(timeLeft / OTP_TTL) * 100}%`,
            background: timeLeft < 60 ? 'var(--as-badge-red-text)' : 'var(--as-accent)',
            transition: 'width 1s linear, background 0.3s',
            borderRadius: 2,
          }} />
        </div>

        {error && (
          <div style={{ fontSize: 12, color: 'var(--as-badge-red-text)', textAlign: 'center', marginBottom: 14, padding: '8px 12px', background: 'var(--as-badge-red)', borderRadius: 6 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleVerify}
            disabled={verifying || blocked || otp.length !== 6}
            style={{
              flex: 1, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'var(--as-accent)', color: 'var(--as-bg)',
              border: 'none', borderRadius: 6, transition: 'opacity 0.12s',
              opacity: (verifying || blocked || otp.length !== 6) ? 0.5 : 1,
            }}
          >
            {verifying ? 'Verifying...' : 'Approve'}
          </button>

          {(expired || blocked) && (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                padding: '11px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
                background: 'transparent', color: 'var(--as-text)',
                border: '1px solid var(--as-border)', borderRadius: 6,
              }}
            >
              {resending ? '...' : 'Resend'}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              padding: '11px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              background: 'transparent', color: 'var(--as-muted)',
              border: '1px solid var(--as-border)', borderRadius: 6,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
