export const productRequestSchema = {
  name: 'productRequest',
  title: 'Product Request',
  type: 'document',
  fields: [
    { name: 'title', title: 'Product Title', type: 'string', validation: (R: any) => R.required() },
    { name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' } },
    { name: 'description', title: 'Description', type: 'text' },
    { name: 'category', title: 'Category', type: 'string' },
    { name: 'price', title: 'Price (₹)', type: 'number' },
    { name: 'comparePrice', title: 'Compare Price (₹)', type: 'number' },
    { name: 'sizes', title: 'Available Sizes', type: 'array', of: [{ type: 'string' }] },
    { name: 'colors', title: 'Colors', type: 'array', of: [{ type: 'string' }] },
    { name: 'images', title: 'Product Images', type: 'array', of: [{ type: 'image' }] },
    { name: 'tags', title: 'Tags', type: 'array', of: [{ type: 'string' }] },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: [
        { title: 'Draft', value: 'draft' },
        { title: 'Pending Review', value: 'pending' },
        { title: 'Approved', value: 'approved' },
        { title: 'Rejected', value: 'rejected' },
      ], layout: 'radio' },
      initialValue: 'draft',
    },
    { name: 'submittedBy', title: 'Submitted By (employeeId)', type: 'string' },
    { name: 'submittedByName', title: 'Submitted By (name)', type: 'string' },
    { name: 'submittedAt', title: 'Submitted At', type: 'datetime' },
    { name: 'reviewedBy', title: 'Reviewed By (employeeId)', type: 'string' },
    { name: 'reviewedAt', title: 'Reviewed At', type: 'datetime' },
    { name: 'reviewNote', title: 'Review Note / Rejection Reason', type: 'text' },
    { name: 'internalNotes', title: 'Internal Notes', type: 'text' },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
  ],
  preview: {
    select: { title: 'title', status: 'status', submittedByName: 'submittedByName' },
    prepare({ title, status, submittedByName }: any) {
      const icons: Record<string, string> = { draft: '📝', pending: '⏳', approved: '✅', rejected: '❌' };
      return { title: `${icons[status] || '📝'} ${title}`, subtitle: `${status} · by ${submittedByName || '—'}` };
    },
  },
};
