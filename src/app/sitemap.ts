import { MetadataRoute } from 'next';
import { sanityClient } from '@/sanity/client';

const BASE_URL = 'https://dripngrid.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static public pages only — no private/auth routes
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL,                   lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0  },
    { url: `${BASE_URL}/shop`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.95 },
    { url: `${BASE_URL}/men`,          lastModified: new Date(), changeFrequency: 'daily',   priority: 0.95 },
    { url: `${BASE_URL}/women`,        lastModified: new Date(), changeFrequency: 'daily',   priority: 0.95 },
    { url: `${BASE_URL}/new-arrivals`, lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9  },
    { url: `${BASE_URL}/bestsellers`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9  },
    { url: `${BASE_URL}/journal`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.75 },
    { url: `${BASE_URL}/lookbook`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7  },
    { url: `${BASE_URL}/about`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6  },
    { url: `${BASE_URL}/faq`,          lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6  },
    { url: `${BASE_URL}/size-guide`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5  },
    { url: `${BASE_URL}/shipping`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5  },
    { url: `${BASE_URL}/returns`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5  },
    { url: `${BASE_URL}/privacy`,      lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3  },
    { url: `${BASE_URL}/terms`,        lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3  },
  ];

  // Dynamic category pages from Sanity
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await sanityClient.fetch(
      `*[_type == "category"] { "slug": slug.current, _updatedAt }`,
      {},
      { next: { revalidate: 3600 } }
    );
    categoryPages = (categories ?? []).map((c: { slug: string; _updatedAt: string }) => ({
      url: `${BASE_URL}/category/${c.slug}`,
      lastModified: c._updatedAt ? new Date(c._updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }));
  } catch {
    // Fail silently
  }

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
      priority: 0.75,
    }));
  } catch {
    // Fail silently
  }

  // Products from Sanity (hidden products excluded)
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const products = await sanityClient.fetch(
      `*[_type == "product" && isHidden != true] { "slug": slug.current, _updatedAt }`,
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

  return [...staticPages, ...categoryPages, ...blogPages, ...productPages];
}
