import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { sanityConfig } from './config';

// Create a client for fetching data (read-only)
export const sanityClient = createClient({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  apiVersion: sanityConfig.apiVersion,
  useCdn: sanityConfig.useCdn,
});

// Create a client for mutations (with token, server-side only)
export const sanityWriteClient = createClient({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  apiVersion: sanityConfig.apiVersion,
  useCdn: false,
  token: sanityConfig.token,
});

// Image URL builder
const builder = createImageUrlBuilder({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
});

// Export only clients and types here, use src/sanity/image.ts for urlFor


// Type for Sanity image reference
export interface SanityImageSource {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
}
