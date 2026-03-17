'use client';

import { useState } from 'react';
import ProductGrid from '@/components/product/ProductGrid';
import QuickViewModal from '@/components/QuickViewModal';
import { motion } from 'framer-motion';

interface GenderPageContentProps {
    title: string;
    description?: string;
    products: any[];
}

export default function GenderPageContent({
    title,
    description,
    products,
}: GenderPageContentProps) {
    const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    // We need to pass this handler to ProductCard via ProductGrid
    // Ideally ProductGrid should accept onQuickView prop
    // But currently ProductGrid in `src/components/product/ProductGrid.tsx` has `onQuickView={() => {}}` hardcoded or empty.
    // I will assume for now I should copy the logic from HomeContent or modify ProductGrid.
    // Let's modify ProductGrid to accept onQuickView first, but since I can't easily switch contexts efficiently without multiple turns,
    // I will trust that I can fix ProductGrid in the next step or if it's already compatible (I saw it takes a prop but passes empty func).
    // Actually, I saw `onQuickView={() => { }}` in the file view of ProductGrid.tsx.
    // So I need to update ProductGrid.tsx to accept `onQuickView` from props.
    // For now, I'll write this component assuming ProductGrid will be fixed.

    const handleQuickView = (product: any) => {
        setQuickViewProduct(product);
        setIsQuickViewOpen(true);
    };

    const handleCloseQuickView = () => {
        setIsQuickViewOpen(false);
        setTimeout(() => setQuickViewProduct(null), 300);
    };

    return (
        <div className="pt-24 pb-20 min-h-screen container-custom">
            <div className="mb-12 text-center">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-display-md md:text-display-lg uppercase mb-4"
                >
                    {title}
                </motion.h1>
                {description && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-body-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto"
                    >
                        {description}
                    </motion.p>
                )}
            </div>

            {products.length === 0 ? (
                <div className="text-center py-20 text-[var(--color-text-secondary)]">
                    <p>No products found in this collection yet.</p>
                </div>
            ) : (
                // I will copy the ProductGrid logic here or import it.
                // Importing is better. I will need to update ProductGrid.tsx to actually use the prop.
                // For now I will inline the grid to be safe and ensure QuickView works immediately without relying on editing ProductGrid.tsx
                // actually, re-using ProductCard directly is safer.
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-y-12">
                    {products.map((product) => (
                        // Assuming ProductCard is default export from components/ProductCard
                        // I need to import it.
                        <ProductCardWrapper key={product.id} product={product} onQuickView={handleQuickView} />
                    ))}
                </div>
            )}

            <QuickViewModal
                product={quickViewProduct}
                isOpen={isQuickViewOpen}
                onClose={handleCloseQuickView}
            />
        </div>
    );
}

// Helper wrapper to avoid import issues if ProductCard path is different
import ProductCard from '@/components/ProductCard';

function ProductCardWrapper({ product, onQuickView }: { product: any, onQuickView: (p: any) => void }) {
    return <ProductCard product={product} onQuickView={onQuickView} />;
}
