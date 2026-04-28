'use client';

import { useState, useEffect } from 'react';
import QuickViewModal from '@/components/QuickViewModal';
import { motion } from 'framer-motion';
import ProductCard from '@/components/ProductCard';

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
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        const t = setTimeout(() => setVisible(true), 30);
        return () => clearTimeout(t);
    }, []);

    const handleQuickView = (product: any) => {
        setQuickViewProduct(product);
        setIsQuickViewOpen(true);
    };

    const handleCloseQuickView = () => {
        setIsQuickViewOpen(false);
        setTimeout(() => setQuickViewProduct(null), 300);
    };

    return (
        <div
            className="pt-8 pb-20 min-h-screen container-custom transition-opacity duration-300"
            style={{ opacity: visible ? 1 : 0 }}
        >
            <div className="mb-8 pb-5 border-b border-gray-100">
                <div className="flex items-end justify-between">
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-gray-800"
                    >
                        {title}
                    </motion.h1>
                    {description && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-sm text-gray-400 hidden md:block"
                        >
                            {description}
                        </motion.p>
                    )}
                </div>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-20 text-[var(--color-text-secondary)]">
                    <p>No products found in this collection yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-y-12">
                    {products.map((product) => (
                        <ProductCard key={product.id || product._id} product={product} onQuickView={handleQuickView} />
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
