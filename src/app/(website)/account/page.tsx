"use client"

import { signIn, signOut, useSession } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCurrency } from '@/context/CurrencyContext'

type Step = 'email' | 'otp'
type Tab = 'orders' | 'address' | 'account'

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

interface OrderItem {
  productName: string
  quantity: number
  size: string
  color: string
  priceINR: number
  imageUrl?: string
}

interface Order {
  _id: string
  orderNumber: string
  total: number
  currency: string
  status: string
  paymentStatus: string
  createdAt: string
  shippingAddress?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
  }
  items: OrderItem[]
}

const emptyAddress: Address = { line1: '', line2: '', city: '', state: '', postalCode: '', country: 'India' }
const emptyProfile: UserProfile = { name: '', phone: '', alternatePhone: '', address: emptyAddress }

const deliveryStatusConfig: Record<string, { label: string; color: string; dot: string }> = {
  pending:    { label: 'Pending',    color: 'text-amber-600',  dot: 'bg-amber-400' },
  confirmed:  { label: 'Confirmed',  color: 'text-blue-600',   dot: 'bg-blue-500' },
  processing: { label: 'Processing', color: 'text-purple-600', dot: 'bg-purple-500' },
  shipped:    { label: 'Shipped',    color: 'text-indigo-600', dot: 'bg-indigo-500' },
  delivered:  { label: 'Delivered',  color: 'text-green-600',  dot: 'bg-green-500' },
  cancelled:  { label: 'Cancelled',  color: 'text-red-500',    dot: 'bg-red-400' },
}

const paymentStatusConfig: Record<string, { label: string; color: string }> = {
  paid:    { label: 'Paid',    color: 'text-green-600' },
  pending: { label: 'Pending', color: 'text-amber-600' },
  failed:  { label: 'Failed',  color: 'text-red-500' },
  cod:     { label: 'COD',     color: 'text-blue-600' },
}

