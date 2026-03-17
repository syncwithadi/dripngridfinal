'use client';

import ProductCard from '@/components/ProductCard';

interface RelatedProductsProps {
    products: any[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
    if (!products || products.length === 0) return null;

    return (
        <div className="py-16 md:py-24 border-t border-[var(--color-border)]">
            <div className="container mx-auto px-4">
                <div className="mb-12">
                    <h2 className="text-2xl md:text-3xl font-light tracking-wide uppercase mb-2">
                        You May Also Like
                    </h2>
                    <p className="text-[var(--color-text-muted)] text-sm md:text-base">
                        Combine your style with these products
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
                    {products.map((product) => (
                        <div key={product._id} className="h-full">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
