'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Testimonial {
  id: string | number;
  name: string;
  location: string;
  text: string;
  rating: number;
  product?: string;
}

interface SocialProofProps {
  testimonials: Testimonial[];
}

// Fallback testimonials if none from Sanity
const fallbackTestimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Marcus J.',
    location: 'Mumbai',
    text: 'Amazing quality at this price point. Feels premium.',
    rating: 5,
    product: 'Essential Hoodie',
  },
  {
    id: 2,
    name: 'Priya S.',
    location: 'Delhi',
    text: 'Finally found a brand that understands minimal luxury.',
    rating: 5,
    product: 'Classic Essential Tee',
  },
  {
    id: 3,
    name: 'Arjun K.',
    location: 'Bangalore',
    text: 'The fit is perfect. These are pieces I will wear for years.',
    rating: 5,
    product: 'Slim Straight Jeans',
  },
];

export default function SocialProof({ testimonials }: SocialProofProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  // Use Sanity data if available, otherwise fallback
  const items = testimonials && testimonials.length > 0 ? testimonials : fallbackTestimonials;

  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    // Skip ScrollTrigger on mobile — reduces scroll calculation overhead
    const isMobile = window.innerWidth < 768;
    const ctx = isMobile ? null : gsap.context(() => {
      gsap.from(titleRef.current, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    }, sectionRef);

    // Auto-rotate testimonials
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % items.length);
    }, 5000);

    return () => {
      ctx?.revert();
      clearInterval(interval);
    };
  }, [items.length]);

  const marqueeItems = [
    'Free Worldwide Shipping',
    'Premium Quality',
    'Authentic Clothing',
    'Easy Returns',
    'Secure Payments',
    'Handcrafted Details',
  ];

  return (
    <section
      ref={sectionRef}
      className="section-padding surface-secondary overflow-hidden"
    >
      {/* Seamless Marquee Banner */}
      <div className="mb-16 md:mb-24 overflow-hidden border-y border-[var(--color-border)] py-5">
        <div className="marquee-container">
          <div className="marquee-track">
            {/* Content duplicated for seamless loop */}
            {[...Array(2)].map((_, groupIndex) => (
              <div key={groupIndex} className="marquee-content">
                {marqueeItems.map((item, index) => (
                  <span
                    key={`${groupIndex}-${index}`}
                    className="inline-flex items-center gap-8"
                  >
                    <span className="text-sm md:text-base font-light tracking-wide text-[var(--color-text-secondary)] uppercase">
                      {item}
                    </span>
                    <span className="w-1 h-1 bg-[var(--color-text-muted)] rounded-full" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container-custom">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-12 md:mb-16">
          <span className="text-label mb-4 block">
            Reviews
          </span>
          <h2 className="text-display-md mb-4">
            What They Say
          </h2>
        </div>

        {/* Testimonials */}
        <div className="max-w-3xl mx-auto">
          {/* Main Testimonial */}
          <div className="relative min-h-[280px]">
            {items.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`absolute inset-0 transition-all duration-700 ${index === currentTestimonial
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8 pointer-events-none'
                  }`}
              >
                <div className="text-center">
                  {/* Quote Icon */}
                  <svg
                    className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-8"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>

                  {/* Quote Text */}
                  <blockquote className="text-xl md:text-2xl font-light leading-relaxed mb-8">
                    &quot;{testimonial.text}&quot;
                  </blockquote>

                  {/* Rating - Simple dots */}
                  <div className="flex justify-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full ${i < testimonial.rating
                            ? 'bg-[var(--color-text)]'
                            : 'bg-[var(--color-border)]'
                          }`}
                      />
                    ))}
                  </div>

                  {/* Author */}
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      {testimonial.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Dots */}
          <div className="flex justify-center gap-3 mt-8">
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentTestimonial
                    ? 'bg-[var(--color-text)] scale-100'
                    : 'bg-[var(--color-border)] scale-75 hover:bg-[var(--color-text-muted)]'
                  }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
