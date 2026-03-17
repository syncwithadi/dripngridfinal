import { sanityClient } from '@/sanity/client';
import { productsByCategoryQuery } from '@/sanity/queries';
import CategoryContent from './CategoryContent';

// Disable caching to ensure fresh data from Sanity on every request
export const revalidate = 0;

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
    // products remains []
  }

  return (
    <CategoryContent
      products={products}
      categoryName={slug.replace('-', ' ')}
    />
  );
}
