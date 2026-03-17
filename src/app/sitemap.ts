import { MetadataRoute } from 'next';
import { sanityClient } from '@/sanity/client';

const BASE_URL = 'https://dripngrid.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/journal`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/account`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/shipping`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/returns`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/wishlist`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/track-order`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  // Blog posts from Sanity
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await sanityClient.fetch(
      `*[_type == "blog"] { "slug": slug.current, publishedAt }`,
      {},
      { next: { revalidate: 3600 } }
    );
    blogPages = (posts ?? []).map((p: { slug: string; publishedAt: string }) => ({
      url: `${BASE_URL}/journal/${p.slug}`,
      lastModified: p.publishedAt ? new Date(p.publishedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch {
    // Fail silently — sitemap still works without blog posts
  }

  // Products from Sanity
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await sanityClient.fetch(
      `*[_type == "product"] { "slug": slug.current, _updatedAt }`,
      {},
      { next: { revalidate: 3600 } }
    );
    productPages = (products ?? []).map((p: { slug: string; _updatedAt: string }) => ({
      url: `${BASE_URL}/product/${p.slug}`,
      lastModified: p._updatedAt ? new Date(p._updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));
  } catch {
    // Fail silently
  }

  return [...staticPages, ...blogPages, ...productPages];
}
