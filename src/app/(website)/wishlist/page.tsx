'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlistStore } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { useCurrency } from '@/context/CurrencyContext';
import { sanityClient } from '@/sanity/client';
import { urlFor } from '@/sanity/image';

export default function WishlistPage() {
  const [mounted, setMounted] = useState(false);
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const { items, removeItem } = useWishlistStore();
  const { addItem: addToCart } = useCartStore();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (items.length === 0) return;
      const ids = items.map((item) => item.productId);
      try {
        const products = await sanityClient.fetch(
          `*[_type == "product" && _id in $ids] {
            _id,
            name,
            slug,
            priceINR,
            images,
            sizes,
            colors
          }`,
          { ids }
        );
        setWishlistProducts(products);
      } catch (error) {
        console.error('Failed to fetch wishlist products:', error);
      }
    };

    if (mounted) {
      fetchWishlistProducts();
    }
  }, [items, mounted]);

  const handleMoveToCart = (item: typeof items[0]) => {
    // Find product in fetched Sanity data
    const product = wishlistProducts.find((p) => p._id === item.productId);
    
    if (product) {
      addToCart({
        productId: product._id,
        name: product.name,
        slug: product.slug.current,
        priceINR: product.priceINR,
        size: product.sizes?.[0] || 'One Size',
        color: product.colors?.[0] || 'Default',
        quantity: 1,
        image: urlFor(product.images.front)?.width(200).url() || '',
      });
      removeItem(item.productId);
    } else {
      // Fallback for legacy items or failure (using stored item data)
      // Note: This might lack size/color info, so maybe redirect instead?
      // For now, let's just log error
      console.error('Product details not found for:', item.name);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <div className="container-custom section-padding">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-display-md text-[var(--color-text)] mb-4">Wishlist</h1>
          <p className="text-[var(--color-text-muted)]">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
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
            <p className="text-[var(--color-text-muted)] mb-8">
              Save items you love for later
            </p>
            <Link
              href="/#new-arrivals"
              className="inline-block px-8 py-4 bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)] text-xs font-medium tracking-widest uppercase hover:bg-transparent hover:text-[var(--color-text)] border-2 border-[var(--color-inverted-bg)] rounded-xl transition-all duration-300"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="group relative bg-[var(--color-bg-secondary)] overflow-hidden"
                >
                  {/* Image */}
                  <Link href={`/#${item.slug}`} className="block relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
                      {item.category}
                    </p>
                    <h3 className="text-sm font-normal text-[var(--color-text)] mb-2">
                      {item.name}
                    </h3>
                    <p className="text-sm font-medium text-[var(--color-text)] mb-4">
                      {formatPrice(item.priceINR)}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMoveToCart(item)}
                        className="flex-1 py-2 px-3 bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)] text-xs font-medium tracking-wider uppercase hover:bg-transparent hover:text-[var(--color-text)] border border-[var(--color-inverted-bg)] transition-all"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="w-10 h-10 flex items-center justify-center border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-[var(--color-text)] transition-all"
                        aria-label="Remove from wishlist"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="text-center pt-8 border-t border-[var(--color-border)]">
              <Link
                href="/#new-arrivals"
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
