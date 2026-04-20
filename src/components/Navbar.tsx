'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

// ── Mega-menu data ────────────────────────────────────────────────────────────
const megaMenu = {
  collections: [
    { label: 'New Arrivals', href: '/new-arrivals' },
    { label: 'Bestsellers', href: '/bestsellers' },
    { label: "Men's Edit", href: '/men' },
    { label: "Women's Edit", href: '/women' },
    { label: 'Lookbook', href: '/lookbook' },
  ],
  categories: [
    {
      heading: 'Top',
      items: [
        { label: 'T-Shirts', href: '/shop?cat=tshirts' },
        { label: 'Hoodies', href: '/shop?cat=hoodies' },
        { label: 'Sweatshirts', href: '/shop?cat=sweatshirts' },
        { label: 'Shirts', href: '/shop?cat=shirts' },
        { label: 'Jackets', href: '/shop?cat=jackets' },
      ],
    },
    {
      heading: 'Bottom',
      items: [
        { label: 'Cargos', href: '/shop?cat=cargos' },
        { label: 'Jeans', href: '/shop?cat=jeans' },
        { label: 'Shorts', href: '/shop?cat=shorts' },
        { label: 'Track Pants', href: '/shop?cat=trackpants' },
      ],
    },
    {
      heading: 'Accessories',
      items: [
        { label: 'Caps', href: '/shop?cat=caps' },
        { label: 'Bags', href: '/shop?cat=bags' },
      ],
    },
  ],
};

interface NavbarProps {
  brandLogo?: string;
  logoWidth?: number;
  siteName?: string;
}

