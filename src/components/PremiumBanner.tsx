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

  const images = bannerImage ? [bannerImage] : SLIDES;
  const [activeIdx, setActiveIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState<number | null>(null);
  const [fading, setFading] = useState(false);

  // Auto-advance every 3s
  useEffect(() => {
    if (images.length < 2) return;
    const t = setTimeout(() => {
      setPrevIdx(activeIdx);
      setActiveIdx((activeIdx + 1) % images.length);
      setFading(true);
    }, 3000);
    return () => clearTimeout(t);
  }, [activeIdx, images.length]);

  // Clear fade state after transition completes
  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => {
      setFading(false);
      setPrevIdx(null);
    }, 1600);
    return () => clearTimeout(t);
  }, [fading]);

  // GSAP intro for CTA / heading
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

  return (
    <div className="relative w-full h-screen overflow-hidden -mt-[96px]">

      {/* Previous image — fades out with subtle zoom */}
      {fading && prevIdx !== null && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url('${images[prevIdx]}')`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            animation: 'fadeZoomOut 1.6s ease-in-out forwards',
          }}
        />
      )}

      {/* Active image — fades in with subtle zoom */}
      <div
        key={activeIdx}
        className="absolute inset-0"
        style={{
          backgroundImage: `url('${images[activeIdx]}')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          animation: fading ? 'fadeZoomIn 1.6s ease-in-out forwards' : 'none',
        }}
      />

      {/* Keyframe styles */}
      <style>{`
        @keyframes fadeZoomIn {
          0%   { opacity: 0; transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeZoomOut {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.97); }
        }
      `}</style>

      {/* Top gradient */}
      <div
        className="absolute inset-x-0 top-0 h-40 pointer-events-none z-10"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, transparent 100%)' }}
      />

      {/* Optional heading / subtitle */}
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

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {images.map((_, i) => (
            <div
              key={i}
              className={`h-[2px] rounded-full transition-all duration-700 ${
                i === activeIdx ? 'w-8 bg-white' : 'w-3 bg-white/35'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
