'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Shuffle (GSAP + DOM work — client only)
const Shuffle = dynamic(() => import('./Shuffle'), { ssr: false });

export default function EndSection() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        setShowBackToTop(window.scrollY > 500);
        rafId = null;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="bg-black py-20 md:py-32 relative overflow-hidden">
      <div style={{ width: '100%', textAlign: 'center', overflow: 'hidden' }}>
        <Shuffle
          text="DRIPNGRID"
          tag="h2"
          shuffleDirection="right"
          duration={0.4}
          stagger={0.04}
          animationMode="evenodd"
          shuffleTimes={2}
          ease="power3.out"
          threshold={0.2}
          rootMargin="0px"
          triggerOnce={true}
          triggerOnHover={true}
          respectReducedMotion={true}
          textAlign="center"
          className="brand-giant"
          style={{
            color: '#ffffff',
            fontFamily: "'RostexOutline', sans-serif",
            fontWeight: 'normal',
            cursor: 'default',
            fontSize: 'clamp(0px, 6.9vw, 9rem)',
            letterSpacing: '0.02em',
          }}
        />
      </div>

      {/* Back to Top */}
      <button
        onClick={scrollToTop}
        className={`absolute bottom-6 right-6 md:bottom-8 md:right-8 w-12 h-12
          flex items-center justify-center rounded-full
          bg-white text-black border border-white/20
          transition-all duration-300 hover:scale-110
          ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-label="Back to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
          strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
