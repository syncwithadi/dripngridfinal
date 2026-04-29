import { Metadata } from 'next';
import { sanityClient } from '@/sanity/client';
import GenderPageContent from '@/components/GenderPageContent';
import { urlFor } from '@/sanity/image';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Bestsellers | DRIPNGRID',
  description: "Explore DRIPNGRID's most sought-after pieces. Premium designs chosen by those who value quality and identity.",
  alternates: { canonical: 'https://dripngrid.in/bestsellers' },
  openGraph: {
    title: 'Bestsellers | DRIPNGRID',
    description: "Explore DRIPNGRID's most sought-after pieces. Premium designs chosen by those who value quality and identity.",
    url: 'https://dripngrid.in/bestsellers',
  },
};

const bestsellersPageQuery = `*[_type == "product" && isHidden != true] | order(salesCount desc, _createdAt desc) {
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

export default async function BestsellersPage() {
  const productsRaw = await sanityClient.fetch(bestsellersPageQuery);

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
      title="Best Sellers"
      description="Our most-loved pieces — the drops everyone keeps coming back for."
      products={products}
    />
  );
}
