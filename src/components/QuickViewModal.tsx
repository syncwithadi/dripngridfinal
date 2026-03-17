'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Product } from '@/data/products';
import { useCurrency } from '@/context/CurrencyContext';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import { urlFor } from '@/sanity/image';

interface QuickViewModalProps {
  product: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const { formatPrice } = useCurrency();
  const { addItem } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWishlisted = mounted && product ? isInWishlist(product.id) : false;

  // Get all available images from the product
  const getProductImages = (prod: any): string[] => {
    if (!prod) return [];
    const imgs = prod.images || {};
    const imageArray: string[] = [];

    // Helper to get URL string
    const getUrl = (source: any) => urlFor(source)?.width(800).url() || '';

    if (imgs.front) imageArray.push(getUrl(imgs.front));
    if (imgs.back) imageArray.push(getUrl(imgs.back));
    if (imgs.left) imageArray.push(getUrl(imgs.left));
    if (imgs.right) imageArray.push(getUrl(imgs.right));
    if (imgs.detail) imageArray.push(getUrl(imgs.detail));
    return imageArray;
  };

  const productImages = getProductImages(product);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (product) {
        setSelectedSize(product.sizes?.[0] || '');
        setSelectedColor(product.colors?.[0] || '');
        setCurrentImageIndex(0);
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, product]);

  const handleAddToCart = () => {
    if (!product || product.badge === 'sold-out') return;

    setAddingToCart(true);

    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      priceINR: product.priceINR,
      size: selectedSize,
      color: selectedColor,
      quantity: quantity,
      image: urlFor(product.images?.front)?.width(200).url() || '',
    });

    setTimeout(() => {
      setAddingToCart(false);
      setQuantity(1);
      onClose();
    }, 1000);
  };

  if (!isOpen || !product) return null;

  const sizeGuideData = [
    { size: 'S', chest: '36-38"', waist: '28-30"', hips: '36-38"' },
    { size: 'M', chest: '39-41"', waist: '31-33"', hips: '39-41"' },
    { size: 'L', chest: '42-44"', waist: '34-36"', hips: '42-44"' },
    { size: 'XL', chest: '45-47"', waist: '37-39"', hips: '45-47"' },
    { size: 'XXL', chest: '48-50"', waist: '40-42"', hips: '48-50"' },
  ];

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-[var(--color-bg)] w-full max-w-5xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center 
            bg-[var(--color-bg)] text-[var(--color-text)] border border-[var(--color-border)]
            hover:bg-[var(--color-inverted-bg)] hover:text-[var(--color-inverted-text)] 
            hover:border-[var(--color-inverted-bg)] transition-all"
          aria-label="Close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
          {/* Image Section - 55% on desktop */}
          <div className="md:w-[55%] flex flex-col bg-[var(--color-bg-secondary)]">
            {/* Main Image */}
            <div className="relative flex-1 min-h-[300px] md:min-h-[400px]">
              <Image
                src={productImages[currentImageIndex] || product.images.front}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 55vw"
              />

              {/* Badge */}
              {product.badge && (
                <div
                  className={`absolute top-4 left-4 px-3 py-1.5 text-xs font-medium tracking-wider uppercase ${product.badge === 'sold-out'
                      ? 'bg-[var(--color-text-muted)] text-[var(--color-bg)]'
                      : 'bg-[var(--color-text)] text-[var(--color-bg)]'
                    }`}
                >
                  {product.badge === 'sold-out' ? 'Sold Out' : product.badge}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {productImages.length > 1 && (
              <div className="flex gap-2 p-4 bg-[var(--color-bg)] border-t border-[var(--color-border-subtle)]">
                {productImages.map((src, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-16 h-20 md:w-20 md:h-24 overflow-hidden transition-all ${currentImageIndex === index
                        ? 'ring-2 ring-[var(--color-text)] ring-offset-2 ring-offset-[var(--color-bg)]'
                        : 'opacity-60 hover:opacity-100'
                      }`}
                  >
                    <Image
                      src={src}
                      alt={`${product.name} - view ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content Section - 45% on desktop */}
          <div className="md:w-[45%] overflow-y-auto">
            <div className="p-6 md:p-8 lg:p-10">
              {/* Category */}
              <span className="text-label text-[var(--color-text-muted)] mb-2 block tracking-widest">
                {product.category}
              </span>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-light tracking-tight text-[var(--color-text)] mb-3">
                {product.name}
              </h2>

              {/* Price */}
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xl font-medium text-[var(--color-text)]">
                  {formatPrice(product.priceINR)}
                </span>
                {product.originalPriceINR && (
                  <span className="text-base text-[var(--color-text-muted)] line-through">
                    {formatPrice(product.originalPriceINR)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-[var(--color-text-muted)] mb-6 leading-relaxed">
                {product.description}
              </p>

              {/* Color Selection */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[var(--color-text)] uppercase tracking-wider">Color</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{selectedColor}</span>
                </div>
                <div className="flex gap-2">
                  {product.colors && product.colors.map((color: string) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color
                          ? 'border-[var(--color-text)] scale-110'
                          : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                        }`}
                      style={{
                        backgroundColor:
                          color.toLowerCase() === 'black' ? '#1a1a1a'
                            : color.toLowerCase() === 'white' || color.toLowerCase() === 'off-white' ? '#f5f5f5'
                              : color.toLowerCase() === 'charcoal' ? '#333333'
                                : color.toLowerCase() === 'grey' || color.toLowerCase() === 'heather grey' ? '#666666'
                                  : color.toLowerCase() === 'navy' || color.toLowerCase() === 'dark navy' ? '#1e3a5f'
                                    : color.toLowerCase() === 'olive' ? '#556b2f'
                                      : color.toLowerCase() === 'tan' ? '#d2b48c'
                                        : color.toLowerCase() === 'burgundy' ? '#800020'
                                          : color.toLowerCase() === 'washed black' ? '#2a2a2a'
                                            : color.toLowerCase() === 'light blue' ? '#87ceeb'
                                              : color.toLowerCase() === 'cream' ? '#f5f5dc'
                                                : color.toLowerCase() === 'indigo' ? '#4b0082'
                                                  : '#666666',
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[var(--color-text)] uppercase tracking-wider">Size</span>
                  <button
                    onClick={() => setShowSizeGuide(!showSizeGuide)}
                    className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline transition-colors"
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes && product.sizes.map((size: string) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[44px] h-10 px-3 text-xs font-medium tracking-wide transition-all ${selectedSize === size
                          ? 'bg-[var(--color-text)] text-[var(--color-bg)] border border-[var(--color-text)]'
                          : 'bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-text)]'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Guide Dropdown */}
              {showSizeGuide && (
                <div className="mb-5 p-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                  <h4 className="text-xs font-medium text-[var(--color-text)] mb-3 uppercase tracking-wider">Size Guide</h4>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                        <th className="py-2 text-left font-medium">Size</th>
                        <th className="py-2 text-left font-medium">Chest</th>
                        <th className="py-2 text-left font-medium">Waist</th>
                        <th className="py-2 text-left font-medium">Hips</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeGuideData.map((row) => (
                        <tr key={row.size} className="text-[var(--color-text)] border-b border-[var(--color-border)]/50">
                          <td className="py-2 font-medium">{row.size}</td>
                          <td className="py-2">{row.chest}</td>
                          <td className="py-2">{row.waist}</td>
                          <td className="py-2">{row.hips}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <span className="text-xs font-medium text-[var(--color-text)] block mb-2 uppercase tracking-wider">Quantity</span>
                <div className="flex items-center">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                    </svg>
                  </button>
                  <span className="w-12 text-center text-[var(--color-text)] font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-text)] transition-colors flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Add to Cart - Full Width, Bold */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.badge === 'sold-out' || addingToCart}
                  className={`w-full py-4 text-sm font-medium tracking-wider uppercase transition-all ${product.badge === 'sold-out'
                      ? 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
                      : addingToCart
                        ? 'bg-[var(--color-text)] text-[var(--color-bg)]'
                        : 'bg-[var(--color-text)] text-[var(--color-bg)] hover:bg-transparent hover:text-[var(--color-text)] border-2 border-[var(--color-text)]'
                    }`}
                >
                  {addingToCart
                    ? 'Added to Cart!'
                    : product.badge === 'sold-out'
                      ? 'Sold Out'
                      : 'Add to Cart'}
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => {
                    if (product) {
                      toggleItem({
                        productId: product.id,
                        name: product.name,
                        slug: product.slug,
                        priceINR: product.priceINR,
                        image: urlFor(product.images?.front)?.width(200).url() || '',
                        category: product.category,
                      });
                    }
                  }}
                  className={`w-full py-3 text-xs font-medium tracking-wider uppercase 
                    transition-all flex items-center justify-center gap-2 ${isWishlisted
                      ? 'bg-[var(--color-text)] text-[var(--color-bg)] border border-[var(--color-text)]'
                      : 'bg-transparent text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-text)]'
                    }`}
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill={isWishlisted ? 'currentColor' : 'none'}
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                    />
                  </svg>
                  {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
                </button>
              </div>

              {/* Shipping Info */}
              <div className="mt-6 pt-5 border-t border-[var(--color-border)] space-y-2">
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                  <span>Free shipping on orders over ₹1,500</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  <span>7-day easy returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
