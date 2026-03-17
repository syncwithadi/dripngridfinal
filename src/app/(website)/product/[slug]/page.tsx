import { sanityClient } from '@/sanity/client';
import { productBySlugQuery, relatedProductsQuery } from '@/sanity/queries';
import { notFound } from 'next/navigation';
import ProductContent from './ProductContent';

// Disable caching to ensure fresh data
export const revalidate = 0;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    let product = null;
    let relatedProducts = [];

    try {
        product = await sanityClient.fetch(productBySlugQuery, { slug });

        if (product) {
            relatedProducts = await sanityClient.fetch(relatedProductsQuery, {
                categorySlug: product.category?.slug?.current || product.category?.slug,
                currentSlug: slug
            });

            // Process related products
            if (relatedProducts) {
                relatedProducts = relatedProducts.map((p: any) => ({
                    ...p,
                    id: p._id,
                    slug: p.slug?.current || p.slug,
                    category: p.category?.slug?.current || p.category?.slug || p.category,
                }));
            }
        }
    } catch (error) {
        console.error(`Error fetching product with slug ${slug}:`, error);
    }

    if (!product) {
        notFound();
    }

    return <ProductContent product={product} relatedProducts={relatedProducts} />;
}
