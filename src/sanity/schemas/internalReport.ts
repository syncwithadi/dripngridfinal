export const internalReportSchema = {
  name: 'internalReport',
  title: 'Internal Report',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (R: any) => R.required() },
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: { list: [
        { title: 'Issue', value: 'issue' },
        { title: 'Suggestion', value: 'suggestion' },
        { title: 'Request', value: 'request' },
      ] },
      initialValue: 'issue',
    },
    { name: 'description', title: 'Description', type: 'text', validation: (R: any) => R.required() },
    {
      name: 'priority',
      title: 'Priority',
      type: 'string',
      options: { list: [
        { title: 'Low', value: 'low' },
        { title: 'Medium', value: 'medium' },
        { title: 'High', value: 'high' },
        { title: 'Urgent', value: 'urgent' },
      ] },
      initialValue: 'medium',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: [
        { title: 'Open', value: 'open' },
        { title: 'In Progress', value: 'in_progress' },
        { title: 'Resolved', value: 'resolved' },
      ] },
      initialValue: 'open',
    },
    { name: 'submittedBy', title: 'Submitted By (employeeId)', type: 'string' },
    { name: 'submittedByName', title: 'Submitted By (name)', type: 'string' },
    { name: 'resolvedBy', title: 'Resolved By (employeeId)', type: 'string' },
    { name: 'resolvedByName', title: 'Resolved By (name)', type: 'string' },
    { name: 'responseNote', title: 'Admin Response', type: 'text' },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
    { name: 'resolvedAt', title: 'Resolved At', type: 'datetime' },
  ],
  preview: {
    select: { title: 'title', type: 'type', status: 'status', priority: 'priority' },
    prepare({ title, type, status, priority }: any) {
      const icons: Record<string,string> = { issue: '🐛', suggestion: '💡', request: '📩' };
      return { title: `${icons[type]||'📩'} ${title}`, subtitle: `${priority} · ${status}` };
    },
  },
};
