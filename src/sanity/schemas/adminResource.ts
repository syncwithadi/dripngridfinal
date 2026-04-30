export const adminResourceSchema = {
  name: 'adminResource',
  title: 'Admin Resource',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (R: any) => R.required() },
    { name: 'description', title: 'Description', type: 'text' },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: { list: [
        { title: 'Guide', value: 'guide' },
        { title: 'Policy', value: 'policy' },
        { title: 'Template', value: 'template' },
        { title: 'SOP', value: 'sop' },
        { title: 'Other', value: 'other' },
      ] },
      initialValue: 'guide',
    },
    { name: 'fileUrl', title: 'File URL', type: 'url' },
    { name: 'fileName', title: 'File Name', type: 'string' },
    { name: 'fileSize', title: 'File Size (bytes)', type: 'number' },
    { name: 'externalLink', title: 'External Link (optional)', type: 'url' },
    { name: 'uploadedBy', title: 'Uploaded By (employeeId)', type: 'string' },
    { name: 'uploadedByName', title: 'Uploaded By (name)', type: 'string' },
    { name: 'visibleTo', title: 'Visible To', type: 'string', options: { list: [
      { title: 'Everyone', value: 'all' },
      { title: 'Admin + Super Admin', value: 'admin' },
      { title: 'Super Admin Only', value: 'super_admin' },
    ] }, initialValue: 'all' },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
  ],
  preview: {
    select: { title: 'title', category: 'category', uploadedByName: 'uploadedByName' },
    prepare({ title, category, uploadedByName }: any) {
      const icons: Record<string,string> = { guide: '📖', policy: '📋', template: '📄', sop: '📑', other: '📎' };
      return { title: `${icons[category]||'📎'} ${title}`, subtitle: `${category} · ${uploadedByName||'—'}` };
    },
  },
};
