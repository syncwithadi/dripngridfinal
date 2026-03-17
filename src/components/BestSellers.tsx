'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProductCard from './ProductCard';

gsap.registerPlugin(ScrollTrigger);

interface BestSellersProps {
  products: any[];
  onQuickView?: (product: any) => void;
}

export default function BestSellers({ products, onQuickView }: BestSellersProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(headerRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: headerRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });

      const cards = productsRef.current?.children;
      if (cards) {
        gsap.from(cards, {
          y: 60,
          opacity: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: productsRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="best-sellers" className="py-16 md:py-24 bg-[#f9f8f6]">
      <div className="container-custom">
        {/* Section Header — Bluorng style: left title, right "Discover more" pill */}
        <div ref={headerRef} className="flex items-end justify-between mb-10 md:mb-14">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 mb-2">Community Picks</p>
            <h2 className="text-2xl md:text-3xl font-light tracking-wide text-black">
              Bestsellers
            </h2>
          </div>
          <Link
            href="/bestsellers"
            className="text-[11px] tracking-[0.2em] uppercase text-gray-400 hover:text-black transition-colors duration-200 underline-offset-4 hover:underline"
          >
            Discover more
          </Link>
        </div>

        {/* Products Grid */}
        <div
          ref={productsRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-6"
        >
          {products.map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={product}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