export default function AccountPage() {
  const { data: session, status, update: updateSession } = useSession()
  const router = useRouter()
  const { formatPrice } = useCurrency()

  // ── Login state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [countdown, setCountdown] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // ── Dashboard state ───────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile>(emptyProfile)
  const [editProfile, setEditProfile] = useState<UserProfile>(emptyProfile)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    if (session?.user?.email) {
      // Fetch orders
      setOrdersLoading(true)
      fetch(`/api/orders?email=${encodeURIComponent(session.user.email)}`)
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setOrders(Array.isArray(d.order) ? d.order : [d.order].filter(Boolean))
          }
        })
        .catch(() => { })
        .finally(() => setOrdersLoading(false))

      // Fetch full user profile
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
        setSaveMsg('Saved successfully.')
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-5 h-5 border border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── DASHBOARD (logged in) ─────────────────────────────────────────────────
  if (session?.user) {
    const initial = (session.user.name || session.user.email || 'A').charAt(0).toUpperCase()
    const displayName = session.user.name || session.user.email?.split('@')[0] || 'Member'

    const sidebarItems: { id: Tab; label: string }[] = [
      { id: 'orders',  label: 'Order history' },
      { id: 'address', label: 'Shipping Address' },
      { id: 'account', label: 'Account details' },
    ]

    return (
      <div className="min-h-screen bg-[#f7f7f5]">
        <div className="max-w-[1200px] mx-auto px-4 md:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start">

            {/* ── SIDEBAR ─────────────────────────────────────────────── */}
            <aside className="w-full md:w-[260px] md:sticky md:top-24 flex-shrink-0">
              <div className="bg-white border border-gray-200 overflow-hidden">
                {/* User block */}
                <div className="px-6 py-6 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-black flex-shrink-0 flex items-center justify-center">
                      {session.user.image ? (
                        <img src={session.user.image} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-light text-white">{initial}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-black truncate">{displayName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{session.user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Nav items */}
                <nav className="py-2">
                  {sidebarItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full text-left px-6 py-3.5 text-sm transition-colors flex items-center justify-between group ${
                        activeTab === item.id
                          ? 'text-black font-medium bg-gray-50'
                          : 'text-gray-500 hover:text-black hover:bg-gray-50'
                      }`}
                    >
                      <span>{item.label}</span>
                      {activeTab === item.id && (
                        <span className="w-1 h-4 bg-black flex-shrink-0" />
                      )}
                    </button>
                  ))}

                  <div className="mx-6 my-2 h-px bg-gray-100" />

                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full text-left px-6 py-3.5 text-sm text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Log out
                  </button>
                </nav>
              </div>
            </aside>

            {/* ── MAIN CONTENT ─────────────────────────────────────────── */}
            <main className="flex-1 min-w-0">

              {/* ── ORDER HISTORY ─── */}
              {activeTab === 'orders' && (
                <div>
                  <div className="flex items-baseline justify-between mb-6">
                    <h2 className="text-lg font-semibold text-black tracking-wide">Order History</h2>
                    {orders.length > 0 && (
                      <span className="text-xs text-gray-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>

                  {ordersLoading ? (
                    <div className="bg-white border border-gray-200 p-16 flex items-center justify-center">
                      <div className="w-5 h-5 border border-black border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="bg-white border border-gray-200 px-8 py-16 text-center">
                      <div className="w-14 h-14 mx-auto mb-5 border border-gray-200 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-7 h-7 text-gray-300">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500 mb-5">No orders placed yet.</p>
                      <Link href="/shop" className="inline-block px-6 py-3 bg-black text-white text-xs font-semibold tracking-widest uppercase hover:bg-black/80 transition-colors">
                        Shop Now
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const delivery = deliveryStatusConfig[order.status] || { label: order.status, color: 'text-gray-500', dot: 'bg-gray-400' }
                        const payment = paymentStatusConfig[order.paymentStatus] || { label: order.paymentStatus, color: 'text-gray-500' }
                        const firstItem = order.items?.[0]
                        const extraCount = (order.items?.length || 0) - 1

                        return (
                          <div key={order._id} className="bg-white border border-gray-200 overflow-hidden">
                            {/* Order header row */}
                            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] mb-0.5">Order ID</p>
                                <p className="text-sm font-semibold text-black">{order.orderNumber}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] mb-0.5">Date</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                            </div>

                            {/* Product row */}
                            <div className="px-5 py-5">
                              <div className="flex gap-4">
                                {/* Product image placeholder */}
                                <div className="w-16 h-20 bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                  {firstItem?.imageUrl ? (
                                    <img src={firstItem.imageUrl} alt={firstItem.productName} className="w-full h-full object-cover" />
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-6 h-6 text-gray-300">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                    </svg>
                                  )}
                                </div>

                                {/* Product details */}
                                <div className="flex-1 min-w-0">
                                  {firstItem && (
                                    <>
                                      <p className="text-sm font-semibold text-black mb-1 truncate">{firstItem.productName}</p>
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
                                        <span className="text-[11px] text-gray-500">Size: <span className="text-black">{firstItem.size}</span></span>
                                        {firstItem.color && (
                                          <span className="text-[11px] text-gray-500">Color: <span className="text-black">{firstItem.color}</span></span>
                                        )}
                                        <span className="text-[11px] text-gray-500">Qty: <span className="text-black">{firstItem.quantity}</span></span>
                                      </div>
                                      <p className="text-sm font-semibold text-black">{formatPrice(order.total)}</p>
                                      {extraCount > 0 && (
                                        <p className="text-[11px] text-gray-400 mt-1">+{extraCount} more item{extraCount !== 1 ? 's' : ''}</p>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Status row */}
                              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400 uppercase tracking-[0.15em]">Payment</span>
                                  <span className={`text-[11px] font-semibold ${payment.color}`}>{payment.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400 uppercase tracking-[0.15em]">Delivery</span>
                                  <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${delivery.color}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${delivery.dot}`} />
                                    {delivery.label}
                                  </span>
                                </div>
                                {order.shippingAddress?.city && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400 uppercase tracking-[0.15em]">To</span>
                                    <span className="text-[11px] text-gray-600">
                                      {[order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="mt-4 flex items-center gap-3">
                                <Link
                                  href={`/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                                  className="px-4 py-2.5 bg-black text-white text-[10px] font-bold tracking-[0.18em] uppercase hover:bg-black/80 transition-colors"
                                >
                                  Track Order
                                </Link>
                                <button
                                  type="button"
                                  className="px-4 py-2.5 border border-gray-300 text-[10px] font-bold tracking-[0.18em] uppercase text-gray-600 hover:border-black hover:text-black transition-colors"
                                >
                                  Return / Exchange
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── SHIPPING ADDRESS ─── */}
              {activeTab === 'address' && (
                <div>
                  <h2 className="text-lg font-semibold text-black tracking-wide mb-6">Shipping Address</h2>
                  <form onSubmit={handleSaveProfile} className="bg-white border border-gray-200 p-6 md:p-8 space-y-4">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5">Address Line 1</label>
                        <input
                          type="text"
                          value={editProfile.address.line1}
                          onChange={e => setEditProfile(p => ({ ...p, address: { ...p.address, line1: e.target.value } }))}
                          className="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                          placeholder="Street address"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5">Address Line 2</label>
                        <input
                          type="text"
                          value={editProfile.address.line2}
                          onChange={e => setEditProfile(p => ({ ...p, address: { ...p.address, line2: e.target.value } }))}
                          className="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                          placeholder="Apartment, floor, etc. (optional)"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5">City</label>
                          <input
                            type="text"
                            value={editProfile.address.city}
                            onChange={e => setEditProfile(p => ({ ...p, address: { ...p.address, city: e.target.value } }))}
                            className="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5">State</label>
                          <input
                            type="text"
                            value={editProfile.address.state}
                            onChange={e => setEditProfile(p => ({ ...p, address: { ...p.address, state: e.target.value } }))}
                            className="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                            placeholder="State"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5">Postal Code</label>
                          <input
                            type="text"
                            value={editProfile.address.postalCode}
                            onChange={e => setEditProfile(p => ({ ...p, address: { ...p.address, postalCode: e.target.value } }))}
                            className="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                            placeholder="PIN code"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5">Country</label>
                          <input
                            type="text"
                            value={editProfile.address.country}
                            onChange={e => setEditProfile(p => ({ ...p, address: { ...p.address, country: e.target.value } }))}
                            className="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                            placeholder="Country"
                          />
                        </div>
                      </div>
                    </div>

                    {saveMsg && (
                      <p className={`text-xs ${saveMsg.includes('success') || saveMsg.includes('Saved') ? 'text-green-600' : 'text-red-500'}`}>
                        {saveMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-black text-white py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save Address'}
                    </button>
                  </form>
                </div>
              )}

              {/* ── ACCOUNT DETAILS ─── */}
              {activeTab === 'account' && (
                <div>
                  <h2 className="text-lg font-semibold text-black tracking-wide mb-6">Account Details</h2>
                  <form onSubmit={handleSaveProfile} className="bg-white border border-gray-200 p-6 md:p-8 space-y-4">
                    {/* Read-only email */}
                    <div>
                      <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5">Email Address</label>
                      <div className="border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">
                        {session.user.email}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5">Full Name</label>
                        <input
                          type="text"
                          value={editProfile.name}
                          onChange={e => setEditProfile(p => ({ ...p, name: e.target.value }))}
                          className="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1.5">Phone</label>
                        <input
                          type="tel"
                          value={editProfile.phone}
                          onChange={e => setEditProfile(p => ({ ...p, phone: e.target.value }))}
                          className="w-full border border-gray-200 px-3 py-2.5 text-sm text-black focus:outline-none focus:border-black transition-colors"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                    </div>

                    {saveMsg && (
                      <p className={`text-xs ${saveMsg.includes('success') || saveMsg.includes('Saved') ? 'text-green-600' : 'text-red-500'}`}>
                        {saveMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full bg-black text-white py-3 text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-black/80 transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

            </main>
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
                <p className="text-sm text-gray-500 mb-6">Enter your email and we&rsquo;ll send you a verification code</p>

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
