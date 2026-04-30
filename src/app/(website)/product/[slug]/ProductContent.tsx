'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlistStore } from '@/store/wishlistStore';
import { urlFor } from '@/sanity/image';
import { useCartStore } from '@/store/cartStore';
import ProductAccordion from '@/components/product/ProductAccordion';
import RelatedProducts from '@/components/product/RelatedProducts';
import FAQSection from '@/components/product/FAQSection';
import ReviewSystem from '@/components/product/ReviewSystem';
import SizeChartModal from '@/components/product/SizeChartModal';

interface ProductContentProps {
    product: any;
    relatedProducts?: any[];
    isPreviewMode?: boolean;
    previewToken?: string;
}

const COLOR_MAP: Record<string, string> = {
    black: '#111', white: '#f0f0ee', 'off-white': '#f0f0ee', cream: '#f5f5dc',
    charcoal: '#333', grey: '#888', 'heather grey': '#8a8a8a', navy: '#1e3a5f',
    'dark navy': '#152c47', olive: '#556b2f', tan: '#d2b48c', burgundy: '#800020',
    'washed black': '#2a2a2a', 'light blue': '#87ceeb', indigo: '#4b0082',
};

export default function ProductContent({ product, relatedProducts = [], isPreviewMode = false, previewToken }: ProductContentProps) {
    const { formatPrice } = useCurrency();
    const { toggleItem, isInWishlist } = useWishlistStore();
    const { addItem } = useCartStore();

    const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || 'One Size');
    const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0] || 'Default');
    const [quantity, setQuantity] = useState(1);
    const [isAdding, setIsAdding] = useState(false);
    const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [pincode, setPincode] = useState('');
    const [deliveryMsg, setDeliveryMsg] = useState<string | null>(null);
    const [checkingPin, setCheckingPin] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [zoomed, setZoomed] = useState(false);
    const [zoomOrigin, setZoomOrigin] = useState('50% 50%');
    const imgRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        const t = setTimeout(() => setVisible(true), 30);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (isPreviewMode && previewToken) {
            fetch('/api/admin/products/preview-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: previewToken, action: 'Opened Product Preview Page' })
            }).catch(console.error);
        }
    }, [isPreviewMode, previewToken]);

    const isWishlisted = mounted ? isInWishlist(product._id) : false;
    const isSoldOut = !product.inStock || product.badge === 'sold-out';

    const logPreviewAction = (action: string) => {
        if (!isPreviewMode || !previewToken) return;
        fetch('/api/admin/products/preview-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: previewToken, action })
        }).catch(console.error);
    };

    const handleAddToCart = () => {
        if (isPreviewMode) {
            logPreviewAction('Clicked Add to Cart (Blocked)');
            return;
        }
        if (isSoldOut) return;
        setIsAdding(true);
        for (let i = 0; i < quantity; i++) {
            addItem({
                productId: product._id,
                name: product.name,
                slug: product.slug?.current || product.slug,
                priceINR: product.priceINR,
                size: selectedSize,
                color: selectedColor,
                quantity: 1,
                image: urlFor(product.images?.front)?.width(200).url() || '',
            });
        }
        setTimeout(() => setIsAdding(false), 1000);
    };

    const handleBuyNow = () => {
        if (isPreviewMode) {
            logPreviewAction('Clicked Buy Now (Blocked)');
            return;
        }
        if (isSoldOut) return;
        const params = new URLSearchParams({
            buyNow: 'true',
            productId: product._id,
            name: product.name,
            slug: product.slug?.current || product.slug,
            price: String(product.priceINR),
            size: selectedSize,
            color: selectedColor,
            quantity: String(quantity),
            image: urlFor(product.images?.front)?.width(200).url() || '',
        });
        window.location.href = `/checkout?${params.toString()}`;
    };

    const handleWishlist = () => {
        toggleItem({
            productId: product._id,
            name: product.name,
            slug: product.slug?.current || product.slug,
            priceINR: product.priceINR,
            image: urlFor(product.images?.front)?.width(200).url() || '',
            category: typeof product.category === 'string'
                ? product.category
                : product.category?.name || product.category?.slug?.current || '',
        });
    };

    const checkDelivery = () => {
        if (pincode.length !== 6) { setDeliveryMsg('Please enter a valid 6-digit pincode.'); return; }
        setCheckingPin(true); setDeliveryMsg(null);
        setTimeout(() => { setDeliveryMsg(`Delivery available to ${pincode} — estimated 3–5 business days.`); setCheckingPin(false); }, 800);
    };

    const imgKeys = ['front', 'back', 'left', 'right', 'detail'] as const;
    const imageUrls = imgKeys
        .map(k => urlFor((product.images as any)?.[k])?.width(1200).url() || null)
        .filter((u): u is string => Boolean(u));
    const allImages = imageUrls.length > 0 ? imageUrls : [''];

    const goNext = useCallback(() => setLightboxIndex(prev => (prev + 1) % allImages.length), [allImages.length]);
    const goPrev = useCallback(() => setLightboxIndex(prev => (prev - 1 + allImages.length) % allImages.length), [allImages.length]);

    useEffect(() => {
        if (!lightboxOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxOpen(false);
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', onKey);
        return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
    }, [lightboxOpen, goNext, goPrev]);

    const openLightbox = (url: string) => {
        logPreviewAction('Opened Image Lightbox');
        const idx = allImages.indexOf(url);
        setLightboxIndex(idx >= 0 ? idx : 0);
        setZoomed(false);
        setLightboxOpen(true);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imgRef.current) return;
        const r = imgRef.current.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        setZoomOrigin(`${x}% ${y}%`);
    };

    const discountPct = product.originalPriceINR
        ? Math.round(((product.originalPriceINR - product.priceINR) / product.originalPriceINR) * 100)
        : 0;

    return (
        <div className="transition-opacity duration-300 bg-white" style={{ opacity: visible ? 1 : 0 }}>

            {/* ── MAIN PRODUCT LAYOUT ── */}
            <div className="max-w-[1440px] mx-auto">
                <div className="lg:grid" style={{ gridTemplateColumns: "71% 29%" }}>

                    {/* LEFT: 2-column grid for images */}
                    <div className="grid grid-cols-2 gap-1.5 p-1.5">
                        {allImages.map((imgUrl, i) => (
                            <div
                                key={i}
                                className={`relative w-full overflow-hidden bg-[#f5f5f3] cursor-zoom-in rounded-lg ${allImages.length % 2 !== 0 && i === allImages.length - 1 ? 'col-span-2' : ''}`}
                                style={{ aspectRatio: '3/4' }}
                                onClick={() => imgUrl && openLightbox(imgUrl)}
                            >
                                {imgUrl && (
                                    <Image
                                        src={imgUrl}
                                        alt={`${product.name} – view ${i + 1}`}
                                        fill
                                        className="object-cover hover:scale-[1.02] transition-transform duration-500 rounded-lg"
                                        priority={i === 0}
                                        sizes="(max-width: 1024px) 50vw, 31vw"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* RIGHT: sticky details panel */}
                    <div className="lg:sticky lg:top-[96px] lg:self-start px-4 md:px-6 lg:px-8 xl:px-10 py-6 lg:py-8 flex flex-col">

                        {/* Name + Wishlist */}
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                            <h1 className="text-base md:text-lg font-semibold tracking-wide text-black uppercase leading-tight">
                                {product.name}
                            </h1>
                            {/* Heart wishlist button — commented out */}
                            {/*
                            <button suppressHydrationWarning onClick={handleWishlist}
                                className="flex-shrink-0 mt-0.5 transition-colors"
                                style={{ color: isWishlisted ? '#D02C2C' : '#9ca3af' }}
                                aria-label="Wishlist">
                                <svg xmlns="http://www.w3.org/2000/svg" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                                </svg>
                            </button>
                            */}
                        </div>

                        {/* Reviews */}
                        <ReviewSystem productId={product._id} />

                        {/* Price */}
                        <div className="flex items-center gap-2.5 mt-3 mb-5">
                            {product.originalPriceINR && (
                                <span className="text-xs text-gray-400 line-through">{formatPrice(product.originalPriceINR)}</span>
                            )}
                            <span className="text-lg font-bold text-black">{formatPrice(product.priceINR)}</span>
                            {discountPct >= 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded tracking-wide text-white"
                                    style={{ backgroundColor: '#D02C2C' }}>
                                    {discountPct}% OFF
                                </span>
                            )}
                        </div>

                        {/* Colour */}
                        {product.colors && product.colors.length > 0 && (
                            <div className="mb-4">
                                <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-gray-500 mb-2">
                                    Colour — <span className="text-black font-normal normal-case tracking-normal">{selectedColor}</span>
                                </p>
                                <div className="flex flex-wrap gap-2.5">
                                    {product.colors.map((color: string) => (
                                        <button key={color} suppressHydrationWarning onClick={() => setSelectedColor(color)} title={color}
                                            className={`w-6 h-6 rounded-full transition-all duration-200 ${selectedColor === color ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-105'}`}
                                            style={{ backgroundColor: COLOR_MAP[color.toLowerCase()] || '#999', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.12)' }} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size */}
                        {product.sizes && product.sizes.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-700">
                                        Size: <span className="text-black">{selectedSize}</span>
                                    </p>
                                    <button onClick={() => { logPreviewAction('Opened Size Chart'); setIsSizeChartOpen(true); }} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-black transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                                        </svg>
                                        Sizing guide
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {product.sizes.map((size: string) => (
                                        <button key={size} onClick={() => setSelectedSize(size)}
                                            className={`min-w-[44px] px-2.5 py-2 text-[11px] font-semibold border transition-all duration-150 rounded-md
                                                ${selectedSize === size
                                                    ? 'bg-black text-white border-black'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-black hover:text-black'}`}>
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Qty + Add to Cart + Bookmark */}
                        <div className="flex gap-2 mb-2.5 items-stretch">
                            <div className="flex items-center border border-gray-300 rounded-md bg-white">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-3 py-3 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors text-sm leading-none">−</button>
                                <span className="px-3 text-xs font-semibold text-black min-w-[2rem] text-center">{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)} className="px-3 py-3 text-gray-500 hover:text-black hover:bg-gray-50 transition-colors text-sm leading-none">+</button>
                            </div>
                            <button onClick={handleAddToCart} disabled={isSoldOut || isAdding || isPreviewMode}
                                className="flex-1 py-3 text-[11px] font-bold tracking-[0.22em] uppercase rounded-md border border-gray-300 transition-all duration-200 group
                                    bg-white text-black hover:bg-black hover:text-white hover:border-black
                                    disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]">
                                {isPreviewMode ? 'Preview (Purchases Disabled)' : isAdding ? 'Adding…' : isSoldOut ? 'Sold Out' : 'Add to Cart'}
                            </button>
                            <button onClick={handleWishlist} suppressHydrationWarning
                                className="w-[46px] flex-shrink-0 flex items-center justify-center border border-gray-300 rounded-md bg-white transition-all duration-200 hover:border-black"
                                aria-label="Save to wishlist">
                                <svg xmlns="http://www.w3.org/2000/svg" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4.5 h-4.5"
                                    style={{ color: isWishlisted ? 'black' : '#6b7280' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                </svg>
                            </button>
                        </div>

                        {/* Buy It Now */}
                        <button onClick={handleBuyNow} disabled={isSoldOut || isPreviewMode}
                            className="w-full mb-5 py-3.5 bg-black text-white text-[11px] font-bold tracking-[0.22em] uppercase rounded-md hover:bg-[#1a1a1a] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200">
                            {isPreviewMode ? 'Preview (Purchases Disabled)' : isSoldOut ? 'Sold Out' : 'Buy It Now'}
                        </button>

                        {/* Delivery checker */}
                        <div className="border border-gray-200 rounded-xl p-3.5 mb-5">
                            <p className="text-[11px] font-semibold text-gray-700 mb-2.5">Check Delivery:</p>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                        </svg>
                                    </span>
                                    <input type="text" maxLength={6} value={pincode}
                                        onChange={e => { setPincode(e.target.value.replace(/\D/g, '')); setDeliveryMsg(null); }}
                                        onKeyDown={e => e.key === 'Enter' && checkDelivery()}
                                        placeholder="Enter Pincode"
                                        className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors" />
                                </div>
                                <button onClick={checkDelivery} disabled={checkingPin}
                                    className="px-4 py-2 bg-gray-600 text-white text-[10px] font-bold tracking-widest uppercase rounded-lg hover:bg-black transition-colors disabled:opacity-60">
                                    {checkingPin ? '…' : 'Check'}
                                </button>
                            </div>
                            {deliveryMsg ? (
                                <p className="mt-2.5 text-xs text-gray-600">{deliveryMsg}</p>
                            ) : (
                                <p className="mt-2.5 text-xs text-gray-500 text-center">
                                    Enter your pincode to <strong className="font-semibold text-gray-700">check delivery date</strong> and <strong className="font-semibold text-gray-700">estimated arrival</strong>
                                </p>
                            )}
                        </div>

                        {/* Accordions */}
                        <ProductAccordion description={product.description} material={product.material} />
                    </div>
                </div>
            </div>

            {/* MOBILE STICKY BAR — commented out */}
            {/*
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <button onClick={handleAddToCart} disabled={isSoldOut || isAdding}
                    className="flex-1 bg-black text-white py-3.5 text-[11px] font-bold tracking-[0.2em] uppercase rounded-sm hover:bg-black/90 active:scale-[0.98] disabled:opacity-40 transition-all duration-200">
                    {isAdding ? 'Adding…' : isSoldOut ? 'Sold Out' : 'Add to Cart'}
                </button>
                <button suppressHydrationWarning onClick={handleWishlist}
                    className="w-14 flex-shrink-0 flex items-center justify-center rounded-sm border border-gray-300 transition-all duration-200"
                    style={{ background: isWishlisted ? 'black' : 'white', color: isWishlisted ? 'white' : '#6b7280' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                </button>
            </div>
            */}

            {/* LIGHTBOX */}
            {lightboxOpen && allImages.length > 0 && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center" style={{ zIndex: 99999 }}
                    onClick={(e) => { if (e.target === e.currentTarget) setLightboxOpen(false); }}>
                    <button onClick={() => setLightboxOpen(false)}
                        className="absolute top-5 right-5 z-20 w-10 h-10 flex items-center justify-center rounded-full border border-white/30 bg-black/40 text-white hover:bg-white hover:text-black transition-all"
                        aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20">
                        <span className="text-white/60 text-xs tracking-[0.2em]">{lightboxIndex + 1} / {allImages.length}</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center relative overflow-hidden w-full"
                        onClick={(e) => { if (e.target === e.currentTarget) setLightboxOpen(false); }}>
                        {allImages.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-5 z-20 w-10 h-10 flex items-center justify-center rounded-full border border-white/30 bg-black/40 text-white hover:bg-white hover:text-black transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                        )}
                        <div ref={imgRef} className="relative overflow-hidden rounded-lg"
                            style={{ width: 'min(75vw,700px)', height: 'min(82vh,840px)', cursor: 'zoom-in' }}
                            onMouseMove={(e) => { handleMouseMove(e); if (!zoomed) setZoomed(true); }}
                            onMouseLeave={() => setZoomed(false)}
                            onClick={(e) => e.stopPropagation()}>
                            <Image src={allImages[lightboxIndex]} alt={`${product.name} – ${lightboxIndex + 1}`}
                                fill className="object-contain select-none transition-transform duration-200"
                                style={{ transform: zoomed ? 'scale(2.3)' : 'scale(1)', transformOrigin: zoomed ? zoomOrigin : '50% 50%' }}
                                sizes="75vw" priority draggable={false} />
                        </div>
                        {allImages.length > 1 && (
                            <button onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-5 z-20 w-10 h-10 flex items-center justify-center rounded-full border border-white/30 bg-black/40 text-white hover:bg-white hover:text-black transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {allImages.length > 1 && (
                        <div className="flex items-center justify-center gap-2 py-4 flex-shrink-0">
                            {allImages.map((src, i) => (
                                <button key={i} onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); setZoomed(false); }}
                                    className={`relative w-12 h-12 overflow-hidden border-2 rounded transition-all ${i === lightboxIndex ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                                    <Image src={src} alt={`thumb ${i + 1}`} fill className="object-cover" sizes="48px" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <RelatedProducts products={relatedProducts} />
            <FAQSection />
            <SizeChartModal isOpen={isSizeChartOpen} onClose={() => setIsSizeChartOpen(false)} sizeGuideImage={product.sizeGuide} />
        </div>
    );
}
