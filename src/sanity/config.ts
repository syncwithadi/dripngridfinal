// Sanity Configuration
// Replace these with your actual Sanity project credentials

export const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'm4jaxdfe',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production', // use CDN in production for performance
  // Token for mutations (server-side only)
  token: process.env.SANITY_API_TOKEN,
};
