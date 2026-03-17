'use client';

import { useState, useEffect, useCallback } from 'react';
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
}

// colour name → hex
const COLOR_MAP: Record<string, string> = {
    black: '#111',
    white: '#f0f0ee',
    'off-white': '#f0f0ee',
    cream: '#f5f5dc',
    charcoal: '#333',
    grey: '#888',
    'heather grey': '#8a8a8a',
    navy: '#1e3a5f',
    'dark navy': '#152c47',
    olive: '#556b2f',
    tan: '#d2b48c',
    burgundy: '#800020',
    'washed black': '#2a2a2a',
    'light blue': '#87ceeb',
    indigo: '#4b0082',
};

export default function ProductContent({ product, relatedProducts = [] }: ProductContentProps) {
    const { formatPrice } = useCurrency();
    const { toggleItem, isInWishlist } = useWishlistStore();
    const { addItem } = useCartStore();

    const [selectedSize, setSelectedSize] = useState<string>(product.sizes?.[0] || 'One Size');
    const [selectedColor, setSelectedColor] = useState<string>(product.colors?.[0] || 'Default');
    const [isAdding, setIsAdding] = useState(false);
    const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    useEffect(() => { setMounted(true); }, []);

    const isWishlisted = mounted ? isInWishlist(product._id) : false;
    const isSoldOut = !product.inStock || product.badge === 'sold-out';

    const handleAddToCart = () => {
        if (isSoldOut) return;
        setIsAdding(true);
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
        setTimeout(() => setIsAdding(false), 1000);
    };

    const handleWishlist = () => {
        toggleItem({
            productId: product._id,
            name: product.name,
            slug: product.slug?.current || product.slug,
            priceINR: product.priceINR,
            image: urlFor(product.images?.front)?.width(200).url() || '',
            category: product.category,
        });
    };

    // Build ordered image list (front first, then back, then rest)
    const imgKeys = ['front', 'back', 'left', 'right', 'detail'] as const;
    const imageUrls = imgKeys
        .map(k => urlFor((product.images as any)?.[k])?.width(900).url() || null)
        .filter((u): u is string => Boolean(u));

    // Always show at least 2 slots; duplicate front if only one image available
    const displayImages =
        imageUrls.length >= 2
            ? [imageUrls[0], imageUrls[1]]
            : imageUrls.length === 1
                ? [imageUrls[0], imageUrls[0]]
                : ['', ''];

    // All images for lightbox navigation
    const allImages = imageUrls.length > 0 ? imageUrls : displayImages.filter(Boolean);

    // Lightbox navigation
    const goNext = useCallback(() => {
        setLightboxIndex(prev => (prev + 1) % allImages.length);
    }, [allImages.length]);

    const goPrev = useCallback(() => {
        setLightboxIndex(prev => (prev - 1 + allImages.length) % allImages.length);
    }, [allImages.length]);

    // ESC key and arrow key listener
    useEffect(() => {
        if (!lightboxOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightboxOpen(false);
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [lightboxOpen, goNext, goPrev]);

    const openLightbox = (imgUrl: string) => {
        const idx = allImages.indexOf(imgUrl);
        setLightboxIndex(idx >= 0 ? idx : 0);
        setLightboxOpen(true);
    };

    return (
        <>
            {/* ── MAIN LAYOUT ────────────────────────────────────────── */}
            <div className="bg-white min-h-screen">
                <div className="max-w-[1440px] mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh] pb-24 lg:pb-0">

                        {/* ── LEFT: two product images ─────────────────── */}
                        <div className="grid grid-cols-2 gap-1.5 p-3 lg:p-0 lg:gap-2 self-start lg:sticky lg:top-[96px]">
                            {displayImages.map((imgUrl, i) => (
                                <div
                                    key={i}
                                    className="relative overflow-hidden bg-[#f4f3f0] cursor-zoom-in"
                                    style={{ aspectRatio: '4/5' }}
                                    onClick={() => imgUrl && openLightbox(imgUrl)}
                                >
                                    {imgUrl ? (
                                        <Image
                                            src={imgUrl}
                                            alt={`${product.name} – view ${i + 1}`}
                                            fill
                                            className="object-cover"
                                            priority={i === 0}
                                            sizes="(max-width: 1024px) 50vw, 25vw"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-[#f4f3f0]" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ── RIGHT: product details ───────────────────── */}
                        <div className="px-5 md:px-8 lg:px-12 xl:px-16 py-8 lg:py-12 flex flex-col">

                            {/* Name */}
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-medium tracking-wide text-black uppercase leading-tight mb-2">
                                {product.name}
                            </h1>

                            {/* Reviews */}
                            <ReviewSystem productId={product._id} />

                            {/* Price */}
                            <div className="flex items-center gap-3 mt-3 mb-6">
                                {product.originalPriceINR && (
                                    <span className="text-sm text-gray-400 line-through">
                                        {formatPrice(product.originalPriceINR)}
                                    </span>
                                )}
                                <span className="text-xl md:text-2xl font-bold text-black">
                                    {formatPrice(product.priceINR)}
                                </span>
                                {product.originalPriceINR && (
                                    <span className="text-xs font-semibold text-white bg-black px-2.5 py-1 rounded-md tracking-wide">
                                        {Math.round(((product.originalPriceINR - product.priceINR) / product.originalPriceINR) * 100)}%
                                    </span>
                                )}
                            </div>

                            {/* ── Colour selector ──────────────────────── */}
                            {product.colors && product.colors.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-500 mb-3">
                                        Colour —{' '}
                                        <span className="text-black font-normal normal-case tracking-normal">
                                            {selectedColor}
                                        </span>
                                    </p>
                                    <div className="flex flex-wrap gap-2.5">
                                        {product.colors.map((color: string) => (
                                            <button
                                                key={color}
                                                suppressHydrationWarning
                                                onClick={() => setSelectedColor(color)}
                                                title={color}
                                                className={`w-7 h-7 rounded-full transition-all duration-200 ${selectedColor === color
                                                    ? 'ring-2 ring-black ring-offset-2 scale-110'
                                                    : 'hover:scale-105'
                                                    }`}
                                                style={{
                                                    backgroundColor: COLOR_MAP[color.toLowerCase()] || '#999',
                                                    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.10)',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Size selector ────────────────────────── */}
                            {product.sizes && product.sizes.length > 0 && (
                                <div className="mb-7">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-500">
                                            Size —{' '}
                                            <span className="text-black font-normal normal-case tracking-normal">
                                                {selectedSize}
                                            </span>
                                        </p>
                                        <button
                                            onClick={() => setIsSizeChartOpen(true)}
                                            className="text-[11px] text-gray-400 hover:text-black underline-offset-2 hover:underline transition-colors"
                                        >
                                            Size guide
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {product.sizes.map((size: string) => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`px-4 py-2 text-[11px] font-medium rounded-full border transition-all duration-200 ${selectedSize === size
                                                    ? 'bg-black text-white border-black'
                                                    : 'border-gray-300 text-gray-700 hover:border-black hover:text-black'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* ── Action buttons — desktop only (mobile uses sticky bar below) ── */}
                            <div className="hidden lg:flex gap-3 mb-8">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isSoldOut || isAdding}
                                    className="flex-1 bg-black text-white py-4 text-[11px] font-semibold tracking-[0.18em] uppercase rounded-xl hover:bg-black/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {isAdding ? 'Adding…' : isSoldOut ? 'Sold Out' : 'Add to Bag'}
                                </button>
                                <button
                                    suppressHydrationWarning
                                    onClick={handleWishlist}
                                    className={`w-14 flex-shrink-0 flex items-center justify-center rounded-xl border transition-all duration-200 ${isWishlisted
                                        ? 'bg-black border-black text-white'
                                        : 'border-gray-300 text-gray-500 hover:border-black hover:text-black'
                                        }`}
                                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill={isWishlisted ? 'currentColor' : 'none'}
                                        viewBox="0 0 24 24"
                                        strokeWidth={1.5}
                                        stroke="currentColor"
                                        className="w-5 h-5"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {/* ── Shipping nudge ───────────────────────── */}
                            <p className="text-[11px] text-gray-400 tracking-wide mb-8">
                                ✦ Free delivery on orders above ₹499 &nbsp;·&nbsp; Easy 7-day returns
                            </p>

                            {/* ── Accordions ───────────────────────────── */}
                            <ProductAccordion
                                description={product.description}
                                material={product.material}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MOBILE STICKY ADD-TO-BAG BAR ───────────────────────── */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 flex gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
                <button
                    onClick={handleAddToCart}
                    disabled={isSoldOut || isAdding}
                    className="flex-1 bg-black text-white py-3.5 text-[11px] font-semibold tracking-[0.18em] uppercase rounded-xl hover:bg-black/90 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                >
                    {isAdding ? 'Adding…' : isSoldOut ? 'Sold Out' : 'Add to Bag'}
                </button>
                <button
                    suppressHydrationWarning
                    onClick={handleWishlist}
                    className={`w-14 flex-shrink-0 flex items-center justify-center rounded-xl border transition-all duration-200 ${isWishlisted
                        ? 'bg-black border-black text-white'
                        : 'border-gray-300 text-gray-500 hover:border-black hover:text-black'
                        }`}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill={isWishlisted ? 'currentColor' : 'none'}
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
                        />
                    </svg>
                </button>
            </div>

            {/* ── IMAGE LIGHTBOX MODAL ──────────────────────────────────── */}
            {lightboxOpen && allImages.length > 0 && (
                <div
                    className="fixed inset-0 bg-black flex flex-col"
                    style={{ zIndex: 10000 }}
                    onClick={() => setLightboxOpen(false)}
                >
                    {/* ── TOP BAR: counter only ── */}
                    <div
                        className="flex items-center justify-center px-4 py-4 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <span className="text-white/50 text-xs tracking-[0.2em] font-medium">
                            {lightboxIndex + 1} / {allImages.length}
                        </span>
                    </div>

                    {/* ── IMAGE + SIDE ARROWS ── */}
                    <div className="relative flex-1 flex items-center justify-center overflow-hidden">
                        {/* Previous */}
                        {allImages.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                                className="absolute left-3 md:left-8 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-all"
                                aria-label="Previous image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                        )}

                        {/* Image */}
                        <div
                            className="relative w-[86vw] h-full md:w-[70vw]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={allImages[lightboxIndex]}
                                alt={`${product.name} – view ${lightboxIndex + 1}`}
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 90vw, 72vw"
                                priority
                            />
                        </div>

                        {/* Next */}
                        {allImages.length > 1 && (
                            <button
                                onClick={(e) => { e.stopPropagation(); goNext(); }}
                                className="absolute right-3 md:right-8 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-all"
                                aria-label="Next image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* ── BOTTOM BAR: close button for ALL devices ── */}
                    <div
                        className="flex items-center justify-center py-6 flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setLightboxOpen(false)}
                            className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/15 text-white text-sm font-medium hover:bg-white/25 active:bg-white/30 transition-all"
                            aria-label="Close lightbox"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* ── Below-the-fold sections ────────────────────────────── */}
            <RelatedProducts products={relatedProducts} />
            <FAQSection />

            <SizeChartModal
                isOpen={isSizeChartOpen}
                onClose={() => setIsSizeChartOpen(false)}
                sizeGuideImage={product.sizeGuide}
            />
        </>
    );
}
