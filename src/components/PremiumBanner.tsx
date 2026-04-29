'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

// Images loaded dynamically from /public/images/landing/
// Drop new images there — they auto-appear in alphabetical order
const FALLBACK_SLIDES: string[] = [];

const DURATION  = 5000;
const RING_R    = 9;
const RING_CIRC = 2 * Math.PI * RING_R;

export default function PremiumBanner({
  bannerImage,
  bannerHeading,
  bannerSubtitle,
  bannerButton1Text = 'Shop Men',
  bannerButton1Link = '/men',
  bannerButton2Text = 'Shop Women',
  bannerButton2Link = '/women',
}: PremiumBannerProps) {
  const router     = useRouter();
  const ctaRef     = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const dirRef     = useRef<'ltr' | 'rtl'>('ltr');

  const [dynamicSlides, setDynamicSlides] = useState<string[]>(FALLBACK_SLIDES);

  // Fetch landing images from /api/landing-images (reads /public/images/landing/ dynamically)
  useEffect(() => {
    if (bannerImage) return;
    fetch('/api/landing-images')
      .then(r => r.json())
      .then(({ images }) => { if (images?.length) setDynamicSlides(images); })
      .catch(() => {});
  }, [bannerImage]);

  const images = bannerImage ? [bannerImage] : dynamicSlides;

  const [activeIdx,    setActiveIdx]    = useState(0);
  const [incomingIdx,  setIncomingIdx]  = useState<number | null>(null);
  const [wipeDir,      setWipeDir]      = useState<'ltr' | 'rtl'>('ltr');
  const [animating,    setAnimating]    = useState(false);
  const [ringKey,      setRingKey]      = useState(0);
  const [bannerHeight, setBannerHeight] = useState<string>('100dvh');

  const startTransition = (nextIdx: number, dir: 'ltr' | 'rtl') => {
    if (animating || nextIdx === activeIdx) return;
    dirRef.current = dir === 'ltr' ? 'rtl' : 'ltr';
    setWipeDir(dir);
    setIncomingIdx(nextIdx);
    setAnimating(true);
  };

  useEffect(() => {
    if (images.length < 2) return;
    const t = setInterval(() => {
      const dir = dirRef.current;
      dirRef.current = dir === 'ltr' ? 'rtl' : 'ltr';
      const next = (activeIdx + 1) % images.length;
      setWipeDir(dir);
      setIncomingIdx(next);
      setAnimating(true);
    }, DURATION);
    return () => clearInterval(t);
  }, [activeIdx, images.length]);

  useEffect(() => {
    if (!animating || incomingIdx === null) return;
    const t = setTimeout(() => {
      setActiveIdx(incomingIdx);
      setIncomingIdx(null);
      setAnimating(false);
      setRingKey(k => k + 1);
    }, 1300);
    return () => clearTimeout(t);
  }, [animating, incomingIdx]);

  const goToSlide = (idx: number) => {
    const dir: 'ltr' | 'rtl' = idx > activeIdx ? 'ltr' : 'rtl';
    startTransition(idx, dir);
  };

  useEffect(() => {
    // Lock height once so iOS Safari dvh resize on scroll doesn't zoom the image
    setBannerHeight(`${window.innerHeight}px`);

    const ctx = gsap.context(() => {
      const targets = [headingRef.current, ctaRef.current].filter(Boolean);
      gsap.set(targets, { opacity: 0, y: 20 });
      gsap.to(targets, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.5, stagger: 0.15 });
    });
    return () => ctx.revert();
  }, []);

  const bg = (src: string): React.CSSProperties => ({
    backgroundImage:    `url('${src}')`,
    backgroundSize:     'cover',
    backgroundPosition: 'center center',
    backgroundRepeat:   'no-repeat',
  });

  const wipeAnim = wipeDir === 'ltr' ? 'wipeRevealLTR' : 'wipeRevealRTL';
  const visibleIdx = animating && incomingIdx !== null ? incomingIdx : activeIdx;

  return (
    <div
      className="relative w-full overflow-hidden -mt-[96px] cursor-pointer bg-black"
      style={{ height: bannerHeight }}
      onClick={() => router.push('/new-arrivals')}
    >
      <style>{`
        @keyframes wipeRevealLTR {
          from { clip-path: inset(0 100% 0 0); }
          to   { clip-path: inset(0 0%   0 0); }
        }
        @keyframes wipeRevealRTL {
          from { clip-path: inset(0 0 0 100%); }
          to   { clip-path: inset(0 0 0 0%);   }
        }
        @keyframes ringTimer {
          from { stroke-dashoffset: ${RING_CIRC}; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Mobile background — static, only on small screens */}
      <div
        className="absolute inset-0 z-0 md:hidden"
        style={bg('/images/mobilebackgroundnew.png')}
      />

      {/* Desktop base image — hidden on mobile */}
      <div className="absolute inset-0 z-0 hidden md:block" style={bg(images[activeIdx] ?? '')} />

      {/* Desktop incoming image wipe — hidden on mobile */}
      {animating && incomingIdx !== null && (
        <div
          key={incomingIdx}
          className="absolute inset-0 hidden md:block"
          style={{
            ...bg(images[incomingIdx]),
            animation: `${wipeAnim} 1.2s ease-in-out forwards`,
          }}
        />
      )}

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

      {/* CTA buttons */}
      <div
        ref={ctaRef}
        className="absolute bottom-[10%] md:bottom-[12%] left-0 right-0 flex justify-center z-20"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Shop Now — centred, lower middle */}
        <Link
          href="/shop"
          className="px-7 py-2.5 bg-white text-black text-[11px] font-semibold tracking-[0.2em] uppercase rounded-lg shadow-md hover:bg-white/90 transition-all duration-200 whitespace-nowrap"
        >
          SHOP NOW
        </Link>
      </div>

      {/* Timer dots */}
      {images.length > 1 && (
        <div
          className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 hidden md:flex items-center gap-3"
          onClick={e => e.stopPropagation()}
        >
          {images.map((_, i) => {
            const isActive = i === visibleIdx;
            return (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="flex items-center justify-center w-6 h-6 cursor-pointer"
              >
                {isActive ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="10" cy="10" r={RING_R} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                    <circle
                      key={ringKey}
                      cx="10" cy="10" r={RING_R}
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRC}
                      strokeDashoffset={RING_CIRC}
                      style={{ animation: `ringTimer ${DURATION}ms linear forwards` }}
                    />
                    <circle cx="10" cy="10" r="2.5" fill="white" style={{ transform: 'rotate(90deg)', transformOrigin: '10px 10px' }} />
                  </svg>
                ) : (
                  <svg width="8" height="8" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="3.5" fill="rgba(255,255,255,0.45)" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