export default function Navbar({ brandLogo, logoWidth, siteName }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaOpen, setIsMegaOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // If the logo image fails to load (broken URL, CDN error, etc.) fall back to text wordmark
  const [logoLoadError, setLogoLoadError] = useState(false);

  const { data: session } = useSession();
  const { getTotalItems, openCart } = useCartStore();
  const { getTotalItems: getWishlistTotal } = useWishlistStore();

  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);

  const cartCount = mounted ? getTotalItems() : 0;
  const wishlistCount = mounted ? getWishlistTotal() : 0;

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen]);

  useEffect(() => {
    if (isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 80);
  }, [isSearchOpen]);

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === '/') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const closeMega = () => setIsMegaOpen(false);

  // Only use transparent/white-text hero style on the home page when not yet scrolled
  const isHomePage = pathname === '/';
  const onDark = isHomePage && !isScrolled;
  const navText = onDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-black';
  const iconColor = onDark ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-black';
  const logoColor = onDark ? 'text-white' : 'text-black';
  const lineColor = onDark ? 'bg-white' : 'bg-black';
  const borderCol = onDark ? 'border-white/40' : 'border-black';

  // Transparent at top of home page, solid white everywhere else / on scroll
  const headerBg = (isHomePage && !isScrolled)
    ? 'bg-transparent border-b border-transparent'
    : 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_12px_0_rgba(0,0,0,0.06)]';

  return (
    <>
      {/* ── MAIN HEADER ─────────────────────────────────────────────────────── */}
      <header
        ref={megaRef}
        className={`w-full relative z-50 transition-all duration-500 ${headerBg}`}
        onMouseLeave={() => setIsMegaOpen(false)}
      >
        <nav className="max-w-[1400px] mx-auto px-5 md:px-8">
          <div className="relative flex items-center justify-between h-14 md:h-[60px] gap-4">

            {/* ── LEFT NAV ────────────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-7 min-w-[200px]">
              <Link
                href="/new-arrivals"
                className={`text-[13px] font-medium transition-colors ${navText}`}
                onClick={closeMega}
              >
                New In
              </Link>

              {/* Collections — hover opens mega menu */}
              <div
                className="relative"
                onMouseEnter={() => setIsMegaOpen(true)}
              >
                <Link
                  href="/shop"
                  className={`text-[13px] font-medium transition-colors flex items-center gap-1 ${navText}`}
                  onClick={closeMega}
                >
                  Collections
                  {/* tiny chevron indicator */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className={`w-3 h-3 transition-transform duration-200 ${isMegaOpen ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </Link>
              </div>

              <Link
                href="/track-order"
                className={`text-[13px] font-medium transition-colors ${navText}`}
                onClick={closeMega}
              >
                Track Order
              </Link>
            </div>

            {/* ── HAMBURGER (mobile) — 2 lines → X ───────────── */}
            <button
              onClick={() => setIsMobileOpen(v => !v)}
              className="lg:hidden flex flex-col justify-center gap-[5px] w-9 h-9 relative z-10"
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
            >
              <span className={`block h-[1.5px] origin-center transition-all duration-300 ease-out ${lineColor}
                ${isMobileOpen ? 'w-5 rotate-45 translate-y-[3.5px]' : 'w-5'}`} />
              <span className={`block h-[1.5px] origin-center transition-all duration-300 ease-out ${lineColor}
                ${isMobileOpen ? 'w-5 -rotate-45 -translate-y-[3.5px]' : 'w-4'}`} />
            </button>

            {/* ── WORDMARK — absolutely centred on all screen sizes ── */}
            <div className="absolute inset-x-0 flex justify-center pointer-events-none">
              <Link href="/" onClick={handleLogoClick} className="pointer-events-auto flex items-center">
                {brandLogo && !logoLoadError ? (
                  <img
                    src={brandLogo}
                    alt={siteName || 'DRIPNGRID'}
                    style={{ width: logoWidth || 140 }}
                    className="h-auto object-contain"
                    onError={() => setLogoLoadError(true)}
                  />
                ) : (
                  <span
                    className={`text-[22px] md:text-[26px] font-black tracking-[0.12em] uppercase select-none transition-colors duration-500 ${logoColor}`}
                    style={{ fontFamily: 'var(--font-display), sans-serif' }}
                  >
                    {siteName || 'DRIPNGRID'}
                  </span>
                )}
              </Link>
            </div>

            {/* ── RIGHT ICONS ─────────────────────────────────── */}
            <div className="flex items-center gap-0.5 md:gap-1 min-w-[200px] justify-end">

              {/* Search */}
              {isSearchOpen ? (
                <form onSubmit={handleSearchSubmit} className={`flex items-center border-b mr-1 ${borderCol}`}>
                  <input
                    suppressHydrationWarning
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search…"
                    className={`w-28 md:w-44 bg-transparent text-sm outline-none py-1 px-1 placeholder:text-current/40 ${logoColor}`}
                  />
                  <button type="submit" className={`p-1.5 transition-opacity hover:opacity-60 ${iconColor}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </button>
                  <button type="button" onClick={() => setIsSearchOpen(false)} className={`p-1.5 transition-opacity hover:opacity-60 ${iconColor}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </form>
              ) : (
                <button onClick={() => setIsSearchOpen(true)} className={`p-2 transition-colors ${iconColor}`} aria-label="Search">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[18px] h-[18px]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                </button>
              )}

              {/* Account */}
              <Link href="/account" className={`p-2 transition-colors hidden md:flex ${iconColor}`} aria-label="Account">
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Account" className="w-[18px] h-[18px] rounded-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[18px] h-[18px]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                )}
              </Link>

              {/* Wishlist */}
              <Link href="/wishlist" className={`relative p-2 transition-colors hidden md:flex ${iconColor}`} aria-label="Wishlist">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[18px] h-[18px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className={`absolute top-0.5 right-0.5 w-3.5 h-3.5 text-[8px] font-bold rounded-full flex items-center justify-center ${onDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button onClick={openCart} className={`relative p-2 transition-colors ${iconColor}`} aria-label="Cart">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[18px] h-[18px]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
                {cartCount > 0 && (
                  <span className={`absolute top-0.5 right-0.5 w-3.5 h-3.5 text-[8px] font-bold rounded-full flex items-center justify-center ${onDark ? 'bg-white text-black' : 'bg-black text-white'}`}>
                    {cartCount}
                  </span>
                )}
              </button>

              {/* ── HAMBURGER (desktop) — opens mega menu ───── */}
              <button
                onClick={() => setIsMegaOpen(v => !v)}
                className={`hidden lg:flex flex-col justify-center gap-[4px] p-2 ml-1 rounded-lg transition-colors ${isMegaOpen ? (onDark ? 'bg-white/10' : 'bg-gray-100') : (onDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}`}
                aria-label="Browse categories"
              >
                <span className={`w-4 h-px block ${lineColor}`} />
                <span className={`w-4 h-px block ${lineColor}`} />
                <span className={`w-3 h-px block ${lineColor}`} />
              </button>
            </div>
          </div>
        </nav>

        {/* ── MEGA MENU DROPDOWN ─────────────────────────────────────────────── */}
        <div
          className={`hidden lg:block absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg transition-all duration-300 overflow-hidden ${isMegaOpen ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
        >
          <div className="max-w-[1400px] mx-auto px-8 py-8">
            <div className="flex gap-14">
              {/* Collections column */}
              <div className="min-w-[150px]">
                <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gray-400 mb-4">Collections</p>
                <div className="flex flex-col gap-3">
                  {megaMenu.collections.map(c => (
                    <Link
                      key={c.href}
                      href={c.href}
                      onClick={closeMega}
                      className="text-sm text-gray-700 hover:text-black font-medium transition-colors"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="w-px bg-gray-100 self-stretch" />

              {/* Category sections */}
              <div className="flex gap-12 flex-1">
                {megaMenu.categories.map(cat => (
                  <div key={cat.heading}>
                    <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gray-400 mb-4">
                      {cat.heading}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map(item => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMega}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-black hover:text-white text-gray-700 text-xs font-medium rounded-full transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Close */}
              <button
                onClick={closeMega}
                className="self-start p-1.5 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU ─────────────────────────────────────────────────────── */}
      <div className={`fixed inset-0 bg-white z-[999] lg:hidden flex flex-col transition-all duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100">
          <span
            className="text-2xl tracking-[0.14em] uppercase text-black select-none"
            style={{ fontFamily: 'var(--font-luxury), var(--font-serif), serif', fontStyle: 'italic', fontWeight: 500 }}
          >
            DRIPNGRID
          </span>
          {/* Close button — mirrors the hamburger to keep spacing consistent */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="flex flex-col justify-center gap-[5px] w-9 h-9"
            aria-label="Close menu"
          >
            <span className="block h-[1.5px] w-5 bg-black origin-center rotate-45 translate-y-[3.5px] transition-all duration-300" />
            <span className="block h-[1.5px] w-5 bg-black origin-center -rotate-45 -translate-y-[3.5px] transition-all duration-300" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0.5">
          {[
            { href: '/new-arrivals', label: 'New In' },
            { href: '/shop', label: 'Collections' },
            { href: '/track-order', label: 'Track Order' },
            { href: '/men', label: "Men's Edit" },
            { href: '/women', label: "Women's Edit" },
            { href: '/bestsellers', label: 'Bestsellers' },
            { href: '/lookbook', label: 'Lookbook' },
            { href: '/journal', label: 'Journal' },
          ].map(link => (
            <Link key={link.href} href={link.href} onClick={() => setIsMobileOpen(false)}
              className="flex items-center justify-between py-4 border-b border-gray-100 text-base font-medium text-gray-800 hover:text-black">
              {link.label}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          ))}
          <div className="pt-4">
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gray-400 mb-4">Shop by category</p>
            <div className="flex flex-wrap gap-2">
              {megaMenu.categories.flatMap(c => c.items).map(item => (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-black hover:text-white transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-gray-100 px-5 py-4 flex items-center justify-around">
          {[
            { href: '/account', label: 'Account', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg> },
            { href: '/wishlist', label: 'Saved', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" /></svg> },
            { href: '/track-order', label: 'Track', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg> },
          ].map(item => (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}
              className="flex flex-col items-center gap-1.5 text-gray-600 hover:text-black">
              {item.icon}
              <span className="text-[9px] tracking-wide uppercase">{item.label}</span>
            </Link>
          ))}
          <button onClick={() => { setIsMobileOpen(false); openCart(); }} className="flex flex-col items-center gap-1.5 text-gray-600 hover:text-black">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
            <span className="text-[9px] tracking-wide uppercase">Cart {cartCount > 0 && `(${cartCount})`}</span>
          </button>
        </div>
      </div>
    </>
  );
}
