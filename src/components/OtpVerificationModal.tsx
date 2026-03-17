'use client';

import { useState, useEffect, useRef } from 'react';

interface OtpVerificationModalProps {
    isOpen: boolean;
    email: string;
    name: string;
    phone?: string;
    onClose: () => void;
    onVerified: (userData: { id: string; name: string; email: string }) => void;
    onNeedsPassword?: (userData: { id: string; name: string; email: string }) => void;
}

export default function OtpVerificationModal({
    isOpen,
    email,
    name,
    phone,
    onClose,
    onVerified,
    onNeedsPassword,
}: OtpVerificationModalProps) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState('');
    const [codeSent, setCodeSent] = useState(false);   // OTP email delivered
    const [verified, setVerified] = useState(false);   // Code confirmed correct
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Auto-send OTP when modal opens (reset state each time)
    useEffect(() => {
        if (isOpen && email) {
            setOtp(['', '', '', '', '', '']);
            setError('');
            setCodeSent(false);
            setVerified(false);
            sendOtp();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, email]);

    // Cooldown timer
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Focus first input when modal opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
    }, [isOpen]);

    const sendOtp = async () => {
        setIsSending(true);
        setError('');
        setCodeSent(false);

        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name }),
            });

            const data = await res.json();

            if (data.success) {
                setCodeSent(true);
                setResendCooldown(60);
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch (err) {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    const handleInputChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);
        setError('');

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when complete
        if (newOtp.every((digit) => digit !== '') && newOtp.join('').length === 6) {
            verifyOtp(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pastedData.length === 6) {
            const newOtp = pastedData.split('');
            setOtp(newOtp);
            verifyOtp(pastedData);
        }
    };

    const verifyOtp = async (otpCode: string) => {
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp: otpCode, name, phone }),
            });

            const data = await res.json();

            if (data.success) {
                // Show the verified checkmark briefly, then hand off
                setVerified(true);
                setTimeout(() => {
                    if (data.user.needsPasswordSet) {
                        if (onNeedsPassword) {
                            onNeedsPassword(data.user);
                        } else {
                            onVerified(data.user);
                        }
                    } else {
                        onVerified(data.user);
                    }
                }, 900); // enough time to see the animation
            } else {
                setError(data.error || 'Invalid code. Please try again.');
                setOtp(['', '', '', '', '', '']);
                setTimeout(() => inputRefs.current[0]?.focus(), 50);
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
            setOtp(['', '', '', '', '', '']);
            setTimeout(() => inputRefs.current[0]?.focus(), 50);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-[var(--color-bg)] border border-[var(--color-border)] shadow-2xl rounded-2xl overflow-hidden animate-fade-in-up">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors z-10"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* ── Sending animation overlay ──────────────────────── */}
                {isSending && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--color-bg)]/95 backdrop-blur-sm">
                        {/* Animated envelope rings */}
                        <div className="relative w-20 h-20 mb-6">
                            {/* Outer pulse ring */}
                            <span className="absolute inset-0 rounded-full border border-[var(--color-text)]/20 animate-ping" />
                            {/* Middle ring */}
                            <span
                                className="absolute inset-2 rounded-full border border-[var(--color-text)]/30"
                                style={{ animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite 0.2s' }}
                            />
                            {/* Icon circle */}
                            <div className="absolute inset-4 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[var(--color-text)]">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                </svg>
                            </div>
                            {/* Animated dots orbiting */}
                            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-text)]/60" style={{ animation: 'orbit 1.2s linear infinite' }} />
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text)] tracking-wide">Sending code…</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">Check your inbox at {email}</p>

                        {/* Progress bar */}
                        <div className="mt-6 w-36 h-0.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--color-text)] rounded-full" style={{ animation: 'progress-sweep 1.8s ease-in-out infinite' }} />
                        </div>
                    </div>
                )}

                {/* ── Verifying animation overlay ────────────────────── */}
                {isLoading && !isSending && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--color-bg)]/95 backdrop-blur-sm">
                        {/* SVG circular progress ring */}
                        <div className="relative w-20 h-20 mb-6">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                                {/* Track */}
                                <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-border)]" />
                                {/* Animated arc */}
                                <circle
                                    cx="32" cy="32" r="26"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeDasharray="163.4"
                                    className="text-[var(--color-text)]"
                                    style={{ animation: 'dash-spin 1.2s ease-in-out infinite' }}
                                />
                            </svg>
                            {/* Centre checkmark shimmer */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6 text-[var(--color-text)] opacity-60">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text)] tracking-wide">Verifying…</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">Just a moment</p>
                    </div>
                )}

                {/* ── Verified success overlay — only after correct code ── */}
                {verified && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[var(--color-bg)]/95 backdrop-blur-sm">
                        <div
                            className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-4"
                            style={{ animation: 'scale-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards' }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-green-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text)]">Verified!</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">Placing your order…</p>
                    </div>
                )}

                {/* Keyframe styles injected inline */}
                <style>{`
                    @keyframes orbit {
                        from { transform: translateX(-50%) rotate(0deg) translateY(-32px) rotate(0deg); }
                        to   { transform: translateX(-50%) rotate(360deg) translateY(-32px) rotate(-360deg); }
                    }
                    @keyframes progress-sweep {
                        0%   { width: 0%; margin-left: 0%; }
                        50%  { width: 70%; margin-left: 15%; }
                        100% { width: 0%; margin-left: 100%; }
                    }
                    @keyframes dash-spin {
                        0%   { stroke-dashoffset: 163.4; }
                        50%  { stroke-dashoffset: 40; }
                        100% { stroke-dashoffset: 163.4; }
                    }
                    @keyframes scale-in {
                        from { opacity: 0; transform: scale(0.5); }
                        to   { opacity: 1; transform: scale(1); }
                    }
                `}</style>

                {/* Header */}
                <div className="p-6 pb-0 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[var(--color-text)]">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-medium text-[var(--color-text)] mb-2">Verify Your Email</h2>
                    <p className="text-sm text-[var(--color-text-muted)]">
                        We've sent a 6-digit code to
                    </p>
                    <p className="text-sm font-medium text-[var(--color-text)] mb-6">
                        {email}
                    </p>
                </div>

                {/* OTP Input */}
                <div className="px-6 pb-6">
                    <div className="flex justify-center gap-2 mb-4">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                disabled={isLoading || isSending}
                                className={`w-11 h-14 text-center text-xl font-medium border rounded-lg bg-[var(--color-bg)]
                                    focus:outline-none focus:border-[var(--color-text)] transition-all duration-200
                                    ${error ? 'border-red-400 bg-red-50/30' : 'border-[var(--color-border)]'}
                                    ${(isLoading || isSending) ? 'opacity-40' : 'hover:border-[var(--color-text)]/40'}`}
                            />
                        ))}
                    </div>

                    {/* Code-sent confirmation (subtle, not an overlay) */}
                    {codeSent && !error && (
                        <p className="text-center text-xs text-green-600 mb-3 flex items-center justify-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                            Code sent — check your inbox
                        </p>
                    )}

                    {/* Error message */}
                    {error && (
                        <p className="text-center text-sm text-red-500 mb-4">{error}</p>
                    )}

                    {/* Resend */}
                    <div className="text-center">
                        {resendCooldown > 0 ? (
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Resend code in <span className="font-medium tabular-nums">{resendCooldown}s</span>
                            </p>
                        ) : (
                            <button
                                onClick={sendOtp}
                                disabled={isSending}
                                className="text-sm text-[var(--color-text)] underline underline-offset-2 hover:no-underline disabled:opacity-50 transition-opacity"
                            >
                                Resend Code
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-[var(--color-bg-secondary)] border-t border-[var(--color-border)]">
                    <p className="text-xs text-center text-[var(--color-text-muted)]">
                        This verifies your email for order updates and creates your account
                    </p>
                </div>
            </div>
        </div>
    );
}
