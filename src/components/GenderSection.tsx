'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProductCard from './ProductCard';

gsap.registerPlugin(ScrollTrigger);

const GAP          = 24;
const VISIBLE      = 4;
const VISIBLE_MOB  = 2;

interface GenderSectionProps {
  gender: 'Men' | 'Women';
  products: any[];
  href: string;
  onQuickView?: (product: any) => void;
}

export default function GenderSection({ gender, products, href, onQuickView }: GenderSectionProps) {
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
    const vis = isMobile ? VISIBLE_MOB : VISIBLE;
    setCardWidth(Math.floor((containerRef.current.offsetWidth - GAP * (vis - 1)) / vis));
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

  const ArrowBtn = ({ dir }: { dir: 'prev' | 'next' }) => {
    const canSlide = dir === 'prev' ? canPrev : canNext;
    return (
      <button
        onClick={() => canSlide && slide(dir)}
        aria-label={dir === 'prev' ? 'Previous' : 'Next'}
        className={`absolute top-1/2 -translate-y-1/2 z-10
          w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md
          flex items-center justify-center transition-all duration-200
          ${dir === 'prev' ? '-left-5' : '-right-5'}
          ${hovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          ${canSlide ? 'hover:shadow-lg cursor-pointer' : 'opacity-40 cursor-default'}`}
      >
        <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d={dir === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
        </svg>
      </button>
    );
  };

  return (
    <section ref={sectionRef} className="py-8 md:py-12 bg-white">
      <div className="container-custom">

        {/* Header */}
        <div ref={headerRef} className="mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-gray-800 mb-1">
            Shop {gender}
          </h2>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-gray-400">
              {gender === 'Men' ? 'Uncover the latest in men\'s fashion' : 'From everyday essentials to statement pieces'}
            </p>
            <Link
              href={href}
              className="text-[11px] font-semibold tracking-[0.15em] uppercase underline underline-offset-4 opacity-60 hover:opacity-100 transition-opacity"
            >
              Shop {gender}
            </Link>
          </div>
        </div>

        {/* Empty state — shown while no products are in this category */}
        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-gray-200 rounded-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400 tracking-wide">
              {gender}'s collection coming soon
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Products will appear here once added
            </p>
          </div>
        )}

        {/* Outer wrapper always rendered so containerRef can be measured */}
        <div
          ref={containerRef}
          className="relative"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {products.length > 0 && cardWidth > 0 && (
            <>
              <ArrowBtn dir="prev" />
              <ArrowBtn dir="next" />

              <div
                ref={trackRef}
                className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                style={{ gap: GAP }}
              >
                {products.map((product) => (
                  <div
                    key={product._id || product.id}
                    style={{ width: cardWidth, minWidth: cardWidth, flexShrink: 0 }}
                  >
                    <ProductCard product={product} onQuickView={onQuickView} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </section>
  );
}
