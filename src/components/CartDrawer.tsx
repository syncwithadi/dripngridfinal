'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useCurrency } from '@/context/CurrencyContext';

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getSubtotal,
  } = useCartStore();
  const { formatPrice } = useCurrency();

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const subtotal = getSubtotal();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-[var(--z-overlay)] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-white z-[var(--z-modal)]
          transform transition-transform duration-300 ease-out flex flex-col shadow-2xl ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-medium text-black tracking-wide">
            Your cart
          </h2>
          <button
            onClick={closeCart}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100"
            aria-label="Close cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Cart Items ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-14 h-14 text-gray-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500 mb-3">Your cart is empty</p>
                <button
                  onClick={closeCart}
                  className="text-xs font-semibold tracking-widest uppercase text-black underline underline-offset-4"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="py-5 flex gap-4">
                  {/* Product image */}
                  <div className="relative w-[80px] h-[100px] bg-[#f5f5f3] flex-shrink-0 rounded-md overflow-hidden">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-gray-100" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col min-w-0">
                    {/* Name + Price row */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-black leading-snug line-clamp-2">
                        {item.name}
                      </h3>
                      <span className="text-sm font-medium text-black whitespace-nowrap flex-shrink-0">
                        {formatPrice(item.priceINR * item.quantity)}
                      </span>
                    </div>

                    {/* Size / colour */}
                    <p className="text-[11px] text-gray-400 mb-auto">
                      {[item.size, item.color].filter(Boolean).join(' / ')}
                    </p>

                    {/* Qty controls + Remove */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-full overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black transition-colors text-base"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm font-medium text-black select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black transition-colors text-base"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-[11px] text-gray-400 hover:text-black transition-colors underline-offset-2 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-5">
            {/* Subtotal row */}
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400 tracking-wide">Subtotal</span>
              <span className="text-xs text-gray-400">Taxes and shipping calculated at checkout</span>
            </div>

            {/* Checkout button */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="mt-4 flex items-center justify-between w-full bg-black text-white px-6 py-4 rounded-full hover:bg-black/90 active:scale-[0.98] transition-all duration-200"
            >
              <span className="text-[11px] font-semibold tracking-[0.18em] uppercase">
                Check out
              </span>
              <span className="text-sm font-semibold">
                {formatPrice(subtotal)}
              </span>
            </Link>

            {/* Continue shopping */}
            <button
              onClick={closeCart}
              className="mt-3 w-full text-center text-[11px] text-gray-400 hover:text-black tracking-wide transition-colors"
            >
              Continue shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}
