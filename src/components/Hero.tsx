'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import gsap from 'gsap';

interface HeroImage {
  src: string;
  alt: string;
}

interface HeroProps {
  heroImages: HeroImage[];
}

// Fallback images if none from Sanity
const fallbackImages: HeroImage[] = [
  {
    src: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=80',
    alt: 'Fashion editorial - model in urban setting',
  },
  {
    src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&q=80',
    alt: 'Fashion editorial - minimal style',
  },
  {
    src: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1920&q=80',
    alt: 'Fashion editorial - street style',
  },
];

export default function Hero({ heroImages }: HeroProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Use fallback if no hero images from Sanity
  const images = heroImages && heroImages.length > 0 ? heroImages : fallbackImages;

  // Auto-rotate images every 3.5 seconds
  const nextImage = useCallback(() => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
      setIsTransitioning(false);
    }, 500); // Half of transition duration
  }, [images.length]);

  useEffect(() => {
    const interval = setInterval(nextImage, 3500);
    return () => clearInterval(interval);
  }, [nextImage]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial states
      gsap.set([titleRef.current, subtitleRef.current, ctaRef.current], {
        opacity: 0,
        y: 40,
      });
      gsap.set(scrollIndicatorRef.current, {
        opacity: 0,
        y: 20,
      });

      // Timeline animation
      const tl = gsap.timeline({
        defaults: {
          ease: 'power3.out',
        },
        delay: 0.3,
      });

      tl.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 1,
      })
        .to(
          subtitleRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
          },
          '-=0.6'
        )
        .to(
          ctaRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
          },
          '-=0.5'
        )
        .to(
          scrollIndicatorRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
          },
          '-=0.3'
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative h-[85vh] min-h-[500px] max-h-[900px] flex items-center justify-center overflow-hidden"
    >
      {/* Background Images - Carousel */}
      <div className="absolute inset-0 z-0">
        {images.map((image, index) => (
          <div
            key={image.src}
            className={`absolute inset-0 transition-opacity duration-1000 ease-out ${index === currentImageIndex
              ? isTransitioning
                ? 'opacity-50'
                : 'opacity-100'
              : 'opacity-0'
              }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              priority={index === 0}
              className="object-cover"
              sizes="100vw"
            />
          </div>
        ))}

        {/* Subtle Gradient Overlay - Only edges, center stays clear */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 pointer-events-none" />
      </div>

      {/* Content */}
      <div className="container-custom relative z-10 text-center">
        {/* Main Title */}
        <h1
          ref={titleRef}
          className="text-display-xl mb-6 text-white"
        >
          <span className="block">Made</span>
          <span className="block font-light">Different</span>
        </h1>

        {/* Subtitle - Short & Sharp */}
        <p
          ref={subtitleRef}
          className="text-lg md:text-xl text-white/80 max-w-md mx-auto mb-10 font-light tracking-wide"
        >
          For the intentional.
        </p>

        {/* CTAs */}
        <div
          ref={ctaRef}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <a
            href="/shop"
            className="px-8 py-4 bg-white text-black text-xs font-medium tracking-widest uppercase hover:bg-transparent hover:text-white border-2 border-white transition-all duration-300"
          >
            Shop Now
          </a>
          <a
            href="/lookbook"
            className="px-8 py-4 bg-transparent text-white text-xs font-medium tracking-widest uppercase border-2 border-white/50 hover:border-white hover:bg-white hover:text-black transition-all duration-300"
          >
            View Collection
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3"
      >
        <span className="text-[10px] text-white/60 tracking-[0.2em] uppercase">
          Scroll
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-white/50 to-transparent" />
      </div>

      {/* Image Indicators */}
      <div className="absolute bottom-12 right-6 z-10 hidden md:flex flex-col gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex
              ? 'bg-white scale-100'
              : 'bg-white/30 scale-75 hover:scale-100'
              }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
