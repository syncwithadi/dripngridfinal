export const adminNotificationSchema = {
  name: 'adminNotification',
  title: 'Admin Notification',
  type: 'document',
  fields: [
    { name: 'recipientId', title: 'Recipient (employeeId)', type: 'string', validation: (R: any) => R.required() },
    { name: 'type', title: 'Type', type: 'string' },
    { name: 'title', title: 'Title', type: 'string' },
    { name: 'message', title: 'Message', type: 'text' },
    { name: 'link', title: 'Link (path)', type: 'string' },
    { name: 'read', title: 'Read', type: 'boolean', initialValue: false },
    { name: 'createdAt', title: 'Created At', type: 'datetime' },
  ],
  preview: {
    select: { title: 'title', recipientId: 'recipientId', read: 'read' },
    prepare({ title, recipientId, read }: any) {
      return { title: `${read ? '✓' : '🔔'} ${title}`, subtitle: `to: ${recipientId}` };
    },
  },
};
