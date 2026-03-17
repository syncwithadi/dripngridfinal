'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cartStore';
import { useCurrency } from '@/context/CurrencyContext';
import OtpVerificationModal from '@/components/OtpVerificationModal';
import CreatePasswordModal from '@/components/CreatePasswordModal';

declare global {
  interface Window { Razorpay: any; }
}

interface FormData {
  email: string;
  emailNews: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  billingSame: boolean;
}

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry',
];

const inputCls =
  'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 bg-white transition-colors';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { formatPrice } = useCurrency();

  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Wait for Zustand to rehydrate from localStorage before checking cart
  useEffect(() => { setMounted(true); }, []);
  const [discountCode, setDiscountCode] = useState('');
  const [formData, setFormData] = useState<FormData>({
    email: '',
    emailNews: false,
    firstName: '',
    lastName: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: 'West Bengal',
    postalCode: '',
    country: 'India',
    billingSame: true,
  });

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [orderingSuccess, setOrderingSuccess] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    if (session?.user) {
      const nameParts = (session.user.name || '').split(' ');
      setFormData(prev => ({
        ...prev,
        firstName: nameParts[0] || prev.firstName,
        lastName: nameParts.slice(1).join(' ') || prev.lastName,
        email: session.user?.email || prev.email,
      }));
      setIsVerified(true);
    }
  }, [session]);

  useEffect(() => {
    if (paymentMethod === 'razorpay') {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      document.body.appendChild(s);
      return () => { if (document.body.contains(s)) document.body.removeChild(s); };
    }
  }, [paymentMethod]);

  useEffect(() => {
    // Only redirect after hydration — avoids false-empty cart on first render
    if (mounted && items.length === 0 && !orderingSuccess) router.push('/');
  }, [mounted, items, router, orderingSuccess]);

  const subtotal = getSubtotal();
  const shippingCost = 0;
  const total = subtotal + shippingCost;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? target.checked : value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.firstName || !formData.phone) {
      setError('Please fill in all contact details');
      return false;
    }
    if (!formData.line1 || !formData.city || !formData.state || !formData.postalCode) {
      setError('Please fill in all address fields');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const handleOtpVerified = (userData: { id: string; name: string; email: string }) => {
    setIsVerified(true);
    setVerifiedUser(userData);
    setShowOtpModal(false);
    proceedWithCheckout();
  };

  const handlePayment = async () => {
    if (!validateForm()) return;
    setError('');
    if (!session?.user && !isVerified) { setShowOtpModal(true); return; }
    proceedWithCheckout();
  };

  const proceedWithCheckout = async () => {
    setIsLoading(true);
    setError('');
    try {
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            productName: item.name,
            size: item.size,
            color: item.color,
            quantity: item.quantity,
            priceINR: item.priceINR,
          })),
          customer: {
            name: `${formData.firstName} ${formData.lastName}`.trim(),
            email: formData.email,
            phone: formData.phone,
          },
          shippingAddress: {
            line1: formData.line1,
            line2: formData.line2,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            country: formData.country,
          },
          paymentMethod,
          ...(verifiedUser ? { userId: verifiedUser.id } : {}),
        }),
      });
      const orderData = await orderResponse.json();
      if (!orderData.success) throw new Error(orderData.error || 'Failed to create order');

      if (paymentMethod === 'cod') {
        setOrderingSuccess(true);
        clearCart();
        router.push(`/order-confirmation?order=${orderData.order.orderNumber}`);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: total * 100,
        currency: 'INR',
        name: 'DRIPNGRID',
        description: `Order #${orderData.order.orderNumber}`,
        order_id: orderData.order.razorpayOrderId,
        handler: async (response: any) => {
          const verifyRes = await fetch('/api/payment/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderData.order.id,
            }),
          });
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            setOrderingSuccess(true);
            clearCart();
            router.push(`/order-confirmation?order=${orderData.order.orderNumber}`);
          } else {
            setError('Payment verification failed. Please contact support.');
          }
        },
        prefill: { name: `${formData.firstName} ${formData.lastName}`.trim(), email: formData.email, contact: formData.phone },
        theme: { color: '#000000' },
        modal: { ondismiss: () => setIsLoading(false) },
      };
      const rp = new window.Razorpay(options);
      rp.open();
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show nothing until hydrated (avoids flash + premature redirect)
  if (!mounted) return null;
  if (items.length === 0) return null;

  return (
    <>
      {/* ── Minimal checkout header ─────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="w-8" /> {/* spacer */}
        <Link href="/" className="font-['var(--font-luxury)',serif] italic text-2xl font-semibold text-black tracking-tight">
          DRIPNGRID
        </Link>
        <Link href="/checkout" className="text-gray-500 hover:text-black transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
          </svg>
        </Link>
      </div>

      {/* ── Main content ────────────────────────────────────────── */}
      <div className="min-h-screen bg-white pb-16">
        <div className="max-w-[1080px] mx-auto px-4 md:px-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 lg:gap-16">

            {/* ── LEFT: Form ─────────────────────────────────────── */}
            <div className="space-y-10">

              {/* Contact */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-black">Contact</h2>
                  {!session?.user && (
                    <button
                      onClick={() => setShowOtpModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Sign in
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!!session?.user?.email}
                    className={inputCls}
                  />
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      name="emailNews"
                      checked={formData.emailNews}
                      onChange={handleChange}
                      className="w-4 h-4 accent-black"
                    />
                    <span className="text-sm text-gray-600">Email me with news and offers</span>
                  </label>
                </div>
              </section>

              {/* Delivery */}
              <section>
                <h2 className="text-base font-semibold text-black mb-4">Delivery</h2>
                <div className="space-y-3">
                  {/* Country */}
                  <select name="country" value={formData.country} onChange={handleChange} className={inputCls}>
                    <option value="India">India</option>
                    <option value="UAE" disabled>UAE — Coming Soon</option>
                  </select>

                  {/* First + Last name */}
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" name="firstName" placeholder="First name" value={formData.firstName} onChange={handleChange} className={inputCls} />
                    <input type="text" name="lastName" placeholder="Last name" value={formData.lastName} onChange={handleChange} className={inputCls} />
                  </div>

                  {/* Address */}
                  <input type="text" name="line1" placeholder="Address" value={formData.line1} onChange={handleChange} className={inputCls} />
                  <input type="text" name="line2" placeholder="Apartment, suite, etc. (optional)" value={formData.line2} onChange={handleChange} className={inputCls} />

                  {/* City + State + PIN */}
                  <div className="grid grid-cols-3 gap-3">
                    <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} className={inputCls} />
                    <select name="state" value={formData.state} onChange={handleChange} className={inputCls}>
                      {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="text" name="postalCode" placeholder="PIN code" value={formData.postalCode} onChange={handleChange} className={`${inputCls} [appearance:textfield]`} />
                  </div>

                  {/* Phone */}
                  <input type="tel" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} className={inputCls} />
                </div>
              </section>

              {/* Shipping method */}
              <section>
                <h2 className="text-base font-semibold text-black mb-4">Shipping method</h2>
                <div className="border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500 bg-gray-50">
                  Enter your shipping address to view available shipping methods.
                </div>
              </section>

              {/* Payment */}
              <section>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-black">Payment</h2>
                  {/* Lock icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-gray-400">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs text-gray-400 mb-4">All transactions are secure and encrypted.</p>

                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
                  {/* Razorpay / Online Payment */}
                  <label className={`flex items-start gap-3 px-4 py-4 cursor-pointer transition-colors ${paymentMethod === 'razorpay' ? 'bg-slate-50' : 'bg-white hover:bg-gray-50'}`}>
                    <input type="radio" name="pm" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} className="mt-1 accent-black" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-black">Online Payment</span>
                        {/* Payment brand badges */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Razorpay */}
                          <span className="inline-flex items-center px-2 py-0.5 rounded border border-gray-200 bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/icons/razorpay.svg" alt="Razorpay" className="h-3.5 w-auto" />
                          </span>
                          {/* Visa */}
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-white">
                            <svg viewBox="0 0 38 12" className="h-3.5 w-auto" xmlns="http://www.w3.org/2000/svg">
                              <text x="1" y="10" fontFamily="Arial Black,sans-serif" fontSize="10" fontWeight="900" fontStyle="italic" fill="#1a1f71" letterSpacing="0.5">VISA</text>
                            </svg>
                          </span>
                          {/* Mastercard */}
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-white">
                            <svg viewBox="0 0 34 22" className="h-3.5 w-auto" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="11" r="10" fill="#EB001B"/>
                              <circle cx="22" cy="11" r="10" fill="#F79E1B"/>
                              <path d="M17 3.8a10 10 0 0 1 0 14.4A10 10 0 0 1 17 3.8z" fill="#FF5F00"/>
                            </svg>
                          </span>
                          {/* UPI */}
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-white">
                            <svg viewBox="0 0 32 12" className="h-3.5 w-auto" xmlns="http://www.w3.org/2000/svg">
                              <text x="1" y="10" fontFamily="Arial,sans-serif" fontSize="9.5" fontWeight="800" fill="#6c3aab" letterSpacing="0.5">UPI</text>
                            </svg>
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">UPI · Credit/Debit Cards · Net Banking · Wallets</p>
                      {paymentMethod === 'razorpay' && (
                        <div className="mt-3 flex items-center gap-1.5 bg-white border border-gray-100 rounded-lg px-3 py-2.5">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400 flex-shrink-0">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                          <p className="text-xs text-gray-500">
                            You'll be securely redirected to Razorpay to complete payment.
                          </p>
                        </div>
                      )}
                    </div>
                  </label>

                  {/* COD */}
                  <label className={`flex items-start gap-3 px-4 py-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'bg-slate-50' : 'bg-white hover:bg-gray-50'}`}>
                    <input type="radio" name="pm" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="mt-1 accent-black" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-black">Cash on Delivery</span>
                        {/* COD icon */}
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-200 bg-white">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-gray-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                          </svg>
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Pay with cash when your order arrives</p>
                    </div>
                  </label>
                </div>
              </section>

              {/* Billing address */}
              <section>
                <h2 className="text-base font-semibold text-black mb-4">Billing address</h2>
                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
                  <label className={`flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors ${formData.billingSame ? 'bg-blue-50/60' : 'bg-white hover:bg-gray-50'}`}>
                    <input type="radio" name="billing" checked={formData.billingSame} onChange={() => setFormData(p => ({ ...p, billingSame: true }))} className="accent-black" />
                    <span className="text-sm text-black">Same as shipping address</span>
                  </label>
                  <label className={`flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors ${!formData.billingSame ? 'bg-blue-50/60' : 'bg-white hover:bg-gray-50'}`}>
                    <input type="radio" name="billing" checked={!formData.billingSame} onChange={() => setFormData(p => ({ ...p, billingSame: false }))} className="accent-black" />
                    <span className="text-sm text-black">Use a different billing address</span>
                  </label>
                </div>
              </section>

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Pay now button */}
              <button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full bg-black text-white py-4 rounded-xl text-sm font-semibold tracking-wide hover:bg-black/90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-wait transition-all duration-200"
              >
                {isLoading ? 'Processing…' : paymentMethod === 'cod' ? 'Place Order' : `Pay now`}
              </button>

              {/* Footer links */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-gray-400 pb-4">
                {[['Refund policy', '/terms'], ['Shipping', '/terms'], ['Privacy policy', '/privacy'], ['Terms of service', '/terms']].map(([label, href]) => (
                  <Link key={label} href={href} className="hover:text-gray-600 transition-colors">{label}</Link>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Order Summary ─────────────────────────────── */}
            <div className="lg:sticky lg:top-[72px] lg:self-start">
              <div className="border-l border-gray-100 lg:pl-8">

                {/* Items */}
                <div className="space-y-5 mb-6">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-4">
                      {/* Image with qty badge */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-20 bg-[#f5f5f3] rounded-lg overflow-hidden relative">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" />
                          ) : (
                            <div className="absolute inset-0 bg-gray-100" />
                          )}
                        </div>
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-500 text-white text-[10px] font-medium flex items-center justify-center rounded-full">
                          {item.quantity}
                        </span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-black leading-tight">{item.name}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{item.size}</p>
                      </div>
                      <span className="text-sm font-medium text-black">
                        {formatPrice(item.priceINR * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Discount code */}
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    placeholder="Discount code or gift card"
                    value={discountCode}
                    onChange={e => setDiscountCode(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                  />
                  <button className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:border-gray-400 hover:text-black transition-colors">
                    Apply
                  </button>
                </div>

                {/* Totals */}
                <div className="space-y-3 border-t border-gray-100 pt-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-medium text-black">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Shipping</span>
                    <span className="text-gray-400">
                      {shippingCost === 0 ? 'Enter shipping address' : formatPrice(shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-base font-semibold text-black">Total</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 mr-1">INR</span>
                      <span className="text-xl font-bold text-black">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* OTP Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        email={formData.email}
        name={`${formData.firstName} ${formData.lastName}`.trim()}
        phone={formData.phone}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleOtpVerified}
        onNeedsPassword={(userData) => {
          setShowOtpModal(false);
          setVerifiedUser(userData);
          setShowPasswordModal(true);
        }}
      />
      <CreatePasswordModal
        isOpen={showPasswordModal}
        email={verifiedUser?.email || formData.email}
        userId={verifiedUser?.id || ''}
        onClose={() => setShowPasswordModal(false)}
        onPasswordSet={() => {
          setShowPasswordModal(false);
          setIsVerified(true);
          proceedWithCheckout();
        }}
      />
    </>
  );
}
