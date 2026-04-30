// Site Settings Schema for Sanity Studio

export const siteSettingsSchema = {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    {
      name: 'isLive',
      title: 'Site Live',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off to enable maintenance mode (Closed Page)',
    },
    {
      name: 'closedMessage',
      title: 'Closed Message',
      type: 'string',
      initialValue: 'DRIPNGRID is closed for now. We’ll be back soon.',
      hidden: ({ document }: any) => document?.isLive === true,
    },
    {
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      initialValue: 'DRIPNGRID',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      initialValue: 'Timeless Essentials',
    },
    {
      name: 'brandLogo',
      title: 'Brand Logo',
      type: 'image',
      options: { hotspot: true },
      description: 'Upload your brand logo. If not set, Site Name text will be used.',
    },
    {
      name: 'logoWidth',
      title: 'Logo Width (px)',
      type: 'number',
      initialValue: 120,
      description: 'Adjust logo width (height will scale automatically)',
    },
    {
      name: 'heroImages',
      title: 'Hero Carousel Images',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
            },
            { name: 'alt', title: 'Alt Text', type: 'string' },
          ],
        },
      ],
    },
    // ── Banner / Homepage Hero ───────────────────────────────────────
    {
      name: 'bannerImage',
      title: 'Banner Background Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Full-screen hero banner image shown on the homepage',
    },
    {
      name: 'bannerHeading',
      title: 'Banner Heading',
      type: 'string',
      description: 'Main heading text on the banner (optional overlay text)',
    },
    {
      name: 'bannerSubtitle',
      title: 'Banner Subtitle',
      type: 'string',
      description: 'Subtitle or tagline shown below the heading',
    },
    {
      name: 'bannerButton1Text',
      title: 'Banner Button 1 – Label',
      type: 'string',
      initialValue: 'Shop Men',
    },
    {
      name: 'bannerButton1Link',
      title: 'Banner Button 1 – Link',
      type: 'string',
      initialValue: '/men',
    },
    {
      name: 'bannerButton2Text',
      title: 'Banner Button 2 – Label',
      type: 'string',
      initialValue: 'Shop Women',
    },
    {
      name: 'bannerButton2Link',
      title: 'Banner Button 2 – Link',
      type: 'string',
      initialValue: '/women',
    },
    // ── Visual Showcase (mid-page "View Collection" section) ─────────
    {
      name: 'showcaseImage',
      title: 'Showcase Background Image',
      type: 'image',
      options: { hotspot: true },
      description: 'Background image for the "View Collection" section that appears after Best Sellers',
    },
    {
      name: 'showcaseButtonText',
      title: 'Showcase Button Label',
      type: 'string',
      initialValue: 'View Collection',
    },
    {
      name: 'showcaseButtonLink',
      title: 'Showcase Button Link',
      type: 'string',
      initialValue: '/shop',
    },
    {
      name: 'freeShippingThresholdINR',
      title: 'Free Shipping Threshold (INR)',
      type: 'number',
      initialValue: 5000,
    },
    {
      name: 'freeShippingThresholdUSD',
      title: 'Free Shipping Threshold (USD)',
      type: 'number',
      initialValue: 60,
    },
    {
      name: 'shippingCostINR',
      title: 'Standard Shipping Cost (INR)',
      type: 'number',
      initialValue: 99,
    },
    {
      name: 'shippingCostUSD',
      title: 'Standard Shipping Cost (USD)',
      type: 'number',
      initialValue: 5,
    },
    {
      name: 'taxPercentage',
      title: 'Tax Percentage',
      type: 'number',
      initialValue: 18,
      description: 'GST percentage for India',
    },
    {
      name: 'socialLinks',
      title: 'Social Media Links',
      type: 'object',
      fields: [
        { name: 'instagram', title: 'Instagram', type: 'url' },
        { name: 'twitter', title: 'Twitter/X', type: 'url' },
        { name: 'facebook', title: 'Facebook', type: 'url' },
        { name: 'pinterest', title: 'Pinterest', type: 'url' },
      ],
    },
    {
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
    },
    {
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
    },
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings',
      };
    },
  },
};

export default siteSettingsSchema;
