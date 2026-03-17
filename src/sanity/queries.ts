// GROQ Queries for Sanity

// Get all products
export const allProductsQuery = `*[_type == "product" && isHidden != true] | order(_createdAt desc) {
  _id,
  name,
  slug,
  priceINR,
  originalPriceINR,
  category->{
    _id,
    name,
    slug
  },
  images {
    front {
      asset-> {
        _id,
        url
      }
    },
    back {
      asset-> {
        _id,
        url
      }
    },
    left {
      asset-> {
        _id,
        url
      }
    },
    right {
      asset-> {
        _id,
        url
      }
    },
    detail {
      asset-> {
        _id,
        url
      }
    }
  },
  badge,
  sizes,
  colors,
  description,
  inStock
}`;

// Get product by slug
export const productBySlugQuery = `*[_type == "product" && slug.current == $slug][0] {
  _id,
  name,
  slug,
  priceINR,
  originalPriceINR,
  category->{
    _id,
    name,
    slug
  },
  images {
    front {
      asset-> {
        _id,
        url
      }
    },
    back {
      asset-> {
        _id,
        url
      }
    },
    left {
      asset-> {
        _id,
        url
      }
    },
    right {
      asset-> {
        _id,
        url
      }
    },
    detail {
      asset-> {
        _id,
        url
      }
    }
  },
  badge,
  sizes,
  colors,
  description,
  inStock
}`;

// Get new arrivals (products with 'new' badge)
export const newArrivalsQuery = `*[_type == "product" && badge == "new" && isHidden != true] | order(_createdAt desc)[0...8] {
  _id,
  name,
  slug,
  priceINR,
  originalPriceINR,
  category->{
    _id,
    name,
    slug
  },
  images {
    front {
      asset-> {
        _id,
        url
      }
    },
    back {
      asset-> {
        _id,
        url
      }
    },
    left {
      asset-> {
        _id,
        url
      }
    },
    right {
      asset-> {
        _id,
        url
      }
    },
    detail {
      asset-> {
        _id,
        url
      }
    }
  },
  badge,
  sizes,
  colors,
  description,
  inStock
}`;

// Get best sellers (first 4 products, can be customized)
export const bestSellersQuery = `*[_type == "product" && isHidden != true] | order(salesCount desc)[0...4] {
  _id,
  name,
  slug,
  priceINR,
  originalPriceINR,
  category->{
    _id,
    name,
    slug
  },
  images {
    front {
      asset-> {
        _id,
        url
      }
    },
    back {
      asset-> {
        _id,
        url
      }
    },
    left {
      asset-> {
        _id,
        url
      }
    },
    right {
      asset-> {
        _id,
        url
      }
    },
    detail {
      asset-> {
        _id,
        url
      }
    }
  },
  badge,
  sizes,
  colors,
  description,
  inStock
}`;

// Get all categories with product count
export const allCategoriesQuery = `*[_type == "category"] | order(order asc) {
  _id,
  name,
  slug,
  image,
  "count": count(*[_type == "product" && references(^._id)])
}`;

// Get products by category slug
export const productsByCategoryQuery = `*[_type == "product" && category->slug.current == $slug && isHidden != true] | order(_createdAt desc) {
  _id,
  name,
  slug,
  priceINR,
  originalPriceINR,
  category->{
    _id,
    name,
    slug
  },
  images {
    front {
      asset-> {
        _id,
        url
      }
    },
    back {
      asset-> {
        _id,
        url
      }
    },
    left {
      asset-> {
        _id,
        url
      }
    },
    right {
      asset-> {
        _id,
        url
      }
    },
    detail {
      asset-> {
        _id,
        url
      }
    }
  },
  badge,
  sizes,
  colors,
  description,
  inStock
}`;

// Get related products (same category, excluding current)
export const relatedProductsQuery = `*[_type == "product" && category->slug.current == $categorySlug && slug.current != $currentSlug && isHidden != true] | order(_createdAt desc)[0...4] {
  _id,
  name,
  slug,
  priceINR,
  originalPriceINR,
  category->{
    _id,
    name,
    slug
  },
  images {
    front {
      asset-> {
        _id,
        url
      }
    },
    back {
      asset-> {
        _id,
        url
      }
    },
  },
  badge,
  inStock
}`;

// Get hero images
export const heroImagesQuery = `*[_type == "siteSettings"][0].heroImages[] {
  "src": image.asset->url,
  alt
}`;

// Get lookbook images
export const lookbookQuery = `*[_type == "lookbook"] | order(order asc) {
  _id,
  title,
  "image": image.asset->url
}`;

// Get testimonials
export const testimonialsQuery = `*[_type == "testimonial"] | order(_createdAt desc) {
  _id,
  name,
  location,
  text,
  rating,
  product
}`;

// Get order by ID
export const orderByIdQuery = `*[_type == "order" && _id == $orderId][0] {
  _id,
  orderNumber,
  customer,
  items,
  subtotal,
  shipping,
  tax,
  total,
  currency,
  status,
  paymentStatus,
  paymentId,
  razorpayOrderId,
  shippingAddress,
  createdAt
}`;

// Get orders by customer email
export const ordersByEmailQuery = `*[_type == "order" && customer.email == $email] | order(createdAt desc) {
  _id,
  orderNumber,
  items,
  total,
  currency,
  status,
  paymentStatus,
  createdAt
}`;

// Get site settings (logo, name, etc.)
export const siteSettingsQuery = `*[_type == "siteSettings"][0] {
  siteName,
  tagline,
  "brandLogo": brandLogo.asset->url,
  logoWidth,
  contactEmail,
  contactPhone
}`;

// Get banner / homepage hero + showcase data
export const bannerQuery = `*[_type == "siteSettings"][0] {
  "bannerImage": bannerImage.asset->url,
  bannerHeading,
  bannerSubtitle,
  bannerButton1Text,
  bannerButton1Link,
  bannerButton2Text,
  bannerButton2Link,
  "showcaseImage": showcaseImage.asset->url,
  showcaseButtonText,
  showcaseButtonLink
}`;

// Get philosophy section data
export const philosophyQuery = `*[_type == "philosophySection"][0] {
  isActive,
  title,
  subtitle,
  description,
  "image": image.asset->url,
  stats
}`;

// Search products
export const searchQuery = `*[_type == "product" && isHidden != true && (name match $searchTerm + "*" || description match $searchTerm + "*")] | order(_createdAt desc) {
  _id,
  name,
  slug,
  priceINR,
  originalPriceINR,
  category->{
    _id,
    name,
    slug
  },
  images {
    front {
      asset-> {
        _id,
        url
      }
    },
    back {
      asset-> {
        _id,
        url
      }
    }
  },
  badge,
  inStock
}`;
// Get products by gender
export const productsByGenderQuery = `*[_type == "product" && isHidden != true && (gender == $gender || gender == "Unisex")] | order(_createdAt desc) {
  _id,
  name,
  slug,
  priceINR,
  originalPriceINR,
  category->{
    _id,
    name,
    slug
  },
  images {
    front {
      asset-> {
        _id,
        url
      }
    },
    back {
      asset-> {
        _id,
        url
      }
    },
    left {
      asset-> {
        _id,
        url
      }
    },
    right {
      asset-> {
        _id,
        url
      }
    },
    detail {
      asset-> {
        _id,
        url
      }
    }
  },
  badge,
  sizes,
  colors,
  description,
  inStock
}`;
