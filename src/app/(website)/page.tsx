import { sanityClient } from '@/sanity/client';
import { newArrivalsQuery, bestSellersQuery, allCategoriesQuery, heroImagesQuery, lookbookQuery, testimonialsQuery, philosophyQuery, bannerQuery, productsByGenderQuery } from '@/sanity/queries';
import HomeContent from './HomeContent';
import { urlFor } from '@/sanity/image';

// Revalidate every 5 minutes for improved SEO performance
export const revalidate = 300;

export default async function Home() {
  // Fetch all data from Sanity in parallel
  const [newArrivalsRaw, bestSellersRaw, categoriesRaw, heroImagesRaw, lookbookRaw, testimonialsRaw, philosophyRaw, bannerRaw, menProductsRaw, womenProductsRaw] = await Promise.all([
    sanityClient.fetch(newArrivalsQuery),
    sanityClient.fetch(bestSellersQuery),
    sanityClient.fetch(allCategoriesQuery),
    sanityClient.fetch(heroImagesQuery),
    sanityClient.fetch(lookbookQuery),
    sanityClient.fetch(testimonialsQuery),
    sanityClient.fetch(philosophyQuery),
    sanityClient.fetch(bannerQuery),
    sanityClient.fetch(productsByGenderQuery, { gender: 'Men' }),
    sanityClient.fetch(productsByGenderQuery, { gender: 'Women' }),
  ]);

  const mapProduct = (p: any) => ({
    ...p,
    id: p._id,
    slug: p.slug?.current || p.slug,
    category: p.category?.slug?.current || p.category?.slug || p.category,
  });

  const newArrivals = newArrivalsRaw?.map(mapProduct) || [];
  const bestSellers = bestSellersRaw?.map(mapProduct) || [];
  const menProducts = menProductsRaw?.map(mapProduct) || [];
  const womenProducts = womenProductsRaw?.map(mapProduct) || [];

  // Map categories with image URLs
  const categories = (categoriesRaw || []).map((cat: any) => ({
    name: cat.name,
    slug: cat.slug?.current || cat.slug,
    image: cat.image ? urlFor(cat.image)?.width(800).url() : null,
    count: cat.count || 0,
  }));

  // Map hero images
  const heroImages = (heroImagesRaw || []).map((img: any) => ({
    src: img.src,
    alt: img.alt || 'Hero image',
  }));

  // Map lookbook items
  const lookbookImages = (lookbookRaw || []).map((item: any, index: number) => ({
    id: item._id || index + 1,
    title: item.title,
    image: item.image,
  }));

  // Map testimonials
  const testimonials = (testimonialsRaw || []).map((t: any, index: number) => ({
    id: t._id || index + 1,
    name: t.name,
    location: t.location,
    text: t.text,
    rating: t.rating || 5,
    product: t.product,
  }));

  return (
    <HomeContent
      newArrivals={newArrivals}
      bestSellers={bestSellers}
      menProducts={menProducts}
      womenProducts={womenProducts}
      categories={categories}
      heroImages={heroImages}
      lookbookImages={lookbookImages}
      testimonials={testimonials}
      philosophy={philosophyRaw}
      banner={bannerRaw}
    />
  );
}
