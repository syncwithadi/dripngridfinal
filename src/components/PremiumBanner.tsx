'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';

interface PremiumBannerProps {
  bannerImage?: string | null;
  bannerHeading?: string | null;
  bannerSubtitle?: string | null;
  bannerButton1Text?: string | null;
  bannerButton1Link?: string | null;
  bannerButton2Text?: string | null;
  bannerButton2Link?: string | null;
}

export default function PremiumBanner({
  bannerImage,
  bannerHeading,
  bannerSubtitle,
  bannerButton1Text = 'Shop Men',
  bannerButton1Link = '/men',
  bannerButton2Text = 'Shop Women',
  bannerButton2Link = '/women',
}: PremiumBannerProps) {
  const ctaRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const targets = [headingRef.current, ctaRef.current].filter(Boolean);
      gsap.set(targets, { opacity: 0, y: 20 });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        delay: 0.5,
        stagger: 0.15,
      });
    });
    return () => ctx.revert();
  }, []);

  const bgImage = bannerImage || '/images/hero-banner.webp';

  return (
    <div className="relative w-full h-screen overflow-hidden -mt-[96px]">

      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: `url('${bgImage}')` }}
      />

      {/* Top gradient — only covers navbar area so icons stay visible */}
      <div
        className="absolute inset-x-0 top-0 h-40 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)' }}
      />

      {/* Optional heading / subtitle overlay (centre of banner) */}
      {(bannerHeading || bannerSubtitle) && (
        <div
          ref={headingRef}
          className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-6 text-center"
        >
          {bannerHeading && (
            <h1 className="text-white text-4xl md:text-6xl font-semibold tracking-tight drop-shadow-lg mb-3">
              {bannerHeading}
            </h1>
          )}
          {bannerSubtitle && (
            <p className="text-white/80 text-base md:text-xl font-light tracking-wide drop-shadow">
              {bannerSubtitle}
            </p>
          )}
        </div>
      )}

      {/* Bottom-left CTA — glassmorphism style */}
      <div
        ref={ctaRef}
        className="absolute bottom-[30%] md:bottom-[18%] left-6 md:left-10 z-10 flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        {bannerButton1Text && bannerButton1Link && (
          <Link
            href={bannerButton1Link}
            className="px-6 py-3 bg-white/90 backdrop-blur-sm text-black text-[11px] font-semibold tracking-[0.18em] uppercase rounded-xl hover:bg-white transition-all duration-200 shadow-lg"
          >
            {bannerButton1Text}
          </Link>
        )}
        {bannerButton2Text && bannerButton2Link && (
          <Link
            href={bannerButton2Link}
            className="px-6 py-3 bg-white/60 backdrop-blur-sm border border-white/60 text-black text-[11px] font-semibold tracking-[0.18em] uppercase rounded-xl hover:bg-white/80 transition-all duration-200 shadow-lg"
          >
            {bannerButton2Text}
          </Link>
        )}
      </div>
    </div>
  );
}
