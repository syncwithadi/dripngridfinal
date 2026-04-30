export const adminMailSchema = {
  name: 'adminMail',
  title: 'Internal Mail Log',
  type: 'document',
  fields: [
    { name: 'subject',     title: 'Subject',         type: 'string' },
    { name: 'to',          title: 'To (Email)',       type: 'string' },
    { name: 'toName',      title: 'To (Name)',        type: 'string' },
    { name: 'from',        title: 'From (Email)',     type: 'string' },
    { name: 'fromName',    title: 'From (Name)',      type: 'string' },
    { name: 'body',        title: 'Body',             type: 'text' },
    { name: 'sentAt',      title: 'Sent At',          type: 'datetime' },
    { name: 'status',      title: 'Status',           type: 'string', options: { list: ['sent', 'failed', 'pending'] } },
    { name: 'sentBy',      title: 'Sent By (ID)',     type: 'string' },
    { name: 'sentByName',  title: 'Sent By (Name)',   type: 'string' },
  ],
  preview: {
    select: { title: 'subject', subtitle: 'toName' },
    prepare({ title, subtitle }: any) {
      return { title: `✉ ${title}`, subtitle: `→ ${subtitle}` };
    },
  },
};
