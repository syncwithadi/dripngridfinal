import { createClient } from '@sanity/client';
import { products } from '../src/data/products';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Config
const projectId = 'm4jaxdfe';
const dataset = 'production';
const token = process.env.SANITY_API_TOKEN;

if (!token) {
  console.error('Error: SANITY_API_TOKEN is not set in environment variables');
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
});

async function uploadImage(imagePath: string) {
  try {
    let buffer: Buffer;
    let filename: string;

    // Handle remote URL
    if (imagePath.startsWith('http')) {
      console.log(`Downloading image: ${imagePath}`);
      const res = await fetch(imagePath);
      if (!res.ok) throw new Error(`Failed to fetch ${imagePath}`);
      const arrayBuffer = await res.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      filename = path.basename(imagePath.split('?')[0]); // Remove query params
    } else {
      // Handle local file
      const fullPath = path.join(process.cwd(), 'public', imagePath);
      if (!fs.existsSync(fullPath)) {
        console.warn(`Warning: Image not found at ${fullPath}`);
        return null;
      }
      buffer = fs.readFileSync(fullPath);
      filename = path.basename(imagePath);
    }

    const asset = await client.assets.upload('image', buffer, {
      filename: filename,
    });
    return asset;
  } catch (error) {
    console.error(`Error uploading image ${imagePath}:`, error);
    return null;
  }
}

async function migrate() {
  console.log(`Starting migration of ${products.length} products...`);
  
  // 1. Create Categories first
  const categories = [...new Set(products.map(p => p.category))];
  const categoryMap = new Map();
  
  console.log(`Creating ${categories.length} categories...`);
  
  for (const catName of categories) {
    // Check if category exists
    const existing = await client.fetch(`*[_type == "category" && slug.current == $slug][0]`, {
      slug: catName
    });
    
    if (existing) {
      categoryMap.set(catName, existing._id);
    } else {
      const doc = {
        _type: 'category',
        name: catName.charAt(0).toUpperCase() + catName.slice(1),
        slug: { _type: 'slug', current: catName },
      };
      const created = await client.create(doc);
      categoryMap.set(catName, created._id);
      console.log(`Created category: ${catName}`);
    }
  }

  // 2. Create Products
  for (const product of products) {
    console.log(`Processing: ${product.name}`);
    
    // Check if product exists first
    const existing = await client.fetch(`*[_type == "product" && slug.current == $slug][0]`, {
      slug: product.slug
    });

    // Upload images if they don't exist in Sanity or we want to force update
    // Only upload if we are creating new or updating (skip if you want to save bandwidth, but here we fix missing images)
    const imageAssets: any = {};
    
    if (product.images.front) {
      const asset = await uploadImage(product.images.front);
      if (asset) imageAssets.front = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
    }
    if (product.images.back) {
      const asset = await uploadImage(product.images.back);
      if (asset) imageAssets.back = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
    }
    if (product.images.detail) {
      const asset = await uploadImage(product.images.detail);
      if (asset) imageAssets.detail = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } };
    }
    
    const doc = {
      _type: 'product',
      name: product.name,
      slug: { _type: 'slug', current: product.slug },
      priceINR: product.priceINR,
      category: {
        _type: 'reference',
        _ref: categoryMap.get(product.category),
      },
      images: imageAssets,
      sizes: product.sizes,
      colors: product.colors,
      description: product.description,
      inStock: product.inStock,
      badge: product.badge,
    };
    
    if (existing) {
      console.log(`Updating existing product: ${product.name}`);
      // Patch the existing product with new images and data
      await client.patch(existing._id).set(doc).commit();
    } else {
      await client.create(doc);
      console.log(`Created product: ${product.name}`);
    }
  }
  
  console.log('Migration complete!');
}

migrate().catch(console.error);
