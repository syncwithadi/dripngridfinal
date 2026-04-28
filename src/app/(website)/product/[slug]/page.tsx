import { sanityClient } from '@/sanity/client';
import { productBySlugQuery, relatedProductsQuery } from '@/sanity/queries';
import { notFound } from 'next/navigation';
import ProductContent from './ProductContent';
import { urlFor } from '@/sanity/image';
import type { Metadata } from 'next';

// Revalidate every 60 seconds for improved SEO performance
export const revalidate = 60;

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const product = await sanityClient.fetch(productBySlugQuery, { slug });

    if (!product) {
        return { title: 'Product Not Found — DRIPNGRID' };
    }

    const title = `${product.name} — DRIPNGRID`;
    const description = product.description
        ? `${product.description.slice(0, 155)}...`
        : `Buy ${product.name} at DRIPNGRID. Premium streetwear, drip so sharp it cuts.`;
    const imageUrl = product.images?.front
        ? urlFor(product.images.front)?.width(1200).height(630).url()
        : 'https://dripngrid.in/images/og-default.jpg';
    const canonicalUrl = `https://dripngrid.in/product/${slug}`;

    return {
        title,
        description,
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title,
            description,
            url: canonicalUrl,
            siteName: 'DRIPNGRID',
            images: [{ url: imageUrl ?? '', width: 1200, height: 630, alt: product.name }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [imageUrl ?? ''],
        },
    };
}

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

    const productImageUrl = product.images?.front
        ? urlFor(product.images.front)?.width(1200).url()
        : null;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || `Buy ${product.name} at DRIPNGRID.`,
        image: productImageUrl ? [productImageUrl] : [],
        brand: {
            '@type': 'Brand',
            name: 'DRIPNGRID',
        },
        url: `https://dripngrid.in/product/${slug}`,
        offers: {
            '@type': 'Offer',
            price: product.priceINR,
            priceCurrency: 'INR',
            availability: product.inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: `https://dripngrid.in/product/${slug}`,
            seller: {
                '@type': 'Organization',
                name: 'DRIPNGRID',
            },
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ProductContent product={product} relatedProducts={relatedProducts} />
        </>
    );
}
