// Product Schema for Sanity Studio
// This file defines the structure for products in Sanity CMS

export const productSchema = {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Product Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'priceINR',
      title: 'Price (INR)',
      type: 'number',
      validation: (Rule: any) => Rule.required().positive(),
    },
    {
      name: 'originalPriceINR',
      title: 'Original Price (INR) - for sales',
      type: 'number',
    },
    {
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'category' }],
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'gender',
      title: 'Gender',
      type: 'string',
      options: {
        list: [
          { title: 'Men', value: 'Men' },
          { title: 'Women', value: 'Women' },
          { title: 'Unisex', value: 'Unisex' },
        ],
        layout: 'radio',
      },
      initialValue: 'Unisex',
    },
    {
      name: 'images',
      title: 'Product Images',
      type: 'object',
      fields: [
        {
          name: 'front',
          title: 'Front View',
          type: 'image',
          options: { hotspot: true },
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'back',
          title: 'Back View',
          type: 'image',
          options: { hotspot: true },
          validation: (Rule: any) => Rule.required(),
        },
        {
          name: 'left',
          title: 'Left View',
          type: 'image',
          options: { hotspot: true },
        },
        {
          name: 'right',
          title: 'Right View',
          type: 'image',
          options: { hotspot: true },
        },
        {
          name: 'detail',
          title: 'Detail Shot',
          type: 'image',
          options: { hotspot: true },
        },
      ],
    },
    {
      name: 'badge',
      title: 'Badge',
      type: 'string',
      options: {
        list: [
          { title: 'New', value: 'new' },
          { title: 'Sale', value: 'sale' },
          { title: 'Sold Out', value: 'sold-out' },
        ],
      },
    },
    {
      name: 'sizes',
      title: 'Available Sizes',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    },
    {
      name: 'colors',
      title: 'Available Colors',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags',
      },
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'inStock',
      title: 'In Stock',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'isHidden',
      title: 'Hide from Website',
      type: 'boolean',
      initialValue: false,
      description: 'Toggle ON to hide this product from the storefront without deleting it.',
    },
    {
      name: 'salesCount',
      title: 'Sales Count',
      type: 'number',
      initialValue: 0,
      description: 'Used for sorting best sellers',
    },
    {
      name: 'material',
      title: 'Material & Care',
      type: 'text',
      rows: 3,
      description: 'e.g. 100% Cotton, Machine wash cold',
    },
    {
      name: 'sizeGuide',
      title: 'Size Guide',
      type: 'image',
      options: { hotspot: true },
      description: 'Upload a size chart image for this product',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category.name',
      media: 'images.front',
    },
  },
};

export default productSchema;
