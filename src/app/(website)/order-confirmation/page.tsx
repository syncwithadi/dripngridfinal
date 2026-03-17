'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useCurrency } from '@/context/CurrencyContext';

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const { formatPrice } = useCurrency();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderNumber) {
      // Trigger confetti on load
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 25, spread: 360, ticks: 50, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 40 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      // Fetch order details
      fetch(`/api/orders?orderNumber=${orderNumber}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setOrder(data.order);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [orderNumber]);

  if (!orderNumber) return null;

  const statusSteps = ['Ordered', 'Processing', 'Shipped', 'Delivered'];
  const currentStepIndex = 0; // Default to 'Ordered'

  return (
    <div className="min-h-[100dvh] bg-[var(--color-bg)] flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-[400px] animate-fade-in-up">
        {/* Premium Card */}
        <div className="bg-[var(--color-bg)] border border-[var(--color-border)] shadow-lg overflow-hidden">

          {/* Compact Header */}
          <div className="bg-[var(--color-text)] text-[var(--color-bg)] p-5 text-center relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              {/* Animated Checkmark */}
              <div className="w-12 h-12 mb-3 bg-[var(--color-bg)] rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-[var(--color-text)] animate-draw-check">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
              <h1 className="text-xl md:text-2xl font-luxury tracking-tight mb-1 uppercase">Order Confirmed</h1>
              <p className="text-xs md:text-sm opacity-80 tracking-wide font-body">Your order has been received</p>
            </div>
          </div>

          {/* Order Details */}
          <div className="p-5">
            {loading ? (
              <div className="text-center py-6">
                <div className="w-6 h-6 border-2 border-[var(--color-text)] border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : order ? (
              <div className="space-y-4">
                {/* Order Info Grid */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[var(--color-border)]">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Order No.</p>
                    <p className="text-sm font-medium text-[var(--color-text)] font-mono">#{orderNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Date</p>
                    <p className="text-sm text-[var(--color-text)]">
                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Compact Status Timeline */}
                <div className="py-2">
                  <div className="flex items-center justify-between relative px-2">
                    {/* Progress Line */}
                    <div className="absolute left-2 right-2 top-[5px] h-[1px] bg-[var(--color-border)] z-0">
                      <div className="h-full bg-[var(--color-text)] transition-all duration-500" style={{ width: '15%' }}></div>
                    </div>

                    {statusSteps.map((step, i) => (
                      <div key={step} className="relative z-10 flex flex-col items-center">
                        <div className={`w-2.5 h-2.5 rounded-full border transition-all ${i === 0
                          ? 'bg-[var(--color-text)] border-[var(--color-text)] outline outline-4 outline-[var(--color-bg)]'
                          : 'bg-[var(--color-bg)] border-[var(--color-border)]'
                          }`}></div>
                        <span className={`text-[9px] uppercase tracking-wider mt-2 ${i === 0 ? 'text-[var(--color-text)] font-medium' : 'text-[var(--color-text-muted)]'
                          }`}>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-end pt-2">
                  <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Total Amount</span>
                  <span className="text-lg font-serif text-[var(--color-text)]">{formatPrice(order.total)}</span>
                </div>

                {/* Email Confirmation */}
                <p className="text-[11px] text-center text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] py-2 px-3 rounded">
                  Updates sent to <span className="text-[var(--color-text)]">{order?.customer?.email}</span>
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-1">
                  <Link
                    href={`/track-order?order=${orderNumber}`}
                    className="flex-1 btn-primary justify-center py-2.5 text-xs uppercase tracking-widest"
                  >
                    Track Order
                  </Link>
                  <Link
                    href="/"
                    className="flex-1 btn-secondary justify-center py-2.5 text-xs uppercase tracking-widest"
                  >
                    Shop More
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-red-500 text-sm">
                Order details could not be loaded.
              </div>
            )}
          </div>
        </div>

        {/* Help Link */}
        <p className="text-center text-[10px] text-[var(--color-text-muted)] mt-4 uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
          Need help? <a href="mailto:support@dripngrid.com" className="underline">Contact Support</a>
        </p>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes draw-check {
          0% { stroke-dashoffset: 24; }
          100% { stroke-dashoffset: 0; }
        }
        .animate-scale-in {
          animation: scale-in 0.5s ease-out forwards;
        }
        .animate-draw-check {
          stroke-dasharray: 24;
          animation: draw-check 0.4s ease-out 0.3s forwards;
          stroke-dashoffset: 24;
        }
      `}</style>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-[var(--color-bg)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--color-text)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
