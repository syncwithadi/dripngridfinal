export const systemConfigSchema = {
  name: 'systemConfig',
  title: 'System Config',
  type: 'document',
  fields: [
    {
      name: 'key',
      title: 'Key',
      type: 'string',
      description: 'Singleton key — always "main"',
      initialValue: 'main',
      readOnly: true,
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'visibleFrom',
      title: 'Data Visible From',
      type: 'datetime',
      description:
        'Admin and Employee roles can only see orders / customers / data created ON OR AFTER this timestamp. Super Admin always sees everything.',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
    },
    {
      name: 'updatedBy',
      title: 'Updated By',
      type: 'string',
      description: 'Employee ID of the Super Admin who last changed this',
    },
  ],
  preview: {
    select: { visibleFrom: 'visibleFrom', updatedBy: 'updatedBy' },
    prepare({ visibleFrom, updatedBy }: any) {
      return {
        title: 'System Config',
        subtitle: `Visible from: ${visibleFrom ? new Date(visibleFrom).toLocaleString('en-IN') : 'All time'} · by ${updatedBy || '—'}`,
      };
    },
  },
};
