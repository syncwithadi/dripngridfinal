'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

// Placeholder products to suggest inside the video modal
const SUGGESTED_PRODUCTS = [
    { id: 1, name: 'Oversized Drop Tee', price: 1299, slug: 'oversized-drop-tee', image: '' },
    { id: 2, name: 'Baggy Cargo Pants', price: 2499, slug: 'baggy-cargo-pants', image: '' },
];

const VIDEO_SLOTS = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    caption: '',
    handle: '@dripngrid',
}));

interface FeatureBannerProps {
    featuredImages?: { id: string | number; title: string; image: string }[];
}

export default function FeatureBanner({ featuredImages = [] }: FeatureBannerProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(true);
    const [hovered, setHovered] = useState(false);
    const [openVideo, setOpenVideo] = useState<number | null>(null);
    const [minimizedVideo, setMinimizedVideo] = useState<number | null>(null);

    const minimize = () => {
        setMinimizedVideo(openVideo);
        setOpenVideo(null);
    };

    const restore = () => {
        setOpenVideo(minimizedVideo);
        setMinimizedVideo(null);
    };

    const dismissMini = () => setMinimizedVideo(null);

    const updateArrows = useCallback(() => {
        const t = trackRef.current;
        if (!t) return;
        setCanPrev(t.scrollLeft > 2);
        setCanNext(t.scrollLeft < t.scrollWidth - t.clientWidth - 2);
    }, []);

    const slide = (dir: 'prev' | 'next') => {
        const t = trackRef.current;
        if (!t) return;
        const atEnd = t.scrollLeft >= t.scrollWidth - t.clientWidth - 2;
        const atStart = t.scrollLeft <= 2;
        if (dir === 'next' && atEnd) {
            // Loop: jump instantly to start (no animation), then settle
            t.scrollLeft = 0;
            setTimeout(updateArrows, 50);
        } else if (dir === 'prev' && atStart) {
            // Loop: jump instantly to end
            t.scrollLeft = t.scrollWidth - t.clientWidth;
            setTimeout(updateArrows, 50);
        } else {
            t.scrollBy({ left: dir === 'next' ? 220 : -220, behavior: 'smooth' });
            setTimeout(updateArrows, 400);
        }
    };

    // Toggle body class to hide navbar + lock scroll when fullscreen video is open
    useEffect(() => {
        if (openVideo !== null) {
            document.body.classList.add('video-open');
        } else {
            document.body.classList.remove('video-open');
        }
        return () => document.body.classList.remove('video-open');
    }, [openVideo]);

    return (
        <>
        <section className="py-10 md:py-14 bg-white">
            <div className="container-custom">
                {/* Header — same compact style as other sections */}
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1">Community</p>
                        <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-gray-800">As Seen On</h2>
                    </div>
                    <p className="text-sm text-gray-400 hidden md:block">Tag @dripngrid to get featured.</p>
                </div>

                {/* Video row — outer wrapper handles arrow placement */}
                <div className="relative"
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}>

                    {/* Both arrows — always visible, loop at ends */}
                    <button
                        suppressHydrationWarning
                        onClick={() => slide('prev')}
                        aria-label="Previous"
                        className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200 hover:bg-gray-50 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                    </button>

                    <button
                        suppressHydrationWarning
                        onClick={() => slide('next')}
                        aria-label="Next"
                        className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200 hover:bg-gray-50 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>

                    <div ref={trackRef}
                        className="flex gap-3 overflow-x-auto pb-2 mx-auto"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', maxWidth: '1272px' }}
                        onScroll={updateArrows}>
                        {VIDEO_SLOTS.map((slot) => (
                            <div key={slot.id}
                                className="relative flex-shrink-0 rounded-xl overflow-hidden bg-black cursor-pointer group"
                                style={{ width: 200, height: 356 }}
                                onClick={() => setOpenVideo(slot.id)}>
                                {/* Black bg placeholder */}
                                <div className="absolute inset-0 bg-zinc-900" />

                                {/* Play button */}
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/35 group-hover:scale-110 transition-all duration-200">
                                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Handle */}
                                <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-3 h-3 text-white" fill="currentColor">
                                            <path d="M11 0H5a5 5 0 0 0-5 5v6a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V5a5 5 0 0 0-5-5zm3.5 11c0 1.93-1.57 3.5-3.5 3.5H5c-1.93 0-3.5-1.57-3.5-3.5V5c0-1.93 1.57-3.5 3.5-3.5h6c1.93 0 3.5 1.57 3.5 3.5v6z"/>
                                            <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6.5A2.503 2.503 0 0 1 5.5 8c0-1.379 1.122-2.5 2.5-2.5s2.5 1.121 2.5 2.5c0 1.378-1.122 2.5-2.5 2.5z"/>
                                            <circle cx="12.3" cy="3.7" r=".533"/>
                                        </svg>
                                    </div>
                                    <span className="text-white text-[10px] font-medium">{slot.handle}</span>
                                </div>

                                {/* Caption */}
                                {slot.caption && (
                                    <div className="absolute bottom-3 left-3 right-3 z-10">
                                        <p className="text-white text-[11px] leading-snug line-clamp-2 drop-shadow-lg">{slot.caption}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Video Lightbox — full screen exactly like reference */}
            {openVideo !== null && (
                <div className="fixed inset-0 bg-black/75" style={{ zIndex: 99999 }}
                    onClick={() => setOpenVideo(null)}>

                    {/* Background: other video thumbnails dimly showing — left side */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <div className="flex items-center gap-2 w-full px-4" style={{ maxWidth: 900 }}>
                            {/* Left ghost videos */}
                            <div className="flex gap-2 opacity-30 flex-1 justify-end pr-2">
                                {VIDEO_SLOTS.filter(s => s.id !== openVideo).slice(0, 2).map(s => (
                                    <div key={s.id} className="rounded-xl bg-zinc-800 flex-shrink-0 overflow-hidden relative" style={{ width: 140, height: 250 }}>
                                        <div className="absolute inset-0 bg-zinc-800" />
                                    </div>
                                ))}
                            </div>
                            {/* Center spacer (video goes here via absolute) */}
                            <div style={{ width: 320, height: 568, flexShrink: 0 }} />
                            {/* Right ghost videos */}
                            <div className="flex gap-2 opacity-30 flex-1 pl-2">
                                {VIDEO_SLOTS.filter(s => s.id !== openVideo).slice(2, 4).map(s => (
                                    <div key={s.id} className="rounded-xl bg-zinc-800 flex-shrink-0 overflow-hidden relative" style={{ width: 140, height: 250 }}>
                                        <div className="absolute inset-0 bg-zinc-800" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Center: main video — phone ratio */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        style={{ width: 320, height: 568 }}
                        onClick={e => e.stopPropagation()}>

                        {/* Video container */}
                        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-900">

                            {/* Placeholder video bg */}
                            <div className="absolute inset-0 bg-zinc-900" />

                            {/* Top bar: title + handle */}
                            <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4 pb-10 bg-gradient-to-b from-black/60 to-transparent">
                                <p className="text-white text-xs font-semibold leading-snug line-clamp-2">Fresh racing inspired fits 🏎️ 🍊</p>
                                <p className="text-white/60 text-[10px] mt-0.5 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-2.5 h-2.5" fill="currentColor">
                                        <path d="M11 0H5a5 5 0 0 0-5 5v6a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V5a5 5 0 0 0-5-5zm3.5 11c0 1.93-1.57 3.5-3.5 3.5H5c-1.93 0-3.5-1.57-3.5-3.5V5c0-1.93 1.57-3.5 3.5-3.5h6c1.93 0 3.5 1.57 3.5 3.5v6z"/>
                                        <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6.5A2.503 2.503 0 0 1 5.5 8c0-1.379 1.122-2.5 2.5-2.5s2.5 1.121 2.5 2.5c0 1.378-1.122 2.5-2.5 2.5z"/>
                                        <circle cx="12.3" cy="3.7" r=".533"/>
                                    </svg>
                                    @dripngrid
                                </p>
                            </div>

                            {/* Center play icon */}
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                <p className="absolute mt-20 text-white/40 text-[11px]">Video coming soon</p>
                            </div>

                            {/* Product card — floating bottom overlay */}
                            <div className="absolute bottom-4 left-3 right-3 z-10">
                                <div className="flex items-center gap-3 bg-white/95 backdrop-blur rounded-xl px-3 py-2.5 shadow-lg">
                                    {/* Product image */}
                                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
                                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                    {/* Product info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-semibold text-gray-900 leading-tight truncate">{SUGGESTED_PRODUCTS[0]?.name}</p>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <p className="text-[11px] font-bold text-gray-900">₹{SUGGESTED_PRODUCTS[0]?.price.toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                    {/* Arrow */}
                                    <Link href={`/product/${SUGGESTED_PRODUCTS[0]?.slug}`}
                                        onClick={() => setOpenVideo(null)}
                                        className="flex-shrink-0 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Top-left controls: X + Minimize */}
                        <div className="absolute -top-10 left-0 flex items-center gap-2">
                            {/* X / Close */}
                            <button onClick={() => setOpenVideo(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/30 text-white transition-all backdrop-blur-sm"
                                title="Close">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            {/* Minimize / PiP */}
                            <button onClick={minimize}
                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/15 hover:bg-white/30 text-white transition-all backdrop-blur-sm"
                                title="Minimize">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                                    {/* Outer rectangle */}
                                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                                    {/* Inner PiP rectangle — bottom right, filled */}
                                    <rect x="12" y="12" width="8" height="6" rx="1" fill="currentColor" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Up / Down navigation — right side */}
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10"
                        onClick={e => e.stopPropagation()}>
                        <button
                            onClick={() => setOpenVideo(v => v !== null && v > 1 ? v - 1 : v)}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                            </svg>
                        </button>
                        <button
                            onClick={() => setOpenVideo(v => v !== null && v < VIDEO_SLOTS.length ? v + 1 : v)}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-all backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </section>

        {/* ── Mini / PiP Player ─────────────────────────────────── */}
        {minimizedVideo !== null && (
            <div className="fixed bottom-6 right-6 z-[9999] shadow-2xl rounded-2xl overflow-hidden"
                style={{ width: 180, height: 320 }}>

                {/* Video bg */}
                <div className="absolute inset-0 bg-zinc-900" />

                {/* Play indicator */}
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </div>
                </div>

                {/* Handle */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="w-2.5 h-2.5 text-white" fill="currentColor">
                            <path d="M11 0H5a5 5 0 0 0-5 5v6a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V5a5 5 0 0 0-5-5zm3.5 11c0 1.93-1.57 3.5-3.5 3.5H5c-1.93 0-3.5-1.57-3.5-3.5V5c0-1.93 1.57-3.5 3.5-3.5h6c1.93 0 3.5 1.57 3.5 3.5v6z"/>
                            <path d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 6.5A2.503 2.503 0 0 1 5.5 8c0-1.379 1.122-2.5 2.5-2.5s2.5 1.121 2.5 2.5c0 1.378-1.122 2.5-2.5 2.5z"/>
                            <circle cx="12.3" cy="3.7" r=".533"/>
                        </svg>
                    </div>
                    <span className="text-white text-[9px] font-medium">@dripngrid</span>
                </div>

                {/* Top-right controls: expand + close */}
                <div className="absolute top-2 right-2 z-20 flex gap-1">
                    {/* Expand back to fullscreen */}
                    <button onClick={restore}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-black/50 hover:bg-black/70 text-white transition-all"
                        title="Expand">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 5.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                        </svg>
                    </button>
                    {/* Dismiss mini player */}
                    <button onClick={dismissMini}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-black/50 hover:bg-black/70 text-white transition-all"
                        title="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Product card at bottom */}
                <div className="absolute bottom-2 left-2 right-2 z-20">
                    <div className="flex items-center gap-2 bg-white/90 rounded-lg px-2 py-1.5">
                        <div className="w-7 h-7 rounded bg-gray-200 flex-shrink-0 flex items-center justify-center">
                            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-semibold text-gray-800 truncate">{SUGGESTED_PRODUCTS[0]?.name}</p>
                            <p className="text-[9px] text-gray-500">₹{SUGGESTED_PRODUCTS[0]?.price.toLocaleString('en-IN')}</p>
                        </div>
                        <Link href={`/product/${SUGGESTED_PRODUCTS[0]?.slug}`}
                            onClick={dismissMini}
                            className="flex-shrink-0 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-2.5 h-2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </div>
        )}
    </>
    );
}
