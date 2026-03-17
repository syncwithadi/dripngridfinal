import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { sanityClient } from '@/sanity/client';
import { urlFor } from '@/sanity/image';

export const metadata: Metadata = {
  title: 'Journal — DRIPNGRID | Style, Culture & Behind the Brand',
  description:
    'Explore the DRIPNGRID Journal — style guides, brand stories, culture, and the thinking behind every drop.',
  openGraph: {
    title: 'Journal — DRIPNGRID',
    description: 'Style, culture and behind-the-brand stories from DRIPNGRID.',
    type: 'website',
    url: 'https://dripngrid.in/journal',
    images: [{ url: 'https://dripngrid.in/og-journal.jpg', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: 'https://dripngrid.in/journal',
  },
};

async function getPosts() {
  try {
    const posts = await sanityClient.fetch(
      `*[_type == "blog"] | order(publishedAt desc) {
        _id,
        title,
        slug,
        excerpt,
        coverImage,
        publishedAt,
        category,
        readTime,
        author,
        featured,
        tags
      }`,
      {},
      { next: { revalidate: 3600 } }
    );
    return posts ?? [];
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const categoryLabels: Record<string, string> = {
  'style-guide': 'Style Guide',
  'behind-the-brand': 'Behind the Brand',
  culture: 'Culture',
  sustainability: 'Sustainability',
  'new-arrivals': 'New Arrivals',
};

export default async function JournalPage() {
  const posts = await getPosts();
  const featured = posts.find((p: any) => p.featured) || posts[0];
  const rest = featured ? posts.filter((p: any) => p._id !== featured._id) : posts;

  // JSON-LD: Blog structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'DRIPNGRID Journal',
    description: 'Style guides, brand stories, and culture from DRIPNGRID.',
    url: 'https://dripngrid.in/journal',
    publisher: {
      '@type': 'Organization',
      name: 'DRIPNGRID',
      url: 'https://dripngrid.in',
      logo: {
        '@type': 'ImageObject',
        url: 'https://dripngrid.in/logo.png',
      },
    },
    blogPost: posts.slice(0, 10).map((p: any) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      description: p.excerpt,
      datePublished: p.publishedAt,
      url: `https://dripngrid.in/journal/${p.slug?.current}`,
      author: { '@type': 'Person', name: p.author || 'DRIPNGRID Editorial' },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* Page Header */}
        <div className="border-b border-gray-100 pt-24 pb-12 md:pt-32 md:pb-16">
          <div className="container-custom">
            <p className="text-[10px] tracking-[0.35em] uppercase text-gray-400 mb-3">
              DRIPNGRID
            </p>
            <h1 className="text-4xl md:text-5xl font-light tracking-wide text-black">
              Journal
            </h1>
          </div>
        </div>

        <div className="container-custom py-12 md:py-16">
          {posts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-gray-400 text-sm tracking-wide">Coming soon — stories in the making.</p>
            </div>
          ) : (
            <>
              {/* Featured Post */}
              {featured && (
                <Link href={`/journal/${featured.slug?.current}`} className="group block mb-16 md:mb-20">
                  <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Image */}
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                      {featured.coverImage && (
                        <Image
                          src={urlFor(featured.coverImage)?.width(900).url() || ''}
                          alt={featured.coverImage?.alt || featured.title}
                          fill
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                          sizes="(max-width: 768px) 100vw, 50vw"
                          priority
                        />
                      )}
                      {featured.category && (
                        <span className="absolute top-4 left-4 bg-black text-white text-[9px] font-semibold tracking-[0.15em] uppercase px-3 py-1">
                          {categoryLabels[featured.category] || featured.category}
                        </span>
                      )}
                    </div>

                    {/* Text */}
                    <div className="space-y-4">
                      <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400">
                        Featured
                        {featured.publishedAt && ` · ${formatDate(featured.publishedAt)}`}
                        {featured.readTime && ` · ${featured.readTime} min read`}
                      </p>
                      <h2 className="text-2xl md:text-3xl font-light tracking-wide text-black leading-snug group-hover:underline underline-offset-4">
                        {featured.title}
                      </h2>
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                        {featured.excerpt}
                      </p>
                      <span className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.15em] uppercase text-black border-b border-black pb-px group-hover:gap-3 transition-all duration-200">
                        Read more
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* Divider */}
              {rest.length > 0 && (
                <div className="h-px bg-gray-100 mb-14" />
              )}

              {/* Posts Grid */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                  {rest.map((post: any) => (
                    <Link
                      key={post._id}
                      href={`/journal/${post.slug?.current}`}
                      className="group block"
                    >
                      {/* Image */}
                      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden mb-4">
                        {post.coverImage ? (
                          <Image
                            src={urlFor(post.coverImage)?.width(600).url() || ''}
                            alt={post.coverImage?.alt || post.title}
                            fill
                            className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-200" />
                        )}
                        {post.category && (
                          <span className="absolute top-3 left-3 bg-black text-white text-[9px] font-semibold tracking-[0.15em] uppercase px-2.5 py-1">
                            {categoryLabels[post.category] || post.category}
                          </span>
                        )}
                      </div>

                      {/* Meta */}
                      <p className="text-[10px] tracking-[0.25em] uppercase text-gray-400 mb-2">
                        {post.publishedAt && formatDate(post.publishedAt)}
                        {post.readTime && ` · ${post.readTime} min`}
                      </p>

                      {/* Title */}
                      <h3 className="text-base font-light tracking-wide text-black leading-snug mb-2 group-hover:underline underline-offset-4">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-[13px] text-gray-500 leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
