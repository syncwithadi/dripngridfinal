'use client';

import Link from 'next/link';

interface GenderBannerProps {
  mensImage?: string;
  womensImage?: string;
}

export default function GenderBanner({
  mensImage = '/images/shop mens background.png',
  womensImage = '/images/shop women background.png',
}: GenderBannerProps) {
  const panels = [
    {
      label: 'SHOP MENS',
      href: '/men',
      image: mensImage,
      placeholder: '#1a1a1a',
    },
    {
      label: 'SHOP WOMENS',
      href: '/women',
      image: womensImage,
      placeholder: '#111111',
    },
  ];

  return (
    <section className="w-full flex">
      {panels.map(({ label, href, image, placeholder }) => (
        <Link
          key={label}
          href={href}
          className="group relative overflow-hidden cursor-pointer"
          style={{ flex: '1 1 50%', aspectRatio: '339.95/424.94' }}
        >
          {/* Background */}
          <div
            className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105"
            style={{
              backgroundColor: placeholder,
              backgroundImage: image ? `url('${image}')` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
            }}
          />

          {/* Dark gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20 pointer-events-none" />

          {/* Text + button */}
          <div className="absolute bottom-10 left-8 z-10">
            <h2 className="text-white text-3xl md:text-4xl font-black tracking-wider uppercase mb-4 drop-shadow-lg">
              {label}
            </h2>
            <div
              className="inline-flex items-center gap-2 px-5 py-2.5
                border border-white text-white text-xs font-semibold tracking-[0.2em] uppercase
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

          {/* Divider between panels */}
          {label === 'SHOP MENS' && (
            <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/20 z-10" />
          )}
        </Link>
      ))}
    </section>
  );
}
