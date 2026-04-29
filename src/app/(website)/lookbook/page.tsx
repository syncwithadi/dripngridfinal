import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { sanityClient } from '@/sanity/client';
import { urlFor } from '@/sanity/image';

export const metadata: Metadata = {
  title: 'Lookbook — DRIPNGRID',
  description: 'Explore the latest DRIPNGRID lookbook — editorial styling for the new generation.',
  alternates: { canonical: 'https://dripngrid.in/lookbook' },
  openGraph: {
    title: 'Lookbook — DRIPNGRID',
    description: 'Explore the latest DRIPNGRID lookbook — editorial styling for the new generation.',
    url: 'https://dripngrid.in/lookbook',
  },
};

async function getLookbook() {
  try {
    const items = await sanityClient.fetch(
      `*[_type == "lookbook"] | order(_createdAt desc) { _id, title, image, caption }`,
      {},
      { next: { revalidate: 3600 } }
    );
    return items ?? [];
  } catch {
    return [];
  }
}

export default async function LookbookPage() {
  const items = await getLookbook();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="pt-24 pb-10 md:pt-32 md:pb-14 border-b border-gray-100">
        <div className="container-custom">
          <p className="text-[10px] tracking-[0.35em] uppercase text-gray-400 mb-3">DRIPNGRID</p>
          <h1 className="text-4xl md:text-5xl font-light tracking-wide text-black">Lookbook</h1>
        </div>
      </div>

      <div className="container-custom py-12 md:py-16">
        {items.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <p className="text-gray-400 text-sm tracking-wide">New season lookbook dropping soon.</p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 border border-black text-black text-[11px] font-medium tracking-[0.15em] uppercase px-6 py-2.5 hover:bg-black hover:text-white transition-colors"
            >
              Shop the Collection
            </Link>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {items.map((item: any) => {
              const imgUrl = item.image ? urlFor(item.image)?.width(800).url() : null;
              return (
                <div key={item._id} className="break-inside-avoid relative overflow-hidden bg-gray-100 group">
                  {imgUrl && (
                    <Image
                      src={imgUrl}
                      alt={item.title || 'Lookbook'}
                      width={800}
                      height={1000}
                      className="w-full h-auto object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                    />
                  )}
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-4 py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-xs tracking-wider">{item.caption}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
