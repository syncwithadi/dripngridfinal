import { sanityClient } from '@/sanity/client';
import { searchQuery } from '@/sanity/queries';
import ProductGrid from '@/components/product/ProductGrid';
import Link from 'next/link';

export const revalidate = 0;

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    const query = q || '';

    if (!query) {
        return (
            <div className="container-custom py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
                <h1 className="text-2xl font-light mb-4 text-[var(--color-text)]">
                    Please enter a search term
                </h1>
                <Link
                    href="/"
                    className="text-sm border-b border-black dark:border-white pb-0.5 hover:opacity-70 transition-opacity"
                >
                    Return Home
                </Link>
            </div>
        );
    }

    const products = await sanityClient.fetch(searchQuery, { searchTerm: query });

    // Map products to ensure structure matches what ProductGrid expects
    const mappedProducts = products.map((p: any) => ({
        ...p,
        id: p._id,
        slug: p.slug?.current || p.slug,
        category: p.category?.slug?.current || p.category?.name || 'Uncategorized',
    }));

    return (
        <div className="container-custom py-16 min-h-[80vh]">
            <div className="mb-12">
                <span className="text-xs font-medium tracking-widest text-[var(--color-text-muted)] uppercase block mb-2">
                    Search Results
                </span>
                <h1 className="text-3xl md:text-4xl font-light text-[var(--color-text)]">
                    "{query}" <span className="text-[var(--color-text-muted)] text-xl ml-2">({products.length} results)</span>
                </h1>
            </div>

            {products.length > 0 ? (
                <ProductGrid products={mappedProducts} />
            ) : (
                <div className="py-20 text-center border-t border-[var(--color-border)]">
                    <p className="text-lg text-[var(--color-text-muted)] mb-6">
                        We couldn't find any matches for "{query}".
                    </p>
                    <div className="flex flex-col gap-2">
                        <p className="text-sm">Try checking for typos or using broader terms.</p>
                        <Link href="/" className="mt-4 inline-block btn-primary w-fit mx-auto">
                            View All Products
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
