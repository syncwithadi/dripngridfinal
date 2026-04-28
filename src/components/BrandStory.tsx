'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function BrandStory() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip ScrollTrigger on mobile — reduces scroll calculation overhead
    if (window.innerWidth < 768) return;
    const ctx = gsap.context(() => {
      gsap.from(imageRef.current, {
        clipPath: 'inset(100% 0 0 0)',
        duration: 1.2,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: imageRef.current,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
        },
      });

      const contentElements = contentRef.current?.children;
      if (contentElements) {
        gsap.from(contentElements, {
          y: 60,
          opacity: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="section-padding surface-secondary"
    >
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <div
            ref={imageRef}
            className="relative aspect-[4/5] lg:aspect-[3/4] overflow-hidden"
            style={{ clipPath: 'inset(0)' }}
          >
            <Image
              src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80"
              alt="DRIPNGRID Brand Story"
              fill
              className="object-cover"
            />
            {/* Overlay text */}
            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-[var(--color-bg)] via-[var(--color-bg)]/80 to-transparent">
              <span className="text-display-sm font-light tracking-widest">
                Est. 2020
              </span>
            </div>
          </div>

          {/* Content */}
          <div ref={contentRef} className="lg:py-12">
            <span className="text-label mb-6 block">
              Philosophy
            </span>
            <h2 className="text-display-md mb-8">
              Crafted with <br />
              <span className="font-light">Intention</span>
            </h2>
            <div className="space-y-6 text-[var(--color-text-secondary)] leading-relaxed text-sm">
              <p>
                DRIPNGRID was founded on a simple belief: that clothing 
                should be both beautiful and enduring. We reject fast 
                fashion in favor of timeless pieces.
              </p>
              <p>
                Every garment is crafted with premium materials and 
                meticulous attention to detail. We work with skilled 
                artisans who share our commitment to excellence.
              </p>
              <p>
                This is more than clothing. This is an investment in 
                quality, a statement of values, and a commitment to 
                looking your best for years to come.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-12 border-t border-[var(--color-border)]">
              <div>
                <span className="text-display-sm block">50K+</span>
                <span className="text-xs text-[var(--color-text-muted)]">Customers</span>
              </div>
              <div>
                <span className="text-display-sm block">200+</span>
                <span className="text-xs text-[var(--color-text-muted)]">Designs</span>
              </div>
              <div>
                <span className="text-display-sm block">15+</span>
                <span className="text-xs text-[var(--color-text-muted)]">Countries</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10">
              <a href="/about" className="btn-primary">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
