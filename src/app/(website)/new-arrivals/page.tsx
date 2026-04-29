import { Metadata } from 'next';
import { sanityClient } from '@/sanity/client';
import GenderPageContent from '@/components/GenderPageContent';
import { urlFor } from '@/sanity/image';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'New Arrivals | DRIPNGRID',
  description: 'Discover the latest releases from DRIPNGRID. Fresh drops designed with bold intent and refined quality.',
  alternates: { canonical: 'https://dripngrid.in/new-arrivals' },
  openGraph: {
    title: 'New Arrivals | DRIPNGRID',
    description: 'Discover the latest releases from DRIPNGRID. Fresh drops designed with bold intent and refined quality.',
    url: 'https://dripngrid.in/new-arrivals',
  },
};

const newArrivalsPageQuery = `*[_type == "product" && isHidden != true] | order(_createdAt desc) {
  _id, name, slug, priceINR, originalPriceINR,
  category->{ _id, name, slug },
  images {
    front { asset->{ _id, url } },
    back  { asset->{ _id, url } },
    left  { asset->{ _id, url } },
    right { asset->{ _id, url } },
    detail{ asset->{ _id, url } }
  },
  badge, sizes, colors, description, inStock, gender,
  salesCount, _createdAt
}`;

export default async function NewArrivalsPage() {
  const productsRaw = await sanityClient.fetch(newArrivalsPageQuery);

  const mapProduct = (p: any) => {
    const imageAsset = p.images?.front?.asset;
    return {
      ...p,
      id: p._id,
      slug: p.slug?.current || p.slug,
      category: p.category?.slug?.current || p.category?.slug || p.category || '',
      image: imageAsset ? urlFor(imageAsset)?.url() : null,
    };
  };

  const products = productsRaw?.map(mapProduct) || [];

  return (
    <GenderPageContent
      title="New Arrivals"
      description="The freshest drops — newest pieces added to the collection."
      products={products}
    />
  );
}
