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
    <>
      {/* ── MOBILE: horizontal scroll with peek ───────────────────────── */}
      <section
        className="md:hidden w-full flex overflow-x-auto snap-x snap-mandatory scroll-smooth
          [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{ paddingRight: '10vw' }}
      >
        {panels.map(({ label, href, image, placeholder }) => (
          <Link
            key={label}
            href={href}
            className="relative overflow-hidden flex-shrink-0 snap-start"
            style={{
              width: '88vw',
              aspectRatio: '3/4',
              marginRight: '8px',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Background */}
            <div
              className="absolute inset-0"
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
            <div className="absolute bottom-7 left-5 z-10">
              <h2 className="text-white text-2xl font-black tracking-wide uppercase mb-3 drop-shadow-lg">
                {label}
              </h2>
              <div
                className="inline-flex items-center px-5 py-2
                  border border-white text-white text-[11px] font-semibold tracking-[0.18em] uppercase rounded-xl"
              >
                EXPLORE
              </div>
            </div>
          </Link>
        ))}
      </section>

      {/* ── DESKTOP: classic 50/50 side-by-side ───────────────────────── */}
      <section className="hidden md:flex w-full">
        {panels.map(({ label, href, image, placeholder }) => (
          <Link
            key={label}
            href={href}
            className="group relative overflow-hidden cursor-pointer"
            style={{ flex: '1 1 50%', aspectRatio: '339.95/424.94' }}
          >
            {/* Background */}
            <div
              className="absolute inset-0"
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
              <h2 className="text-white text-2xl font-black tracking-wide uppercase mb-3 drop-shadow-lg">
                {label}
              </h2>
              <div
                className="inline-flex items-center px-5 py-2
                  border border-white text-white text-[11px] font-semibold tracking-[0.18em] uppercase rounded-xl"
              >
                EXPLORE
              </div>
            </div>

            {/* Vertical divider */}
            {label === 'SHOP MENS' && (
              <div className="absolute right-0 top-0 bottom-0 w-[1px] bg-white/20 z-10" />
            )}
          </Link>
        ))}
      </section>
    </>
  );
}
