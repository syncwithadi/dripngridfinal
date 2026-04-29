import { Metadata } from 'next';
import { sanityClient } from '@/sanity/client';
import { productsByCategoryQuery } from '@/sanity/queries';
import CategoryContent from './CategoryContent';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const label = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${label} | DRIPNGRID`,
    description: `Shop ${label} by DRIPNGRID — bold design, premium quality streetwear.`,
    alternates: { canonical: `https://dripngrid.in/category/${slug}` },
    openGraph: {
      title: `${label} | DRIPNGRID`,
      description: `Shop ${label} by DRIPNGRID — bold design, premium quality streetwear.`,
      url: `https://dripngrid.in/category/${slug}`,
    },
  };
}

// Update type definition for Next.js 15+
export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let products = [];

  try {
    const productsRaw = await sanityClient.fetch(productsByCategoryQuery, { slug });

    if (productsRaw) {
      products = productsRaw.map((p: any) => ({
        ...p,
        id: p._id,
        slug: p.slug?.current || p.slug,
        category: p.category?.slug?.current || p.category?.slug || p.category,
      }));
    }
  } catch (error) {
    console.error(`Error fetching products for category ${slug}:`, error);
  }

  return (
    <CategoryContent
      products={products}
      categoryName={slug.replace('-', ' ')}
    />
  );
}
