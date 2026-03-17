import { createImageUrlBuilder } from '@sanity/image-url';
import { sanityConfig } from '@/sanity/config';

const builder = createImageUrlBuilder({
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
});

export const urlFor = (source: any) => {
  if (!source) return undefined;

  // If it's already a string (static data)
  if (typeof source === 'string') {
    return {
      width: () => ({
        url: () => source
      }),
      url: () => source
    };
  }

  // If we have a direct URL from the query (asset->url)
  if (source.asset?.url) {
    const url = source.asset.url;
    return {
      // Create a mock builder chain since we already have the URL
      width: () => ({
        url: () => url
      }),
      url: () => url
    };
  }

  // If it's a Sanity image object (legacy/standard ref)
  return builder.image(source);
};
