'use client';

import ProductCard from '@/components/ProductCard';

interface Product {
    id: string;
    name: string;
    slug: string;
    priceINR: number;
    originalPriceINR?: number;
    images: {
        front: { asset: { url: string } };
        back?: { asset: { url: string } };
    };
    badge?: string;
    inStock?: boolean;
    category: string;
}

interface ProductGridProps {
    products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-y-12">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    // Assuming ProductCard handles its own QuickView logic internally or doesn't mandate it for search grids
                    // If it mandates it, we might need to add a placeholder or simple handler
                    onQuickView={() => { }}
                />
            ))}
        </div>
    );
}
