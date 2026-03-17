import { sanityClient } from '@/sanity/client';
import { productsByGenderQuery } from '@/sanity/queries';
import GenderPageContent from '@/components/GenderPageContent';
import { urlFor } from '@/sanity/image';

// Disable caching to ensure fresh data
export const revalidate = 0;

export default async function MenPage() {
    const productsRaw = await sanityClient.fetch(productsByGenderQuery, { gender: 'Men' });

    const mapProduct = (p: any) => {
        const imageAsset = p.images?.front?.asset;
        return {
            ...p,
            id: p._id,
            slug: p.slug?.current || p.slug,
            category: p.category?.slug?.current || p.category?.slug || p.category || '',
            image: imageAsset ? urlFor(imageAsset)?.url() : null
        };
    };

    const products = productsRaw?.map(mapProduct) || [];

    return (
        <GenderPageContent
            title="Men's Collection"
            description="Explore our latest collection designed for men."
            products={products}
        />
    );
}
