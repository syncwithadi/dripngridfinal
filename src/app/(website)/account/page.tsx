"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Step = 'email' | 'otp'

interface Address {
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
}

interface UserProfile {
  name: string
  phone: string
  alternatePhone: string
  address: Address
}

const emptyAddress: Address = { line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' }
const emptyProfile: UserProfile = { name: '', phone: '', alternatePhone: '', address: emptyAddress }

export default function AccountPage() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()

  // ── Login state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [countdown, setCountdown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── Dashboard state ── ────────────────────────────────────────────────────
  const [orderCount, setOrderCount] = useState<number | null>(null)
  const [profile, setProfile] = useState<UserProfile>(emptyProfile)
  const [editMode, setEditMode] = useState(false)
  const [editProfile, setEditProfile] = useState<UserProfile>(emptyProfile)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    if (session?.user?.email) {
      // Fetch order count
      fetch(`/api/orders?email=${encodeURIComponent(session.user.email)}`)
        .then(r => r.json())
        .then(d => { if (d.success && Array.isArray(d.order)) setOrderCount(d.order.length) })
        .catch(() => { })

      // Fetch full user profile (name, phone, address)
      fetch('/api/user/profile')
        .then(r => r.json())
        .then(d => {
          if (d.success && d.user) {
            const u = d.user
            const p: UserProfile = {
              name: u.name || session.user?.name || '',
              phone: u.phone || '',
              alternatePhone: u.alternatePhone || '',
              address: {
                line1: u.address?.line1 || '',
                line2: u.address?.line2 || '',
                city: u.address?.city || '',
                state: u.address?.state || '',
                postalCode: u.address?.postalCode || '',
                country: u.address?.country || 'India',
              },
            }
            setProfile(p)
            setEditProfile(p)
          }
        })
        .catch(() => { })
    }
  }, [session])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send code.')
      } else {
        setStep('otp')
        setInfo(`Code sent to ${email}`)
        setCountdown(60)
        setTimeout(() => otpRefs.current[0]?.focus(), 100)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    const otpString = otp.join('')
    if (otpString.length < 6) { setError('Please enter all 6 digits.'); return }
    setError('')
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otpString }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid code.')
        setIsLoading(false)
        return
      }
      const result = await signIn('credentials', {
        email: email.trim(),
        loginToken: data.loginToken,
        redirect: false,
      })
      if (result?.error) {
        setError('Sign-in failed. Please try again.')
        setIsLoading(false)
      } else {
        router.refresh()
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  function handleOtpInput(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
  }

  function handleOtpKey(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      otpRefs.current[5]?.focus()
    }
    e.preventDefault()
  }

  async function handleResend() {
    if (countdown > 0) return
    setError('')
    setOtp(['', '', '', '', '', ''])
    setIsLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Could not resend.') }
      else { setInfo('New code sent.'); setCountdown(60); otpRefs.current[0]?.focus() }
    } catch {
      setError('Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editProfile),
      })
      const data = await res.json()
      if (data.success) {
        setProfile(editProfile)
        setEditMode(false)
        setSaveMsg('Profile updated!')
        // Update session name if changed
        if (editProfile.name !== session?.user?.name) {
          await updateSession({ name: editProfile.name })
        }
        setTimeout(() => setSaveMsg(''), 3000)
      } else {
        setSaveMsg(data.error || 'Failed to save.')
      }
    } catch {
      setSaveMsg('Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f3]">
        <div className="w-5 h-5 border border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── DASHBOARD (logged in) ─────────────────────────────────────────────────
  if (session?.user) {
    const initial = (session.user.name || session.user.email || 'A').charAt(0).toUpperCase()
    const displayName = session.user.name || session.user.email?.split('@')[0] || 'Member'

    return (
      <div className="min-h-screen bg-white">
        {/* Top bar */}
        <div className="border-b border-[var(--color-border)]">
          <div className="container-custom py-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--color-text-muted)]">Member Account</p>
              <h1 className="text-xl font-light tracking-wide mt-0.5">{displayName}</h1>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-muted)] hover:text-black transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="container-custom py-12 max-w-3xl">
          {/* Identity block */}
          <div className="flex items-start gap-8 mb-10">
            <div className="w-20 h-20 bg-black flex-shrink-0 flex items-center justify-center">
              {session.user.image ? (
                <img src={session.user.image} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-light text-white">{initial}</span>
              )}
            </div>
            <div className="flex-1 pt-1">
              <h2 className="text-2xl font-light tracking-wide mb-1">{displayName}</h2>
              <p className="text-sm text-[var(--color-text-muted)]">{session.user.email}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
                  <span className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-muted)]">Verified Member</span>
                </div>
                <button
                  onClick={() => { setEditMode(true); setEditProfile(profile) }}
                  className="text-[10px] tracking-[0.2em] uppercase text-black underline underline-offset-4 hover:opacity-60 transition-opacity"
                >
                  Edit Profile
                </button>
              </div>
              {saveMsg && <p className="text-[11px] text-green-600 mt-2">{saveMsg}</p>}
            </div>
          </div>

          <div className="h-px bg-[var(--color-border)] mb-10" />

          {/* ── EDIT PROFILE FORM ─────────────────────────────────────── */}
          {editMode && (
            <form onSubmit={handleSaveProfile} className="mb-12 space-y-6 bg-[#f9f8f6] border border-[var(--color-border)] p-6 md:p-8 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--color-text-muted)]">Edit Profile</h3>
                <button type="button" onClick={() => setEditMode(false)} className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-muted)] hover:text-black transition-colors">
                  Cancel
                </button>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-muted)] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editProfile.name}
                    onChange={e => setEditProfile(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors rounded"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-muted)] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editProfile.phone}
                    onChange={e => setEditProfile(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors rounded"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <p className="text-[10px] tracking-[0.15em] uppercase text-[var(--color-text-muted)] mb-3">Shipping Address</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editProfile.address.line1}
                    onChange={e => setEditProfile(p => ({ ...p, address: { ...p.address, line1: e.target.value } }))}
                    className="w-full border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors rounded"
                    placeholder="Address line 1"
                  />
                  <input
                    type="text"
                    value={editProfile.address.line2}
                    onChange={e => setEditProfile(p => ({ ...p, address: { ...p.address, line2: e.target.value } }))}
                    className="w-full border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors rounded"
                    placeholder="Apartment, floor, etc. (optional)"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editProfile.address.city}
                      onChange={e => setEditProfile(p => ({ ...p, address: { ...p.address, city: e.target.value } }))}
                      className="w-full border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors rounded"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={editProfile.address.state}
                      onChange={e => setEditProfile(p => ({ ...p, address: { ...p.address, state: e.target.value } }))}
                      className="w-full border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors rounded"
                      placeholder="State"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={editProfile.address.postalCode}
                      onChange={e => setEditProfile(p => ({ ...p, address: { ...p.address, postalCode: e.target.value } }))}
                      className="w-full border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors rounded"
                      placeholder="Postal code"
                    />
                    <input
                      type="text"
                      value={editProfile.address.country}
                      onChange={e => setEditProfile(p => ({ ...p, address: { ...p.address, country: e.target.value } }))}
                      className="w-full border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors rounded"
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-black text-white py-3 text-[11px] font-semibold tracking-[0.18em] uppercase hover:bg-black/90 transition-colors rounded disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-[var(--color-border)] mb-12">
            <div className="bg-white p-6">
              <p className="text-3xl font-light">{orderCount ?? '—'}</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-muted)] mt-1">Orders</p>
            </div>
            <div className="bg-white p-6">
              <p className="text-3xl font-light">—</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-muted)] mt-1">Saved Items</p>
            </div>
            <div className="bg-white p-6 hidden sm:block">
              <p className="text-3xl font-light truncate text-base pt-1">{profile.address.city || '—'}</p>
              <p className="text-[10px] tracking-[0.2em] uppercase text-[var(--color-text-muted)] mt-1">Delivery City</p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-px bg-[var(--color-border)]">
            {[
              { href: '/orders', label: 'Order History', sub: 'View and track your purchases' },
              { href: '/wishlist', label: 'Saved Items', sub: 'Your curated wishlist' },
              { href: '/faq', label: 'Help & Support', sub: 'FAQs and contact options' },
            ].map(({ href, label, sub }) => (
              <Link key={href} href={href} className="group flex items-center justify-between bg-white p-6 hover:bg-[var(--color-bg-secondary)] transition-colors">
                <div>
                  <p className="text-sm font-light tracking-wide">{label}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">{sub}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-black transition-colors">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── LOGIN PAGE ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');`}</style>

      <div className="min-h-screen bg-[#f5f5f3] flex flex-col items-center justify-center px-4 py-12">


        {/* Login Card */}
        <div className="w-full max-w-[420px] bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

          {/* Logo area */}
          <div className="pt-10 pb-6 px-8 text-center border-b border-gray-100">
            <p style={{ fontFamily: "'Great Vibes', cursive" }} className="text-5xl text-black leading-tight">
              Dripngrid
            </p>
          </div>

          {/* Form area */}
          <div className="px-8 py-8">
            {step === 'email' && (
              <>
                <h2 className="text-xl font-semibold text-black mb-1">Sign in</h2>
                <p className="text-sm text-gray-500 mb-6">Enter your email and we'll send you a verification code</p>

                {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

                <form onSubmit={handleSendOtp} className="space-y-3">
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    placeholder="Email"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-black placeholder:text-gray-400 outline-none focus:border-gray-400 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Sending…' : 'Continue'}
                  </button>
                </form>
              </>
            )}

            {step === 'otp' && (
              <>
                <h2 className="text-xl font-semibold text-black mb-1">Check your inbox</h2>
                {!error && <p className="text-sm text-gray-500 mb-6">{info}</p>}
                {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  {/* OTP boxes */}
                  <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpInput(i, e.target.value)}
                        onKeyDown={e => handleOtpKey(i, e)}
                        className="w-full aspect-square text-center text-xl font-medium border border-gray-200 rounded-xl outline-none focus:border-gray-500 transition-colors bg-gray-50"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.join('').length < 6}
                    className="w-full bg-black text-white rounded-xl py-3.5 text-sm font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying…' : 'Verify & Sign In'}
                  </button>
                </form>

                <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                  <button type="button" onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); setError('') }}
                    className="hover:text-black transition-colors">
                    ← Change email
                  </button>
                  <button type="button" onClick={handleResend} disabled={countdown > 0}
                    className="hover:text-black transition-colors disabled:opacity-40">
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-6 flex items-center gap-4 text-xs text-gray-400">
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy policy</Link>
          <span>·</span>
          <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms of service</Link>
        </div>

      </div>
    </>
  )
}
