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
                <div className="mb-10">
                    <h2 className="text-2xl md:text-3xl font-black tracking-wide uppercase mb-1.5 text-gray-800"
                        style={{ fontStyle: 'italic' }}>
                        YOU MAY ALSO LIKE
                    </h2>
                    <p className="text-gray-500 text-sm">
                        Combine your style with these products
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-8">
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
