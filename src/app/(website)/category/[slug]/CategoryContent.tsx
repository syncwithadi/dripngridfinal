'use client';

import { useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import QuickViewModal from '@/components/QuickViewModal';

interface CategoryContentProps {
  products: any[];
  categoryName: string;
}

export default function CategoryContent({ products, categoryName }: CategoryContentProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const handleQuickView = (product: any) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const closeQuickView = () => {
    setIsQuickViewOpen(false);
    setTimeout(() => setQuickViewProduct(null), 300);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="container-custom pt-6 pb-16">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-[var(--color-text-muted)]">
          <Link href="/" className="hover:text-[var(--color-text)] transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--color-text)]">{categoryName}</span>
        </nav>

        {/* Header */}
        <div className="mb-8 pb-5 border-b border-gray-100">
          <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-1">Category</p>
          <div className="flex items-end justify-between">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-gray-800 capitalize">{categoryName}</h1>
            <p className="text-sm text-gray-400 hidden md:block">{products.length} {products.length === 1 ? 'product' : 'products'}</p>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--color-text-muted)] mb-8">No products in this category yet.</p>
            <Link
              href="/"
              className="inline-block px-8 py-4 bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)] text-xs font-medium tracking-widest uppercase hover:bg-transparent hover:text-[var(--color-text)] border-2 border-[var(--color-inverted-bg)] transition-all duration-300"
            >
              Back to Shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                onQuickView={handleQuickView}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={closeQuickView}
      />
    </div>
  );
}
