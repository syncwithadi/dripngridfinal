'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCurrency } from '@/context/CurrencyContext';
import { useWishlistStore } from '@/store/wishlistStore';
import { urlFor } from '@/sanity/image';

interface ProductCardProps {
  product: any;
  onQuickView?: (product: any) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { formatPrice } = useCurrency();
  const { toggleItem, isInWishlist } = useWishlistStore();

  useEffect(() => { setMounted(true); }, []);

  const isWishlisted = mounted ? isInWishlist(product.id) : false;
  const isSoldOut = product.badge === 'sold-out' || !product.inStock;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut) return;
    setAddingToCart(true);
    const { addItem } = require('@/store/cartStore').useCartStore.getState();
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      priceINR: product.priceINR,
      size: product.sizes?.[0] || 'One Size',
      color: product.colors?.[0] || 'Default',
      quantity: 1,
      image: urlFor(product.images?.front)?.width(200).url() || '',
    });
    setTimeout(() => setAddingToCart(false), 1500);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      priceINR: product.priceINR,
      image: urlFor(product.images?.front)?.width(200).url() || '',
      category: product.category,
    });
  };

  const frontImageUrl = urlFor(product.images?.front)?.width(800).url();
  const backImageUrl = urlFor(product.images?.back)?.width(800).url();
  const slug = typeof product.slug === 'string' ? product.slug : product.slug?.current || '';

  return (
    <Link href={`/product/${slug}`} className="block group">
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ── IMAGE ────────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-[#f4f3f0] aspect-[4/5] w-full mb-3">

          {/* Front image */}
          {frontImageUrl && (
            <Image
              src={frontImageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`object-cover transition-all duration-700 ease-out ${isHovered && backImageUrl ? 'opacity-0 scale-[1.03]' : 'opacity-100 scale-100'
                }`}
              priority
            />
          )}

          {/* Back image on hover */}
          {backImageUrl && (
            <Image
              src={backImageUrl}
              alt={`${product.name} - back`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={`object-cover transition-all duration-700 ease-out ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.03]'
                }`}
            />
          )}

          {/* Badge */}
          {product.badge && (
            <div className={`absolute top-3 left-3 text-[9px] font-semibold tracking-[0.15em] uppercase px-2.5 py-1 ${product.badge === 'sold-out' ? 'bg-black/60 text-white' : 'bg-black text-white'
              }`}>
              {product.badge === 'sold-out' ? 'Sold Out' : product.badge}
            </div>
          )}

          {/* Bookmark — top right, fades in on hover */}
          <button
            suppressHydrationWarning
            onClick={handleWishlist}
            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm transition-all duration-300
              ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}
              ${isWishlisted ? 'text-black' : 'text-gray-400 hover:text-black'}`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          </button>
        </div>

        {/* ── PRODUCT INFO ─────────────────────────────────────── */}
        <div className="px-0.5">
          {/* Name */}
          <h3 className="text-[13px] font-normal tracking-wide text-black leading-snug mb-1">
            {product.name}
          </h3>

          {/* Price row — price on left, + button on far right */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap flex-1">
              <span className="text-[13px] font-medium text-black">
                {formatPrice(product.priceINR)}
              </span>
              {product.originalPriceINR && (
                <span className="text-[12px] text-gray-400 line-through">
                  {formatPrice(product.originalPriceINR)}
                </span>
              )}
              {product.originalPriceINR && product.priceINR && (
                <span className="text-[9px] font-semibold text-white bg-black px-1.5 py-0.5 rounded tracking-wide">
                  {Math.round(((product.originalPriceINR - product.priceINR) / product.originalPriceINR) * 100)}% OFF
                </span>
              )}
            </div>

            {/* + icon only — no background circle */}
            <button
              suppressHydrationWarning
              onClick={handleAddToCart}
              disabled={isSoldOut || addingToCart}
              className={`flex-shrink-0 flex items-center justify-center transition-all duration-200 p-0.5
                ${isSoldOut
                  ? 'text-gray-300 cursor-not-allowed'
                  : addingToCart
                    ? 'text-black scale-95'
                    : 'text-gray-400 hover:text-black hover:scale-110'
                }`}
              aria-label={isSoldOut ? 'Sold out' : 'Add to bag'}
            >
              {addingToCart ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
            </button>
          </div>

          {/* Colour dots — hidden */}
        </div>
      </div>
    </Link>
  );
}
