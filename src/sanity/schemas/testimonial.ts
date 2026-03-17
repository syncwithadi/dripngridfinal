// Testimonial Schema for Sanity Studio

export const testimonialSchema = {
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Customer Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'location',
      title: 'Location',
      type: 'string',
    },
    {
      name: 'text',
      title: 'Testimonial Text',
      type: 'text',
      rows: 3,
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (Rule: any) => Rule.required().min(1).max(5),
      initialValue: 5,
    },
    {
      name: 'product',
      title: 'Product Name',
      type: 'string',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'text',
    },
  },
};

export default testimonialSchema;
