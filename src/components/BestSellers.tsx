'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProductCard from './ProductCard';

gsap.registerPlugin(ScrollTrigger);

const GAP     = 24;
const VISIBLE = 4;
const VISIBLE_MOBILE = 2;

interface BestSellersProps {
  products: any[];
  onQuickView?: (product: any) => void;
}

export default function BestSellers({ products, onQuickView }: BestSellersProps) {
  const sectionRef   = useRef<HTMLDivElement>(null);
  const headerRef    = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef     = useRef<HTMLDivElement>(null);

  const [cardWidth, setCardWidth] = useState(0);
  const [canPrev,   setCanPrev]   = useState(false);
  const [canNext,   setCanNext]   = useState(true);
  const [hovered,   setHovered]   = useState(false);

  const computeCardWidth = useCallback(() => {
    if (!containerRef.current) return;
    const isMobile = window.innerWidth < 768;
    const vis = isMobile ? VISIBLE_MOBILE : VISIBLE;
    const w = (containerRef.current.offsetWidth - GAP * (vis - 1)) / vis;
    setCardWidth(Math.floor(w));
  }, []);

  useEffect(() => {
    computeCardWidth();
    window.addEventListener('resize', computeCardWidth);
    return () => window.removeEventListener('resize', computeCardWidth);
  }, [computeCardWidth]);

  const updateArrows = () => {
    const t = trackRef.current;
    if (!t) return;
    setCanPrev(t.scrollLeft > 2);
    setCanNext(t.scrollLeft < t.scrollWidth - t.clientWidth - 2);
  };

  const slide = (dir: 'prev' | 'next') => {
    const t = trackRef.current;
    if (!t || !cardWidth) return;
    t.scrollBy({ left: dir === 'next' ? cardWidth + GAP : -(cardWidth + GAP), behavior: 'smooth' });
    setTimeout(updateArrows, 520);
  };

  useEffect(() => {
    updateArrows();
    const t = trackRef.current;
    t?.addEventListener('scroll', updateArrows, { passive: true });
    return () => t?.removeEventListener('scroll', updateArrows);
  }, [products, cardWidth]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: 30, opacity: 0, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: headerRef.current, start: 'top 88%', toggleActions: 'play none none reverse' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-16 md:py-24 container-custom">
      <div ref={headerRef} className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1">Fan Favourites</p>
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-gray-800">Best Sellers</h2>
        </div>
        <Link href="/bestsellers" className="text-[11px] font-semibold tracking-[0.15em] uppercase underline underline-offset-4 opacity-60 hover:opacity-100 transition-opacity">
          View All
        </Link>
      </div>

      <div ref={containerRef} className="relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}>
        {/* Prev arrow */}
        <button
          onClick={() => slide('prev')}
          aria-label="Previous"
          className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200 hover:bg-gray-50
            ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            ${canPrev ? 'cursor-pointer' : 'opacity-30 cursor-default'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div
          ref={trackRef}
          className="flex overflow-x-auto scroll-smooth"
          style={{ gap: GAP, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map(product => (
            <div
              key={product._id}
              style={{ minWidth: cardWidth || 260, width: cardWidth || 260 }}
              className="flex-shrink-0"
            >
              <ProductCard product={product} onQuickView={onQuickView} />
            </div>
          ))}
        </div>

        {/* Next arrow */}
        <button
          onClick={() => slide('next')}
          aria-label="Next"
          className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-200 hover:bg-gray-50
            ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}
            ${canNext ? 'cursor-pointer' : 'opacity-30 cursor-default'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    </section>
  );
}
