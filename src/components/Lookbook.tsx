'use client';

import Image from 'next/image';

interface LookbookImage {
  id: string | number;
  title: string;
  image: string;
}

interface LookbookProps {
  lookbookImages: LookbookImage[];
}

// Fallback images if none from Sanity
const fallbackImages: LookbookImage[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
    title: 'FW25',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    title: 'Editorial',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80',
    title: 'Street',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
    title: 'Campaign',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&q=80',
    title: 'Urban',
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1504194921103-f8b80cadd5e4?w=800&q=80',
    title: 'Details',
  },
];

export default function Lookbook({ lookbookImages }: LookbookProps) {
  // Use Sanity data if available, otherwise fallback
  const images = lookbookImages && lookbookImages.length > 0 ? lookbookImages : fallbackImages;

  return (
    <section id="lookbook" className="py-24 bg-[var(--color-bg)] overflow-hidden">
      <div className="container-wide mb-12 text-center">
        <h2 className="text-3xl md:text-5xl font-light tracking-wide text-[var(--color-text)] uppercase mb-4">
          Lookbook
        </h2>
        <p className="text-[var(--color-text-muted)] max-w-lg mx-auto mb-12">
          A glimpse into the lifestyle.
        </p>
      </div>

      <div className="relative w-full">
        {/* Single track with doubled images for seamless loop */}
        <div className="marquee-container">
          <div className="marquee-track flex">
            {/* First set of images */}
            {images.map((item, index) => (
              <div
                key={`first-${item.id}-${index}`}
                className="relative w-[300px] h-[450px] md:w-[400px] md:h-[600px] flex-shrink-0 mx-4 transition-transform duration-500 hover:scale-95"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-all duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-lg font-light tracking-widest uppercase">{item.title}</span>
                </div>
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {images.map((item, index) => (
              <div
                key={`second-${item.id}-${index}`}
                className="relative w-[300px] h-[450px] md:w-[400px] md:h-[600px] flex-shrink-0 mx-4 transition-transform duration-500 hover:scale-95"
                aria-hidden="true"
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-all duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-lg font-light tracking-widest uppercase">{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
