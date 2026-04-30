import { sanityClient } from '@/sanity/client';

export async function getSiteSettings() {
  return await sanityClient.fetch(
    `*[_type == "siteSettings"][0]{ isLive, closedMessage }`,
    {},
    { cache: 'no-store' }
  );
}
