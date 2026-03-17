export interface ProductImages {
  front: string;
  back: string;
  left?: string;
  right?: string;
  detail?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  priceINR: number;
  priceUSD: number;
  originalPriceINR?: number;
  originalPriceUSD?: number;
  category: string;
  images: ProductImages;
  badge?: 'new' | 'sale' | 'sold-out';
  sizes: string[];
  colors: string[];
  description: string;
  inStock: boolean;
}

export const products: Product[] = [
  // TEES (6 products)
  {
    id: 'classic-essential-tee',
    slug: 'classic-essential-tee',
    name: 'Classic Essential Tee',
    priceINR: 799,
    priceUSD: 10,
    category: 'tees',
    images: {
      front: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&q=80',
      detail: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&q=80',
    },
    badge: 'new',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black', 'Grey'],
    description: 'Premium 100% cotton tee with a relaxed fit. The perfect everyday essential.',
    inStock: true,
  },
  {
    id: 'oversized-boxy-tee',
    slug: 'oversized-boxy-tee',
    name: 'Oversized Boxy Tee',
    priceINR: 899,
    priceUSD: 11,
    category: 'tees',
    images: {
      front: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80',
      detail: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&q=80',
    },
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Off-White', 'Charcoal'],
    description: 'Dropped shoulders and boxy silhouette for that effortless street style look.',
    inStock: true,
  },
  {
    id: 'vintage-wash-tee',
    slug: 'vintage-wash-tee',
    name: 'Vintage Wash Tee',
    priceINR: 999,
    priceUSD: 12,
    originalPriceINR: 1299,
    originalPriceUSD: 16,
    category: 'tees',
    images: {
      front: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=800&q=80',
    },
    badge: 'sale',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Washed Black', 'Grey'],
    description: 'Pre-washed for that lived-in softness from day one. Subtle vintage aesthetic.',
    inStock: true,
  },
  {
    id: 'minimal-logo-tee',
    slug: 'minimal-logo-tee',
    name: 'Minimal Logo Tee',
    priceINR: 699,
    priceUSD: 9,
    category: 'tees',
    images: {
      front: 'https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1622470953794-aa9c70b0fb9d?w=800&q=80',
    },
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['White', 'Black'],
    description: 'Understated elegance with embroidered chest logo. Clean and versatile.',
    inStock: true,
  },
  {
    id: 'heavyweight-pocket-tee',
    slug: 'heavyweight-pocket-tee',
    name: 'Heavyweight Pocket Tee',
    priceINR: 1099,
    priceUSD: 14,
    category: 'tees',
    images: {
      front: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&q=80',
    },
    badge: 'new',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Navy', 'Olive'],
    description: '280 GSM heavyweight cotton with chest pocket. Built to last.',
    inStock: true,
  },
  {
    id: 'striped-cotton-tee',
    slug: 'striped-cotton-tee',
    name: 'Striped Cotton Tee',
    priceINR: 899,
    priceUSD: 11,
    category: 'tees',
    images: {
      front: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&q=80',
    },
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy'],
    description: 'Classic horizontal stripes in premium cotton. Timeless Breton style.',
    inStock: true,
  },

  // HOODIES (5 products)
  {
    id: 'essential-hoodie',
    slug: 'essential-hoodie',
    name: 'Essential Hoodie',
    priceINR: 1499,
    priceUSD: 18,
    category: 'hoodies',
    images: {
      front: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=800&q=80',
      left: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80',
    },
    badge: 'new',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Grey', 'Off-White'],
    description: 'Premium French terry hoodie with kangaroo pocket. Your everyday essential.',
    inStock: true,
  },
  {
    id: 'oversized-pullover',
    slug: 'oversized-pullover',
    name: 'Oversized Pullover',
    priceINR: 1399,
    priceUSD: 17,
    category: 'hoodies',
    images: {
      front: 'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=800&q=80',
    },
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Charcoal', 'Black', 'Cream'],
    description: 'Relaxed oversized fit with dropped shoulders. Cozy meets contemporary.',
    inStock: true,
  },
  {
    id: 'zip-up-hoodie',
    slug: 'zip-up-hoodie',
    name: 'Zip-Up Hoodie',
    priceINR: 1299,
    priceUSD: 16,
    originalPriceINR: 1699,
    originalPriceUSD: 21,
    category: 'hoodies',
    images: {
      front: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800&q=80',
    },
    badge: 'sale',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy'],
    description: 'Full-zip design with YKK zipper. Easy layering for transitional weather.',
    inStock: true,
  },
  {
    id: 'heavyweight-crewneck',
    slug: 'heavyweight-crewneck',
    name: 'Heavyweight Crewneck',
    priceINR: 1199,
    priceUSD: 15,
    category: 'hoodies',
    images: {
      front: 'https://images.unsplash.com/photo-1614975059251-992f11792571?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
    },
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Grey', 'Navy', 'Off-White'],
    description: 'Classic crewneck sweatshirt in 400 GSM fleece. Substantial and warm.',
    inStock: true,
  },
  {
    id: 'minimal-hoodie',
    slug: 'minimal-hoodie',
    name: 'Minimal Hoodie',
    priceINR: 1249,
    priceUSD: 15,
    category: 'hoodies',
    images: {
      front: 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1505022610485-0249ba5b3675?w=800&q=80',
    },
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Heather Grey'],
    description: 'Clean lines, no logos. Pure minimalist design for the understated.',
    inStock: true,
  },

  // DENIM (4 products)
  {
    id: 'slim-straight-jeans',
    slug: 'slim-straight-jeans',
    name: 'Slim Straight Jeans',
    priceINR: 1399,
    priceUSD: 17,
    category: 'bottoms',
    images: {
      front: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80',
      detail: 'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=800&q=80',
    },
    badge: 'new',
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Indigo', 'Black', 'Washed Black'],
    description: 'Classic 5-pocket jeans in rigid denim. Slim fit with a straight leg.',
    inStock: true,
  },
  {
    id: 'relaxed-fit-denim',
    slug: 'relaxed-fit-denim',
    name: 'Relaxed Fit Denim',
    priceINR: 1499,
    priceUSD: 18,
    category: 'bottoms',
    images: {
      front: 'https://images.unsplash.com/photo-1475178626620-a4d074967452?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=80',
    },
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Light Blue', 'Washed Black'],
    description: 'Easy relaxed fit with tapered leg. Comfortable all-day wear.',
    inStock: true,
  },
  {
    id: 'cargo-pants',
    slug: 'cargo-pants',
    name: 'Cargo Pants',
    priceINR: 1299,
    priceUSD: 16,
    originalPriceINR: 1599,
    originalPriceUSD: 20,
    category: 'bottoms',
    images: {
      front: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&q=80',
      detail: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&q=80',
    },
    badge: 'sale',
    sizes: ['28', '30', '32', '34', '36'],
    colors: ['Black', 'Olive', 'Tan'],
    description: 'Utility cargo pants with multiple pockets. Functional street style.',
    inStock: true,
  },
  {
    id: 'wide-leg-jeans',
    slug: 'wide-leg-jeans',
    name: 'Wide Leg Jeans',
    priceINR: 1399,
    priceUSD: 17,
    category: 'bottoms',
    images: {
      front: 'https://images.unsplash.com/photo-1605518216938-7c31b7b14ad0?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=800&q=80',
    },
    sizes: ['28', '30', '32', '34'],
    colors: ['Indigo', 'Light Blue'],
    description: 'Wide leg silhouette with high waist. Contemporary denim statement.',
    inStock: true,
  },

  // JACKETS (3 products)
  {
    id: 'denim-jacket',
    slug: 'denim-jacket',
    name: 'Denim Jacket',
    priceINR: 1499,
    priceUSD: 18,
    category: 'jackets',
    images: {
      front: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=800&q=80',
      detail: 'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?w=800&q=80',
    },
    badge: 'new',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Indigo', 'Washed Black'],
    description: 'Classic trucker jacket in rigid denim. A timeless wardrobe staple.',
    inStock: true,
  },
  {
    id: 'bomber-jacket',
    slug: 'bomber-jacket',
    name: 'Bomber Jacket',
    priceINR: 1399,
    priceUSD: 17,
    originalPriceINR: 1799,
    originalPriceUSD: 22,
    category: 'jackets',
    images: {
      front: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
    },
    badge: 'sale',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'Navy', 'Olive'],
    description: 'Classic MA-1 bomber with ribbed cuffs and hem. Lightweight and versatile.',
    inStock: true,
  },
  {
    id: 'coach-jacket',
    slug: 'coach-jacket',
    name: 'Coach Jacket',
    priceINR: 1199,
    priceUSD: 15,
    category: 'jackets',
    images: {
      front: 'https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=800&q=80',
      back: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&q=80',
    },
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Navy'],
    description: 'Lightweight nylon coach jacket with snap buttons. Perfect for layering.',
    inStock: true,
  },
];

