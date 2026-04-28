'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWishlistStore } from '@/store/wishlistStore';
import { sanityClient } from '@/sanity/client';
import ProductCard from '@/components/ProductCard';

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { items } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (items.length === 0) {
        setWishlistProducts([]);
        return;
      }
      setLoading(true);
      const ids = items.map((item) => item.productId);
      try {
        const products = await sanityClient.fetch(
          `*[_type == "product" && _id in $ids] {
            _id,
            name,
            slug,
            priceINR,
            originalPriceINR,
            images,
            sizes,
            colors,
            badge,
            inStock,
            category
          }`,
          { ids }
        );
        // Map _id → id so ProductCard's isInWishlist check works correctly
        setWishlistProducts(products.map((p: any) => ({ ...p, id: p._id })));
      } catch (error) {
        console.error('Failed to fetch wishlist products:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchWishlistProducts();
    }
  }, [items, mounted]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="container-custom pt-6 pb-16">

        {/* Header */}
        <div className="mb-8 pb-5 border-b border-gray-100">
          <div className="flex items-end justify-between">
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-gray-800">Wishlist</h1>
            <p className="text-sm text-gray-400">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
          </div>
        </div>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className="text-center py-20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="w-16 h-16 mx-auto mb-6 text-[var(--color-text-muted)]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
              />
            </svg>
            <h2 className="text-xl font-light text-[var(--color-text)] mb-4">Your wishlist is empty</h2>
            <p className="text-[var(--color-text-muted)] mb-8">Save items you love for later</p>
            <Link
              href="/shop"
              className="inline-block px-8 py-4 bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)] text-xs font-medium tracking-widest uppercase hover:bg-transparent hover:text-[var(--color-text)] border-2 border-[var(--color-inverted-bg)] rounded-xl transition-all duration-300"
            >
              Continue Shopping
            </Link>
          </div>

        ) : loading ? (
          /* Skeleton while fetching full product data */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
            {items.map((item) => (
              <div key={item.productId} className="space-y-3">
                <div className="aspect-[4/5] w-full rounded-2xl bg-gray-100 animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
              </div>
            ))}
          </div>

        ) : (
          <>
            {/* Product Grid — same ProductCard used across the site */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
              {wishlistProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="text-center pt-8 border-t border-[var(--color-border)]">
              <Link
                href="/shop"
                className="inline-block px-8 py-4 bg-transparent text-[var(--color-text)] text-xs font-medium tracking-widest uppercase border-2 border-[var(--color-text)] hover:bg-[var(--color-inverted-bg)] hover:text-[var(--color-inverted-text)] hover:border-[var(--color-inverted-bg)] rounded-xl transition-all duration-300"
              >
                Continue Shopping
              </Link>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
