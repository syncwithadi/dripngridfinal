"use client"

import { useState } from "react"
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const router = useRouter()

    async function handleSendOTP(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            // Always say success to prevent enumeration, unless error is obvious
            setStep('otp');
            setIsLoading(false);
        } catch (err) {
            setError('An error occurred. Please try again.');
            setIsLoading(false);
        }
    }

    async function handleReset(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true)

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    otp,
                    newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || 'Reset failed');
                setIsLoading(false);
            } else {
                router.push('/account');
            }
        } catch (err) {
            setError('An error occurred');
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[var(--color-bg)]">
            <div className="w-full max-w-md space-y-8 p-8 border border-[var(--color-border)]">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-light tracking-wide text-[var(--color-text)] uppercase">
                        {step === 'email' ? 'Reset Password' : 'New Password'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-[var(--color-text-muted)]">
                        {step === 'email'
                            ? 'Enter your email to receive a reset code.'
                            : 'Enter the code and your new password.'}
                    </p>
                </div>

                {error && (
                    <div className="text-red-500 text-sm text-center bg-red-50 p-2 border border-red-100 dark:bg-red-900/20 dark:border-red-900/50">
                        {error}
                    </div>
                )}

                {step === 'email' ? (
                    <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="block text-xs font-medium tracking-wider text-[var(--color-text-muted)] uppercase mb-2">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full border border-[var(--color-border)] bg-transparent py-3 px-4 text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-text)] focus:outline-none transition-colors sm:text-sm"
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative flex w-full justify-center bg-[var(--color-text)] px-4 py-4 text-sm font-medium tracking-widest text-[var(--color-bg)] uppercase hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Sending..." : "Send Reset Code"}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleReset}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="otp" className="block text-xs font-medium tracking-wider text-[var(--color-text-muted)] uppercase mb-2">
                                    Verification Code
                                </label>
                                <input
                                    id="otp"
                                    name="otp"
                                    type="text"
                                    required
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="block w-full border border-[var(--color-border)] bg-transparent py-3 px-4 text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-text)] focus:outline-none transition-colors sm:text-sm tracking-[0.5em] text-center text-xl"
                                    placeholder="000000"
                                    maxLength={6}
                                />
                            </div>
                            <div>
                                <label htmlFor="newPassword" className="block text-xs font-medium tracking-wider text-[var(--color-text-muted)] uppercase mb-2">
                                    New Password
                                </label>
                                <input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="block w-full border border-[var(--color-border)] bg-transparent py-3 px-4 text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-text)] focus:outline-none transition-colors sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className="block text-xs font-medium tracking-wider text-[var(--color-text-muted)] uppercase mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="block w-full border border-[var(--color-border)] bg-transparent py-3 px-4 text-[var(--color-text)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-text)] focus:outline-none transition-colors sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative flex w-full justify-center bg-[var(--color-text)] px-4 py-4 text-sm font-medium tracking-widest text-[var(--color-bg)] uppercase hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </button>
                        </div>
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => setStep('email')}
                                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline underline-offset-4"
                            >
                                Change Email
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <p className="mt-8 text-center text-sm text-[var(--color-text-muted)]">
                Remember your password?{' '}
                <Link href="/account" className="font-medium text-[var(--color-text)] hover:underline underline-offset-4">
                    Sign in
                </Link>
            </p>
        </div>
    )
}
