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
import GenderBanner from '@/components/GenderBanner';
import GenderSection from '@/components/GenderSection';
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
  showcaseImage?: string | null;
  showcaseButtonText?: string | null;
  showcaseButtonLink?: string | null;
}

interface HomeContentProps {
  newArrivals: any[];
  bestSellers: any[];
  menProducts: any[];
  womenProducts: any[];
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
  menProducts,
  womenProducts,
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
        bannerButton1Text={banner?.bannerButton1Text ?? 'Shop Men'}
        bannerButton1Link={banner?.bannerButton1Link ?? '/men'}
        bannerButton2Text={banner?.bannerButton2Text ?? 'Shop Women'}
        bannerButton2Link={banner?.bannerButton2Link ?? '/women'}
      />

      {/* New Arrivals */}
      <NewArrivals products={newArrivals} onQuickView={handleQuickView} />

      {/* Shop Men / Women Banner */}
      <GenderBanner />

      {/* Best Sellers */}
      <BestSellers products={bestSellers} onQuickView={handleQuickView} />

      {/* Visual Showcase — image + button controlled from Sanity Studio */}
      <VisualShowcase
        showcaseImage={banner?.showcaseImage}
        showcaseButtonText={banner?.showcaseButtonText}
        showcaseButtonLink={banner?.showcaseButtonLink}
      />

      {/* Shop Men — product carousel */}
      <GenderSection gender="Men" products={menProducts} href="/men" onQuickView={handleQuickView} />

      {/* Shop Women — product carousel */}
      <GenderSection gender="Women" products={womenProducts} href="/women" onQuickView={handleQuickView} />

      {/* Categories */}
      <Categories categories={categories} />

      {/* Lookbook — hidden for now, re-enable when ready */}
      {/* <Lookbook lookbookImages={lookbookImages} /> */}

      {/* Divider */}
      <div className="w-full h-px bg-gradient-to-r from-transparent via-[var(--color-border)] to-transparent opacity-50 my-8 md:my-12" />

      {/* Newsletter */}
      <Newsletter />

      {/* Feature Banner */}
      <FeatureBanner featuredImages={lookbookImages} />



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
