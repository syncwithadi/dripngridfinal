import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { sanityClient } from '@/sanity/client';
import { urlFor } from '@/sanity/image';

interface Props {
  params: { slug: string };
}

async function getPost(slug: string) {
  try {
    const post = await sanityClient.fetch(
      `*[_type == "blog" && slug.current == $slug][0] {
        _id,
        title,
        slug,
        excerpt,
        coverImage,
        publishedAt,
        category,
        readTime,
        author,
        body,
        seoTitle,
        seoDescription,
        tags,
        featured
      }`,
      { slug },
      { next: { revalidate: 3600 } }
    );
    return post ?? null;
  } catch {
    return null;
  }
}

async function getRelatedPosts(slug: string, category: string) {
  try {
    const posts = await sanityClient.fetch(
      `*[_type == "blog" && slug.current != $slug && category == $category] | order(publishedAt desc) [0..2] {
        _id, title, slug, excerpt, coverImage, publishedAt, readTime
      }`,
      { slug, category },
      { next: { revalidate: 3600 } }
    );
    return posts ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: 'Not Found' };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  const coverUrl = post.coverImage
    ? urlFor(post.coverImage)?.width(1200).url()
    : undefined;

  return {
    title: `${title} — DRIPNGRID Journal`,
    description,
    openGraph: {
      title: `${title} — DRIPNGRID Journal`,
      description,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author || 'DRIPNGRID Editorial'],
      url: `https://dripngrid.in/journal/${post.slug?.current}`,
      ...(coverUrl && { images: [{ url: coverUrl, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — DRIPNGRID Journal`,
      description,
      ...(coverUrl && { images: [coverUrl] }),
    },
    alternates: {
      canonical: `https://dripngrid.in/journal/${post.slug?.current}`,
    },
    ...(post.tags?.length && { keywords: post.tags.join(', ') }),
  };
}

export async function generateStaticParams() {
  try {
    const slugs = await sanityClient.fetch(
      `*[_type == "blog"] { "slug": slug.current }`
    );
    return (slugs ?? []).map((s: { slug: string }) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

// Manual Portable Text renderer — no external dependency required
function renderSpan(span: any, markDefs: any[], idx: number): React.ReactNode {
  let text: React.ReactNode = span.text || '';
  const marks: string[] = span.marks || [];

  const linkDef = marks.length
    ? markDefs?.find((d: any) => marks.includes(d._key) && d._type === 'link')
    : null;

  if (linkDef) {
    return (
      <a key={idx} href={linkDef.href} target={linkDef.blank ? '_blank' : undefined}
        rel={linkDef.blank ? 'noopener noreferrer' : undefined}
        className="underline underline-offset-2 hover:text-black transition-colors">
        {text}
      </a>
    );
  }
  if (marks.includes('strong')) return <strong key={idx} className="font-semibold text-black">{text}</strong>;
  if (marks.includes('em')) return <em key={idx} className="italic">{text}</em>;
  return <span key={idx}>{text}</span>;
}

function renderBlock(block: any, idx: number): React.ReactNode {
  if (block._type === 'image') {
    const imgUrl = urlFor(block)?.width(1200).url();
    if (!imgUrl) return null;
    return (
      <figure key={block._key || idx} className="my-8">
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image src={imgUrl} alt={block.alt || ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 800px" />
        </div>
        {block.caption && (
          <figcaption className="text-center text-[11px] text-gray-400 tracking-wider uppercase mt-3">{block.caption}</figcaption>
        )}
      </figure>
    );
  }
  if (block._type !== 'block') return null;
  const children = (block.children || []).map((span: any, si: number) => renderSpan(span, block.markDefs || [], si));
  switch (block.style) {
    case 'h2': return <h2 key={block._key || idx} className="text-xl md:text-2xl font-light tracking-wide text-black mt-10 mb-4">{children}</h2>;
    case 'h3': return <h3 key={block._key || idx} className="text-lg font-normal tracking-wide text-black mt-8 mb-3">{children}</h3>;
    case 'blockquote': return <blockquote key={block._key || idx} className="border-l-2 border-black pl-6 my-8 italic text-gray-600 text-base leading-relaxed">{children}</blockquote>;
    default: return <p key={block._key || idx} className="text-[15px] text-gray-700 leading-relaxed mb-5">{children}</p>;
  }
}

const categoryLabels: Record<string, string> = {
  'style-guide': 'Style Guide',
  'behind-the-brand': 'Behind the Brand',
  culture: 'Culture',
  sustainability: 'Sustainability',
  'new-arrivals': 'New Arrivals',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const related = post.category
    ? await getRelatedPosts(params.slug, post.category)
    : [];

  const coverUrl = post.coverImage
    ? urlFor(post.coverImage)?.width(1400).url()
    : null;

  // JSON-LD: Article structured data for Google
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    image: coverUrl || 'https://dripngrid.in/og-default.jpg',
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: {
      '@type': 'Person',
      name: post.author || 'DRIPNGRID Editorial',
      url: 'https://dripngrid.in',
    },
    publisher: {
      '@type': 'Organization',
      name: 'DRIPNGRID',
      url: 'https://dripngrid.in',
      logo: {
        '@type': 'ImageObject',
        url: 'https://dripngrid.in/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://dripngrid.in/journal/${post.slug?.current}`,
    },
    ...(post.tags?.length && { keywords: post.tags.join(', ') }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="min-h-screen bg-white">
        {/* Cover Image — full width */}
        {coverUrl && (
          <div className="relative w-full aspect-[21/9] bg-gray-100 overflow-hidden">
            <Image
              src={coverUrl}
              alt={post.coverImage?.alt || post.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            {/* subtle gradient at bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}

        {/* Article Content */}
        <div className="container-custom max-w-3xl py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-gray-400 mb-8">
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
            <span>/</span>
            <Link href="/journal" className="hover:text-black transition-colors">Journal</Link>
            {post.category && (
              <>
                <span>/</span>
                <span className="text-black">{categoryLabels[post.category] || post.category}</span>
              </>
            )}
          </nav>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {post.category && (
              <span className="bg-black text-white text-[9px] font-semibold tracking-[0.15em] uppercase px-3 py-1">
                {categoryLabels[post.category] || post.category}
              </span>
            )}
            {post.publishedAt && (
              <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400">
                {formatDate(post.publishedAt)}
              </span>
            )}
            {post.readTime && (
              <span className="text-[11px] tracking-[0.2em] uppercase text-gray-400">
                {post.readTime} min read
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-light tracking-wide text-black leading-snug mb-6">
            {post.title}
          </h1>

          {/* Excerpt / Lead */}
          {post.excerpt && (
            <p className="text-lg text-gray-500 font-light leading-relaxed mb-10 border-b border-gray-100 pb-10">
              {post.excerpt}
            </p>
          )}

          {/* Body */}
          {post.body && (
            <div>{(post.body as any[]).map((block: any, idx: number) => renderBlock(block, idx))}</div>
          )}

          {/* Author + Tags */}
          <div className="mt-14 pt-8 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-gray-400 mb-1">Written by</p>
              <p className="text-sm text-black">{post.author || 'DRIPNGRID Editorial'}</p>
            </div>
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="text-[10px] tracking-[0.15em] uppercase border border-gray-200 text-gray-500 px-3 py-1"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Back to Journal */}
          <div className="mt-10">
            <Link
              href="/journal"
              className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.15em] uppercase text-black border-b border-black pb-px hover:gap-3 transition-all duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3 rotate-180">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
              Back to Journal
            </Link>
          </div>
        </div>

        {/* Related Posts */}
        {related.length > 0 && (
          <div className="bg-[#f9f8f6] py-14 md:py-20">
            <div className="container-custom">
              <h2 className="text-xl font-light tracking-wide text-black mb-10">More from the Journal</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {related.map((p: any) => (
                  <Link key={p._id} href={`/journal/${p.slug?.current}`} className="group block">
                    <div className="relative aspect-[4/3] bg-gray-200 overflow-hidden mb-4">
                      {p.coverImage && (
                        <Image
                          src={urlFor(p.coverImage)?.width(600).url() || ''}
                          alt={p.coverImage?.alt || p.title}
                          fill
                          className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      )}
                    </div>
                    <p className="text-[10px] tracking-[0.25em] uppercase text-gray-400 mb-2">
                      {p.publishedAt && formatDate(p.publishedAt)}
                    </p>
                    <h3 className="text-base font-light tracking-wide text-black group-hover:underline underline-offset-4 line-clamp-2">
                      {p.title}
                    </h3>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </article>
    </>
  );
}
