'use client';

import Link from 'next/link';
import { useState } from 'react';

const footerLinks = {
  shop: [
    { label: 'New Arrivals', href: '/new-arrivals' },
    { label: 'Bestsellers', href: '/bestsellers' },
    { label: "Men's Edit", href: '/men' },
    { label: "Women's Edit", href: '/women' },
    { label: 'Lookbook', href: '/lookbook' },
    { label: 'All Products', href: '/shop' },
  ],
  trending: [
    { label: 'Oversized T-Shirts', href: '/shop?cat=tshirts' },
    { label: 'Hoodies', href: '/shop?cat=hoodies' },
    { label: 'Sweatshirts', href: '/shop?cat=sweatshirts' },
    { label: 'Cargos', href: '/shop?cat=cargos' },
    { label: 'Jackets', href: '/shop?cat=jackets' },
    { label: 'Track Pants', href: '/shop?cat=trackpants' },
    { label: 'Caps', href: '/shop?cat=caps' },
  ],
  info: [
    { label: 'About Us', href: '/about' },
    { label: 'FAQs', href: '/faq' },
    { label: 'Contact', href: 'mailto:support@dripngrid.in' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms & Conditions', href: '/terms' },
    { label: 'Returns & Exchange', href: '/returns' },
    { label: 'Shipping Info', href: '/shipping' },
  ],
  explore: [
    { label: 'Search', href: '/search' },
    { label: 'Track Order', href: '/track-order' },
    { label: 'Size Guide', href: '/size-guide' },
    { label: 'Journal', href: '/journal' },
  ],
};

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <footer className="bg-black text-white">

      {/* ── TOP GRID ────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 pt-16 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand + Socials */}
          <div>
            <Link href="/" className="inline-block mb-6">
              <span
                className="text-4xl font-black tracking-tight leading-none uppercase whitespace-nowrap"
                style={{ fontFamily: 'var(--font-bebas), var(--font-display), sans-serif' }}
              >
                DRIPNGRID
              </span>
            </Link>
            <p className="text-xs text-white/40 leading-relaxed mb-8 max-w-[180px]">
              Drip So Sharp, It Cuts.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              {/* Instagram */}
              <a href="https://instagram.com/dripngrid" target="_blank" rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              {/* X / Twitter */}
              <a href="https://x.com/dripngrid" target="_blank" rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors" aria-label="X">
                <svg className="w-[17px] h-[17px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* Pinterest */}
              <a href="https://pinterest.com/dripngrid" target="_blank" rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors" aria-label="Pinterest">
                <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white mb-6">Shop</h4>
            <ul className="space-y-3">
              {footerLinks.shop.map(link => (
                <li key={link.label}>
                  <Link href={link.href}
                    className="text-sm text-white/55 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Trending */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white mb-6">Trending</h4>
            <ul className="space-y-3">
              {footerLinks.trending.map(link => (
                <li key={link.label}>
                  <Link href={link.href}
                    className="text-sm text-white/55 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white mb-6">Info</h4>
            <ul className="space-y-3">
              {footerLinks.info.map(link => (
                <li key={link.label}>
                  <Link href={link.href}
                    className="text-sm text-white/55 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── DIVIDER ─────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="h-px bg-white/10" />
      </div>

      {/* ── BOTTOM SECTION ──────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">

          {/* Explore */}
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-white mb-5">Explore</h4>
            <ul className="space-y-3">
              {footerLinks.explore.map(link => (
                <li key={link.label}>
                  <Link href={link.href}
                    className="text-sm text-white/55 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-2 lg:max-w-md">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-white mb-2">
              We&rsquo;ve Got You Covered:
            </p>
            <p className="text-sm text-white/50 mb-5 leading-relaxed">
              Be the first to know about new arrivals, exclusive drops &amp; offers.
            </p>

            {status === 'success' ? (
              <p className="text-sm text-white/70 py-3 border-b border-white/20">
                You&rsquo;re in. Welcome to the grid. ✦
              </p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center border-b border-white/30 focus-within:border-white transition-colors">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 py-3 outline-none"
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="pl-4 py-3 text-white/50 hover:text-white transition-colors disabled:opacity-40"
                  aria-label="Subscribe"
                >
                  {status === 'loading' ? (
                    <div className="w-4 h-4 border border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                      strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  )}
                </button>
              </form>
            )}
            {status === 'error' && (
              <p className="text-xs text-red-400 mt-2">Something went wrong. Try again.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── COPYRIGHT ───────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        <div className="h-px bg-white/10" />
      </div>
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-5">
        <p className="text-[11px] text-white/25 tracking-wide">
          &copy; {new Date().getFullYear()} DRIPNGRID. All rights reserved.
        </p>
      </div>

    </footer>
  );
}
