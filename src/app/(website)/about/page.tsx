import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — DRIPNGRID | Premium Streetwear from India',
  description:
    'DRIPNGRID is a premium Indian streetwear label built on refined simplicity — crafted with intention, designed for longevity.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-black text-white pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="container-custom max-w-3xl">
          <p className="text-[10px] tracking-[0.35em] uppercase text-gray-500 mb-4">About</p>
          <h1 className="text-4xl md:text-6xl font-light tracking-wide leading-tight">
            Made with intention.
            <br />
            Worn with purpose.
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="container-custom max-w-2xl py-16 md:py-24 space-y-10 text-[15px] text-gray-600 leading-relaxed">
        <p>
          Founded by Aditya Choudhury in 2026, DRIPNGRID was born from a simple idea: clothing should look exceptional without feeling excessive. It is designed for those who value presence, not noise.
        </p>
        <p>
          Every piece is created to earn its place in your wardrobe. Nothing is rushed. Nothing is disposable. Each detail, from cut to fabric to finish, is considered with purpose.
        </p>
        <p>
          Based in India, DRIPNGRID creates refined fashion for a generation that understands quality, values subtlety, and chooses intention over trends.
        </p>

        <div className="h-px bg-gray-100 my-10" />

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 bg-black text-white text-[11px] font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-gray-900 transition-colors"
          >
            Shop the Collection
          </Link>
          <Link
            href="/journal"
            className="inline-flex items-center justify-center gap-2 border border-black text-black text-[11px] font-medium tracking-[0.15em] uppercase px-8 py-3.5 hover:bg-black hover:text-white transition-colors"
          >
            Read the Journal
          </Link>
        </div>
      </div>
    </div>
  );
}
