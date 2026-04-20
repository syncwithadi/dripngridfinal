'use client';

import { useState, useEffect } from 'react';

export default function MaintenanceBanner() {
  // Visible by default — resets on every page load/refresh (pure React state, no storage)
  const [visible, setVisible] = useState(false);

  // Small delay so it slides in after the page settles, not instantly on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm"
        style={{ animation: 'fadeInBackdrop 0.4s ease forwards' }}
      />

      {/* Modal Card */}
      <div
        className="fixed inset-0 z-[2001] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="maintenance-title"
      >
        <div
          className="relative w-full max-w-md bg-black text-white overflow-hidden"
          style={{ animation: 'slideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
        >
          {/* Top accent line */}
          <div className="h-[2px] w-full bg-white" />

          <div className="px-8 py-9">
            {/* Label */}
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/40 mb-5 font-medium">
              Notice
            </p>

            {/* Title */}
            <h2
              id="maintenance-title"
              className="text-2xl font-black tracking-tight uppercase mb-4 leading-tight"
              style={{ fontFamily: 'var(--font-display), sans-serif' }}
            >
              We&rsquo;re Still<br />Building This.
            </h2>

            {/* Divider */}
            <div className="w-8 h-[1px] bg-white/30 mb-5" />

            {/* Body */}
            <p className="text-sm text-white/70 leading-relaxed mb-2">
              DRIPNGRID is currently under active development. Some pages, features, and flows may be incomplete or subject to change.
            </p>
            <p className="text-sm text-white/70 leading-relaxed mb-8">
              <span className="text-white font-semibold">Please do not place any orders</span> at this time. We&rsquo;ll be live very soon. <span className="text-white/35 text-xs">&mdash; A. Choudhury <span className="text-white/20">(Founder &amp; Creative Director)</span></span>
            </p>

            {/* CTA */}
            <button
              onClick={() => setVisible(false)}
              className="w-full py-3.5 bg-white text-black text-xs font-bold tracking-[0.2em] uppercase transition-opacity hover:opacity-80 active:opacity-60"
            >
              Got It
            </button>

            {/* Sub-note */}
            <p className="text-[10px] text-white/30 text-center mt-4 tracking-wide">
              This notice appears on every visit until launch.
            </p>
          </div>

          {/* Bottom accent line */}
          <div className="h-[1px] w-full bg-white/10" />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
