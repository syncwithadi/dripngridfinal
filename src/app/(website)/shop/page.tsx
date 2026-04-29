import { Metadata } from 'next';
import { sanityClient } from '@/sanity/client';
import { allProductsQuery } from '@/sanity/queries';
import ShopPageClient from './ShopPageClient';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Shop All | DRIPNGRID",
  description: "Browse the full DRIPNGRID collection — oversized tees, hoodies, cargos, and more. Bold design, premium quality.",
  alternates: { canonical: 'https://dripngrid.in/shop' },
  openGraph: {
    title: "Shop All | DRIPNGRID",
    description: "Browse the full DRIPNGRID collection — oversized tees, hoodies, cargos, and more.",
    url: 'https://dripngrid.in/shop',
  },
};

export default async function ShopPage() {
  let products = [];
  try {
    products = await sanityClient.fetch(allProductsQuery) ?? [];
  } catch {
    // Fail silently — client handles empty state
  }

  return <ShopPageClient products={products} />;
}
