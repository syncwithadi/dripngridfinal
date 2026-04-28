'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Category {
  name: string;
  slug: string;
  image: string | null;
  count: number;
}

interface CategoriesProps {
  categories: Category[];
}

// Local collection images — mapped by category slug
const localImages: Record<string, string> = {
  hoodies: '/images/collection/hoodies.png',
  jackets: '/images/collection/jacket collection.png',
  jacket: '/images/collection/jacket collection.png',
  bottoms: '/images/collection/jeans collection.png',
  jeans: '/images/collection/jeans collection.png',
  denim: '/images/collection/jeans collection.png',
  tees: '/images/collection/tshirt collection.png',
  tshirts: '/images/collection/tshirt collection.png',
  't-shirts': '/images/collection/tshirt collection.png',
};

// Unsplash fallback for any unlisted slug
const fallbackImage = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80';

export default function Categories({ categories }: CategoriesProps) {
  if (!categories || categories.length === 0) return null;

  // Show max 4 panels
  const panels = categories.slice(0, 4);

  return (
    <section id="categories" className="w-full flex">
      {panels.map((category, i) => {
        // Local image takes priority, then Sanity image, then generic fallback
        const imageUrl =
          localImages[category.slug.toLowerCase()] ||
          localImages[category.name.toLowerCase()] ||
          category.image ||
          fallbackImage;

        return (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="group relative overflow-hidden cursor-pointer"
            style={{ flex: `1 1 ${100 / panels.length}%`, aspectRatio: '4/5' }}
          >
            {/* Background image */}
            <div
              className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage: `url('${imageUrl}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
                backgroundColor: '#1a1a1a',
              }}
            />

            {/* Dark gradient — bottom heavy like GenderBanner */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20 pointer-events-none" />

            {/* Text + Explore button */}
            <div className="absolute bottom-10 left-8 z-10">
              <h2 className="text-white text-2xl md:text-3xl font-black tracking-wider uppercase mb-4 drop-shadow-lg">
                {category.name}
              </h2>
              <div
                className="inline-flex items-center gap-2 px-5 py-2.5
                  border border-white text-white text-xs font-semibold tracking-[0.2em] uppercase rounded-xl
                  group-hover:bg-white group-hover:text-black
                  transition-all duration-300"
              >
                Explore
                <svg
                  className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                </svg>
              </div>
            </div>

            {/* Vertical divider between panels (not on last) */}
            {i < panels.length - 1 && (
              <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/20 z-10" />
            )}
          </Link>
        );
      })}
    </section>
  );
}
