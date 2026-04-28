import { NextRequest, NextResponse } from 'next/server';
import { sanityClient } from '@/sanity/client';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!q || q.length < 2) return NextResponse.json([]);

  // Split into individual words so "blue tee" finds "Baby Blue Tee"
  const words = q.split(/\s+/).filter(Boolean);

  // Build a GROQ filter that matches any word in the name starting with each search word
  // GROQ `match` checks word boundaries, so "tee*" matches "Tee", "Tees" but not "Steet"
  const wordFilters = words
    .map((_, i) => `name match $w${i} + "*"`)
    .join(' && ');

  const params: Record<string, string> = {};
  words.forEach((w, i) => { params[`w${i}`] = w; });

  const query = `*[_type == "product" && isHidden != true && (
    ${wordFilters}
  )] | order(_createdAt desc)[0...8] {
    _id,
    name,
    slug,
    priceINR,
    originalPriceINR,
    badge,
    inStock,
    "image": images.front.asset->url
  }`;

  try {
    const results = await sanityClient.fetch(query, params);

    // If strict word match returns nothing, fall back to a broader single-term search
    if (!results || results.length === 0) {
      const fallback = await sanityClient.fetch(
        `*[_type == "product" && isHidden != true && name match $q + "*"] | order(_createdAt desc)[0...8] {
          _id, name, slug, priceINR, originalPriceINR, badge, inStock,
          "image": images.front.asset->url
        }`,
        { q: words[0] ?? q }
      );
      return NextResponse.json(fallback ?? []);
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('[search]', err);
    return NextResponse.json([]);
  }
}
