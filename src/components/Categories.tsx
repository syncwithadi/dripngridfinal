'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Category {
  name: string;
  slug: string;
  image: string | null;
  count: number;
}

interface CategoriesProps {
  categories: Category[];
}

// Fallback images for categories without images in Sanity
const fallbackImages: Record<string, string> = {
  hoodies: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
  tees: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
  jackets: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
  bottoms: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
  denim: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
};

export default function Categories({ categories }: CategoriesProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation
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

      // Cards stagger animation
      const cards = cardsRef.current?.children;
      if (cards) {
        gsap.from(cards, {
          y: 100,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: cardsRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // If no categories from Sanity, show nothing
  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      id="categories"
      className="section-padding bg-[var(--color-bg-secondary)]"
    >
      <div className="container-custom">
        {/* Section Header */}
        <div ref={titleRef} className="text-center mb-12 md:mb-16">
          <span className="text-label text-[var(--color-text-muted)] mb-4 block tracking-widest">
            Shop By Category
          </span>
          <h2 className="text-display-md text-[var(--color-text)]">
            Collections
          </h2>
        </div>

        {/* Category Cards */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {categories.map((category) => {
            const imageUrl = category.image || fallbackImages[category.slug] || fallbackImages.tees;

            return (
              <a
                key={category.slug}
                href={`/category/${category.slug}`}
                className="group relative overflow-hidden aspect-[3/4]"
              >
                {/* Background Image */}
                <Image
                  src={imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-110"
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  {/* Category Name */}
                  <h3 className="text-display-sm text-white mb-2 group-hover:translate-x-2 transition-transform duration-500">
                    {category.name}
                  </h3>

                  {/* Product Count */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/70">
                      {category.count} Products
                    </span>
                    <span className="w-10 h-10 flex items-center justify-center border border-white/30 text-white group-hover:border-white group-hover:bg-white group-hover:text-black transition-all duration-300">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                        />
                      </svg>
                    </span>
                  </div>

                  {/* Hover Line */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
