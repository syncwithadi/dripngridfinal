'use client';

import { useState } from 'react';
import PremiumBanner from '@/components/PremiumBanner';
import Hero from '@/components/Hero'; // Keeping import if needed or we can remove
import NewArrivals from '@/components/NewArrivals';
import BestSellers from '@/components/BestSellers';
import VisualShowcase from '@/components/VisualShowcase';
import Lookbook from '@/components/Lookbook';
import Categories from '@/components/Categories';
import SocialProof from '@/components/SocialProof';
import Newsletter from '@/components/Newsletter';
import FeatureBanner from '@/components/FeatureBanner';
import EndSection from '@/components/EndSection';
import QuickViewModal from '@/components/QuickViewModal';

interface HeroImage {
  src: string;
  alt: string;
}

interface Category {
  name: string;
  slug: string;
  image: string | null;
  count: number;
}

interface LookbookImage {
  id: string | number;
  title: string;
  image: string;
}

interface Testimonial {
  id: string | number;
  name: string;
  location: string;
  text: string;
  rating: number;
  product?: string;
}

interface BannerData {
  bannerImage?: string | null;
  bannerHeading?: string | null;
  bannerSubtitle?: string | null;
  bannerButton1Text?: string | null;
  bannerButton1Link?: string | null;
  bannerButton2Text?: string | null;
  bannerButton2Link?: string | null;
}

interface HomeContentProps {
  newArrivals: any[];
  bestSellers: any[];
  categories: Category[];
  heroImages: HeroImage[];
  lookbookImages: LookbookImage[];
  testimonials: Testimonial[];
  philosophy: any;
  banner?: BannerData | null;
}

export default function HomeContent({
  newArrivals,
  bestSellers,
  categories,
  heroImages,
  lookbookImages,
  testimonials,
  philosophy,
  banner,
}: HomeContentProps) {
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const handleQuickView = (product: any) => {
    setQuickViewProduct(product);
    setIsQuickViewOpen(true);
  };

  const handleCloseQuickView = () => {
    setIsQuickViewOpen(false);
    setTimeout(() => setQuickViewProduct(null), 300);
  };

  return (
    <>
      {/* Premium Banner (Replaces Hero) — fully controlled from Sanity Studio */}
      <PremiumBanner
        bannerImage={banner?.bannerImage}
        bannerHeading={banner?.bannerHeading}
        bannerSubtitle={banner?.bannerSubtitle}
        bannerButton1Text={banner?.bannerButton1Text}
        bannerButton1Link={banner?.bannerButton1Link}
        bannerButton2Text={banner?.bannerButton2Text}
        bannerButton2Link={banner?.bannerButton2Link}
      />

      {/* New Arrivals */}
      <NewArrivals products={newArrivals} onQuickView={handleQuickView} />

      {/* Best Sellers */}
      <BestSellers products={bestSellers} onQuickView={handleQuickView} />

      {/* Visual Showcase (Replaces Philosophy) */}
      <VisualShowcase />

      {/* Categories */}
      <Categories categories={categories} />

      {/* Lookbook — hidden for now, re-enable when ready */}
      {/* <Lookbook lookbookImages={lookbookImages} /> */}

      {/* Divider / Separation */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent opacity-50 my-16 md:my-24" />

      {/* Newsletter */}
      <Newsletter />

      {/* Feature Banner */}
      <div className="mb-24">
        <FeatureBanner featuredImages={lookbookImages} />
      </div>

      {/* Spacing for visual separation */}
      <div className="h-24 md:h-32" />

      {/* End Section */}
      <EndSection />

      {/* Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={handleCloseQuickView}
      />
    </>
  );
}
