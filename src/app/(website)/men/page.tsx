import { Metadata } from 'next';
import { sanityClient } from '@/sanity/client';
import { productsByGenderQuery } from '@/sanity/queries';
import GenderPageContent from '@/components/GenderPageContent';
import { urlFor } from '@/sanity/image';

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Men's Collection | DRIPNGRID",
  description: "Shop men's streetwear by DRIPNGRID — oversized tees, hoodies, cargos, joggers and more. Bold design, premium quality.",
  alternates: { canonical: 'https://dripngrid.in/men' },
  openGraph: {
    title: "Men's Collection | DRIPNGRID",
    description: "Shop men's streetwear by DRIPNGRID — oversized tees, hoodies, cargos, joggers and more.",
    url: 'https://dripngrid.in/men',
  },
};

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