export const newArrivals = products.filter(p => p.badge === 'new');
export const bestSellers = products.slice(0, 4);
export const onSale = products.filter(p => p.badge === 'sale');

export const categories = [
  {
    name: 'Hoodies',
    slug: 'hoodies',
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
    count: products.filter(p => p.category === 'hoodies').length,
  },
  {
    name: 'Tees',
    slug: 'tees',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
    count: products.filter(p => p.category === 'tees').length,
  },
  {
    name: 'Jackets',
    slug: 'jackets',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=80',
    count: products.filter(p => p.category === 'jackets').length,
  },
  {
    name: 'Bottoms',
    slug: 'bottoms',
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80',
    count: products.filter(p => p.category === 'bottoms').length,
  },
];

export const heroImages = [
  {
    src: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1920&q=80',
    alt: 'Fashion editorial - model in urban setting',
  },
  {
    src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1920&q=80',
    alt: 'Fashion editorial - minimal style',
  },
  {
    src: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1920&q=80',
    alt: 'Fashion editorial - street style',
  },
  {
    src: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1920&q=80',
    alt: 'Fashion editorial - elegant pose',
  },
  {
    src: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1920&q=80',
    alt: 'Fashion editorial - urban landscape',
  },
];

export const lookbookImages = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800&q=80',
    title: 'FW25',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    title: 'Editorial',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80',
    title: 'Street',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80',
    title: 'Campaign',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&q=80',
    title: 'Urban',
  },
];

export const testimonials = [
  {
    id: 1,
    name: 'Marcus J.',
    location: 'Mumbai',
    text: 'Amazing quality at this price point. Feels premium.',
    rating: 5,
    product: 'Essential Hoodie',
  },
  {
    id: 2,
    name: 'Priya S.',
    location: 'Delhi',
    text: 'Finally found a brand that understands minimal luxury.',
    rating: 5,
    product: 'Classic Essential Tee',
  },
  {
    id: 3,
    name: 'Arjun K.',
    location: 'Bangalore',
    text: 'The fit is perfect. These are pieces I will wear for years.',
    rating: 5,
    product: 'Slim Straight Jeans',
  },
  {
    id: 4,
    name: 'Ananya R.',
    location: 'Hyderabad',
    text: 'Understated elegance. This is what fashion should be.',
    rating: 5,
    product: 'Minimal Hoodie',
  },
  {
    id: 5,
    name: 'Vikram T.',
    location: 'Pune',
    text: 'Best hoodie I have ever owned. Super comfortable.',
    rating: 5,
    product: 'Oversized Pullover',
  },
];
