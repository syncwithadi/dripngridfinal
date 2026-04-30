export const adminTaskSchema = {
  name: 'adminTask',
  title: 'Admin Task',
  type: 'document',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (R: any) => R.required() },
    { name: 'description', title: 'Description', type: 'text' },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: { list: [
        { title: 'To Do', value: 'todo' },
        { title: 'In Progress', value: 'in_progress' },
        { title: 'Done', value: 'done' },
      ], layout: 'radio' },
      initialValue: 'todo',
    },
    {
      name: 'priority',
      title: 'Priority',
      type: 'string',
      options: { list: [
        { title: 'Low', value: 'low' },
        { title: 'Medium', value: 'medium' },
        { title: 'High', value: 'high' },
      ] },
      initialValue: 'medium',
    },
    { name: 'assignedTo', title: 'Assigned To (employeeId)', type: 'string' },
    { name: 'assignedToName', title: 'Assigned To (name)', type: 'string' },
    { name: 'assignedBy', title: 'Assigned By (employeeId)', type: 'string' },
    { name: 'assignedByName', title: 'Assigned By (name)', type: 'string' },
    { name: 'deadline', title: 'Deadline', type: 'datetime' },
    { name: 'completedAt', title: 'Completed At', type: 'datetime' },
    { name: 'linkedEntity', title: 'Linked To (type)', type: 'string' },
    { name: 'linkedEntityId', title: 'Linked ID', type: 'string' },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
  ],
  preview: {
    select: { title: 'title', status: 'status', assignedToName: 'assignedToName', priority: 'priority' },
    prepare({ title, status, assignedToName, priority }: any) {
      const s: Record<string,string> = { todo: '⬜', in_progress: '🔵', done: '✅' };
      return { title: `${s[status]||'⬜'} ${title}`, subtitle: `${priority || 'medium'} · ${assignedToName || 'Unassigned'}` };
    },
  },
};
