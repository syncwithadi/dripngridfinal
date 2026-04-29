'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

// ── Dropdown data ─────────────────────────────────────────────────────────────
const genderMenus = {
  men: {
    featured: [
      { label: 'New Arrivals', href: '/new-arrivals' },
      { label: 'Bestsellers',  href: '/bestsellers'  },
      { label: 'All Men\'s',   href: '/men'           },
    ],
    categories: [
      {
        heading: 'Tops',
        items: [
          { label: 'T-Shirts',    href: '/shop?cat=tshirts'    },
          { label: 'Hoodies',     href: '/shop?cat=hoodies'    },
          { label: 'Sweatshirts', href: '/shop?cat=sweatshirts' },
          { label: 'Shirts',      href: '/shop?cat=shirts'     },
          { label: 'Jackets',     href: '/shop?cat=jackets'    },
        ],
      },
      {
        heading: 'Bottoms',
        items: [
          { label: 'Cargos',      href: '/shop?cat=cargos'     },
          { label: 'Jeans',       href: '/shop?cat=jeans'      },
          { label: 'Shorts',      href: '/shop?cat=shorts'     },
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
  },
  women: {
    featured: [
      { label: 'New Arrivals',  href: '/new-arrivals' },
      { label: 'Bestsellers',   href: '/bestsellers'  },
      { label: 'All Women\'s',  href: '/women'         },
    ],
    categories: [
      {
        heading: 'Tops',
        items: [
          { label: 'T-Shirts',    href: '/shop?cat=tshirts'    },
          { label: 'Hoodies',     href: '/shop?cat=hoodies'    },
          { label: 'Sweatshirts', href: '/shop?cat=sweatshirts' },
          { label: 'Crop Tops',   href: '/shop?cat=croptops'   },
        ],
      },
      {
        heading: 'Bottoms',
        items: [
          { label: 'Jeans',   href: '/shop?cat=jeans'   },
          { label: 'Shorts',  href: '/shop?cat=shorts'  },
          { label: 'Skirts',  href: '/shop?cat=skirts'  },
        ],
      },
      {
        heading: 'Accessories',
        items: [
          { label: 'Bags', href: '/shop?cat=bags' },
          { label: 'Caps', href: '/shop?cat=caps' },
        ],
      },
    ],
  },
};

interface NavbarProps {
  brandLogo?: string;
  logoWidth?: number;
  siteName?: string;
}

export default function Navbar({ brandLogo, logoWidth, siteName }: NavbarProps) {
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<'men' | 'women' | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // If the logo image fails to load (broken URL, CDN error, etc.) fall back to text wordmark
  const [logoLoadError, setLogoLoadError] = useState(false);

  const { data: session } = useSession();
  const { getTotalItems, openCart } = useCartStore();
  const { getTotalItems: getWishlistTotal } = useWishlistStore();

  const router = useRouter();
  const pathname = usePathname();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const megaRef = useRef<HTMLDivElement>(null);
  const drawerCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [drawerTab, setDrawerTab] = useState<'shop' | 'account' | 'info'>('shop');

  const cartCount = mounted ? getTotalItems() : 0;
  const wishlistCount = mounted ? getWishlistTotal() : 0;

  useEffect(() => {
    setMounted(true);
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 20);
        rafId = null;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = (isMobileOpen || isNavDrawerOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileOpen, isNavDrawerOpen]);

  useEffect(() => {
    if (isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 80);
  }, [isSearchOpen]);

  // Live search — debounced 250ms
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setSearchResults(data);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 250);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [searchQuery]);

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

  const closeMenu = () => setOpenMenu(null);

  const openDrawer = () => {
    if (drawerCloseTimer.current) clearTimeout(drawerCloseTimer.current)
    setIsNavDrawerOpen(true)
  }
  const scheduleCloseDrawer = () => {
    drawerCloseTimer.current = setTimeout(() => setIsNavDrawerOpen(false), 80)
  }
  const cancelDrawerClose = () => {
    if (drawerCloseTimer.current) clearTimeout(drawerCloseTimer.current)
  }
  const closeDrawerNow = () => setIsNavDrawerOpen(false);

  // Only use transparent/white-text hero style on the home page when not yet scrolled
  const isHomePage = pathname === '/';
  const onDark = isHomePage && !isScrolled;
  const navText = onDark ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-black';
  const iconColor = onDark ? 'text-white/80 hover:text-white' : 'text-gray-600 hover:text-black';
  const logoColor = onDark ? 'text-white' : 'text-black';
  const lineColor = onDark ? 'bg-white' : 'bg-black';
  const borderCol = onDark ? 'border-white/40' : 'border-black';

  // Transparent at top of home page, solid white everywhere else / on scroll
  // Also keep transparent until mounted so the navbar never flashes white before hydration
  const headerBg = (!mounted || (isHomePage && !isScrolled))
    ? 'bg-transparent border-b border-transparent'
    : 'bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_12px_0_rgba(0,0,0,0.06)]';

  return (
    <>
      {/* ── MAIN HEADER ─────────────────────────────────────────────────────── */}
      <header
        ref={megaRef}
        className={`w-full relative z-50 transition-[background-color,border-color,box-shadow] duration-300 ${headerBg}`}
        onMouseLeave={closeMenu}
      >
        <nav className="max-w-[1400px] mx-auto px-5 md:px-8">
          <div className="relative flex items-center justify-between h-14 md:h-[60px] gap-4">

            {/* ── LEFT NAV ────────────────────────────────────── */}
            <div className="hidden lg:flex items-center gap-7 min-w-[200px]">

              {/* New In */}
              <Link href="/new-arrivals" className={`text-[13px] font-medium transition-colors ${navText}`}>
                New In
              </Link>

              {/* Collections */}
              <div className="relative" onMouseEnter={() => setOpenMenu('men')} onMouseLeave={closeMenu}>
                <button className={`text-[13px] font-medium transition-colors flex items-center gap-1 ${navText}`}>
                  Collections
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                    className={`w-3 h-3 transition-transform duration-200 ${openMenu === 'men' ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Collections dropdown */}
                <div className={`absolute top-full left-0 pt-3 transition-all duration-200 z-50
                  ${openMenu === 'men' ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none -translate-y-1'}`}>
                  <div className="bg-white border border-gray-100 shadow-lg rounded-xl p-5 w-[520px] flex gap-6">
                    {/* Men's */}
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gray-400 mb-3">Men&apos;s</p>
                      <div className="flex flex-col gap-2.5">
                        <Link href="/men" onClick={closeMenu} className="text-sm text-gray-700 hover:text-black font-medium transition-colors">All Men&apos;s</Link>
                        {genderMenus.men.categories.flatMap(c => c.items).map(item => (
                          <Link key={item.href} href={item.href} onClick={closeMenu}
                            className="text-xs text-gray-600 hover:text-black transition-colors">{item.label}</Link>
                        ))}
                      </div>
                    </div>
                    <div className="w-px bg-gray-100 self-stretch" />
                    {/* Women's */}
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gray-400 mb-3">Women&apos;s</p>
                      <div className="flex flex-col gap-2.5">
                        <Link href="/women" onClick={closeMenu} className="text-sm text-gray-700 hover:text-black font-medium transition-colors">All Women&apos;s</Link>
                        {genderMenus.women.categories.flatMap(c => c.items).map(item => (
                          <Link key={item.href} href={item.href} onClick={closeMenu}
                            className="text-xs text-gray-600 hover:text-black transition-colors">{item.label}</Link>
                        ))}
                      </div>
                    </div>
                    <div className="w-px bg-gray-100 self-stretch" />
                    {/* Featured */}
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gray-400 mb-3">Featured</p>
                      <div className="flex flex-col gap-2.5">
                        <Link href="/new-arrivals" onClick={closeMenu} className="text-sm text-gray-700 hover:text-black font-medium transition-colors">New Arrivals</Link>
                        <Link href="/bestsellers" onClick={closeMenu} className="text-sm text-gray-700 hover:text-black font-medium transition-colors">Bestsellers</Link>
                        <Link href="/lookbook" onClick={closeMenu} className="text-sm text-gray-700 hover:text-black font-medium transition-colors">Lookbook</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Track Order */}
              <Link href="/track-order" className={`text-[13px] font-medium transition-colors ${navText}`} onClick={closeMenu}>
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
                    className={`text-[22px] md:text-[26px] tracking-[0.12em] uppercase select-none transition-colors duration-500 ${logoColor}`}
                    style={{ fontFamily: "'RostexRegular', sans-serif", fontWeight: 'normal' }}
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
                <div className="relative mr-1">
                  <form onSubmit={handleSearchSubmit} className={`flex items-center border-b ${borderCol}`}>
                    <input
                      suppressHydrationWarning
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search products…"
                      className={`w-36 md:w-52 bg-transparent text-sm outline-none py-1 px-1 placeholder:text-current/40 ${logoColor}`}
                    />
                    <button type="submit" className={`p-1.5 transition-opacity hover:opacity-60 ${iconColor}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                    </button>
                    <button type="button" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                      className={`p-1.5 transition-opacity hover:opacity-60 ${iconColor}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </form>

                  {/* Live results dropdown */}
                  {(searchResults.length > 0 || searchLoading) && searchQuery.trim().length >= 2 && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-[999]">
                      {searchLoading ? (
                        <div className="px-4 py-3 text-xs text-gray-400">Searching…</div>
                      ) : (
                        <>
                          <div className="max-h-80 overflow-y-auto">
                            {searchResults.map(p => (
                              <Link
                                key={p._id}
                                href={`/product/${p.slug?.current || p.slug}`}
                                onClick={() => { setIsSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                              >
                                {/* Thumbnail */}
                                <div className="w-10 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                                  {p.image && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                  )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">₹{p.priceINR?.toLocaleString('en-IN')}</p>
                                </div>
                                {p.badge && (
                                  <span className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 bg-black text-white rounded">
                                    {p.badge}
                                  </span>
                                )}
                              </Link>
                            ))}
                          </div>
                          {/* View all results */}
                          <button
                            onClick={handleSearchSubmit as any}
                            className="w-full px-4 py-2.5 text-xs font-semibold text-center text-gray-600 hover:text-black hover:bg-gray-50 transition-colors border-t border-gray-100"
                          >
                            See all results for "{searchQuery}"
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
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

              {/* ── NAV DRAWER TOGGLE (desktop) ───── */}
              {/* Nav drawer trigger — temporarily hidden */}
              {/* <button
                onMouseEnter={openDrawer}
                onMouseLeave={scheduleCloseDrawer}
                className={`hidden lg:flex flex-col justify-center gap-[4px] p-2 ml-1 rounded-lg transition-colors ${isNavDrawerOpen ? (onDark ? 'bg-white/10' : 'bg-gray-100') : (onDark ? 'hover:bg-white/10' : 'hover:bg-gray-100')}`}
                aria-label="Navigation menu"
              >
                <span className={`w-4 h-px block ${lineColor}`} />
                <span className={`w-4 h-px block ${lineColor}`} />
                <span className={`w-3 h-px block ${lineColor}`} />
              </button> */}
            </div>
          </div>
        </nav>

      </header>

      {/* ── NAV DRAWER (desktop) ────────────────────────────────────────────── */}
      {/* Starts at bottom of navbar, goes full height, never touches the navbar */}
      <div
        onMouseEnter={cancelDrawerClose}
        onMouseLeave={scheduleCloseDrawer}
        className={`hidden lg:flex fixed right-0 w-[260px] bg-black z-[200] flex-col transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isNavDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ top: 56, height: 'calc(100vh - 56px)' }}
      >
        {/* Tabs */}
        <div className="flex border-b border-white/10 flex-shrink-0">
          {(['shop', 'account', 'info'] as const).map(tab => (
            <button
              key={tab}
              onMouseEnter={() => setDrawerTab(tab)}
              onClick={() => setDrawerTab(tab)}
              className={`flex-1 py-3.5 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${
                drawerTab === tab
                  ? 'text-white border-b-2 border-white -mb-px'
                  : 'text-white/30 hover:text-white/70'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Links */}
        <div className="flex-1 overflow-y-auto">
          {(drawerTab === 'shop' ? [
            { href: '/new-arrivals',         label: 'New Arrivals' },
            { href: '/bestsellers',          label: 'Bestsellers' },
            { href: '/men',                  label: "Men's Edit" },
            { href: '/women',                label: "Women's Edit" },
            { href: '/lookbook',             label: 'Lookbook' },
            { href: '/shop',                 label: 'All Products' },
            { href: '/shop?cat=tshirts',     label: 'Oversized T-Shirts' },
            { href: '/shop?cat=hoodies',     label: 'Hoodies' },
            { href: '/shop?cat=sweatshirts', label: 'Sweatshirts' },
            { href: '/shop?cat=cargos',      label: 'Cargos' },
            { href: '/shop?cat=trackpants',  label: 'Track Pants' },
            { href: '/shop?cat=jackets',     label: 'Jackets' },
            { href: '/shop?cat=caps',        label: 'Caps' },
          ] : drawerTab === 'account' ? [
            { href: '/account',      label: session?.user ? 'My Account' : 'Sign In' },
            { href: '/orders',       label: 'Order History' },
            { href: '/wishlist',     label: 'Saved Items' },
            { href: '/track-order',  label: 'Track Order' },
          ] : [
            { href: '/about',                      label: 'About Us' },
            { href: '/faq',                        label: 'FAQs' },
            { href: '/size-guide',                 label: 'Size Guide' },
            { href: '/returns',                    label: 'Returns & Exchange' },
            { href: '/shipping',                   label: 'Shipping Info' },
            { href: '/journal',                    label: 'Journal' },
            { href: 'mailto:support@dripngrid.in', label: 'Contact Us' },
          ]).map(link => (
            <Link
              key={link.label}
              href={link.href}
              onClick={closeDrawerNow}
              className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] group hover:bg-white/[0.05] transition-colors"
            >
              <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-white group-hover:text-white/70 transition-colors">
                {link.label}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                className="w-3 h-3 flex-shrink-0 text-white/20 group-hover:text-white/50 transition-colors">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex-shrink-0">
          <p className="text-[8px] text-white/20 tracking-[0.2em] uppercase">Drip So Sharp, It Cuts.</p>
        </div>
      </div>

      {/* ── MOBILE MENU ─────────────────────────────────────────────────────── */}
      <div className={`fixed inset-0 bg-white z-[999] lg:hidden flex flex-col transition-all duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="relative flex items-center h-14 border-b border-gray-100 px-5">
          {/* Centered logo */}
          <div className="absolute inset-x-0 flex justify-center pointer-events-none">
            <Link href="/" onClick={() => setIsMobileOpen(false)} className="pointer-events-auto flex items-center">
              {brandLogo && !logoLoadError ? (
                <img
                  src={brandLogo}
                  alt={siteName || 'DRIPNGRID'}
                  className="h-auto object-contain"
                  style={{ width: (logoWidth || 140) * 0.5 }}
                  onError={() => setLogoLoadError(true)}
                />
              ) : (
                <span
                  className="text-2xl tracking-[0.14em] uppercase text-black select-none"
                  style={{ fontFamily: "'RostexRegular', sans-serif", fontWeight: 'normal' }}
                >
                  {siteName || 'DRIPNGRID'}
                </span>
              )}
            </Link>
          </div>
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
            { href: '/men',          label: 'Shop Men'    },
            { href: '/women',        label: 'Shop Women'  },
            { href: '/track-order',  label: 'Track Order' },
            { href: '/new-arrivals', label: 'New Arrivals'},
            { href: '/bestsellers',  label: 'Bestsellers' },
            { href: '/lookbook',     label: 'Lookbook'    },
            { href: '/journal',      label: 'Journal'     },
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
              {genderMenus.men.categories.flatMap(c => c.items).map(item => (
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
