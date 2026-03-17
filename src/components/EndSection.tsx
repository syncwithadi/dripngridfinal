'use client';

import { useEffect, useState } from 'react';

export default function EndSection() {
  const [showBackToTop, setShowBackToTop] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Top Bar - Copyright */}


      {/* Brand Statement - Large Logo */}
      <div className="bg-[var(--color-inverted-bg)] py-20 md:py-32 relative">
        <div className="container-custom text-center">
          <h2 className="brand-giant text-[var(--color-inverted-text)]">
            DRIPNGRID
          </h2>
        </div>

        {/* Back to Top Button */}
        <button
          onClick={scrollToTop}
          className={`absolute bottom-6 right-6 md:bottom-8 md:right-8 w-12 h-12 
            flex items-center justify-center rounded-full
            bg-[var(--color-inverted-text)] text-[var(--color-inverted-bg)]
            border border-[var(--color-inverted-text)]/20
            transition-all duration-300 hover:scale-110
            ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
          aria-label="Back to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m4.5 15.75 7.5-7.5 7.5 7.5"
            />
          </svg>
        </button>
      </div>
    </>
  );
}
