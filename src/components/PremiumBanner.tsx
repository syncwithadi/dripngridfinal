'use client';

import { useEffect, useRef, useState } from 'react';
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

const SLIDES = [
  '/images/newlandingpage%202.png',
  '/images/new%20landing%20page%203.png',
];

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

  // If a custom bannerImage is passed, skip the slideshow
  const images = bannerImage ? [bannerImage] : SLIDES;

  const [current, setCurrent] = useState(0);
  const [next, setNext] = useState<number | null>(null);
  const [sliding, setSliding] = useState(false);

  // Auto-advance slideshow
  useEffect(() => {
    if (images.length < 2) return;

    const timer = setTimeout(() => {
      triggerSlide((current + 1) % images.length);
    }, 2500);

    return () => clearTimeout(timer);
  }, [current, images.length]);

  const triggerSlide = (nextIndex: number) => {
    if (sliding) return;
    setNext(nextIndex);
    setSliding(true);
  };

  // Once slide animation ends, commit the transition
  const handleTransitionEnd = () => {
    if (next === null) return;
    setCurrent(next);
    setNext(null);
    setSliding(false);
  };

  // GSAP fade-in for CTA / heading
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

  const slideStyle = (img: string): React.CSSProperties => ({
    backgroundImage: `url('${img}')`,
    backgroundSize: '100% 100%',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  });

  return (
    <div className="relative w-full h-screen overflow-hidden -mt-[96px]">

      {/* Current image */}
      <div
        className="absolute inset-0"
        style={{
          ...slideStyle(images[current]),
          transform: sliding ? 'translateX(-100%)' : 'translateX(0)',
          transition: sliding ? 'transform 0.85s cubic-bezier(0.77,0,0.18,1)' : 'none',
        }}
      />

      {/* Next image (slides in from right) */}
      {sliding && next !== null && (
        <div
          className="absolute inset-0"
          style={{
            ...slideStyle(images[next]),
            transform: sliding ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.85s cubic-bezier(0.77,0,0.18,1)',
          }}
          onTransitionEnd={handleTransitionEnd}
        />
      )}

      {/* Top gradient */}
      <div
        className="absolute inset-x-0 top-0 h-40 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)' }}
      />

      {/* Optional heading / subtitle overlay */}
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

      {/* Bottom-left CTA */}
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

      {/* Slide indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => triggerSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
