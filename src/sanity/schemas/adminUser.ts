export const adminUserSchema = {
  name: 'adminUser',
  title: 'Admin User',
  type: 'document',
  fields: [
    {
      name: 'employeeId',
      title: 'Employee ID',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule: any) => Rule.required().email(),
    },
    {
      name: 'profileImage',
      title: 'Profile Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'passwordHash',
      title: 'Password Hash',
      type: 'string',
      hidden: true,
    },
    {
      name: 'role',
      title: 'Role',
      type: 'string',
      options: {
        list: [
          { title: 'Super Admin', value: 'super_admin' },
          { title: 'Admin', value: 'admin' },
          { title: 'Employee', value: 'employee' },
        ],
        layout: 'radio',
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'active',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'mustChangePassword',
      title: 'Must Change Password on Next Login',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'lastLogin',
      title: 'Last Login',
      type: 'datetime',
    },
    {
      name: 'lastActivityAt',
      title: 'Last Activity At',
      type: 'datetime',
      description: 'Updated by heartbeat — drives real-time online/idle/offline status',
    },
    {
      name: 'isCurrentlyIdle',
      title: 'Currently Idle',
      type: 'boolean',
      description: 'True when user has been inactive for 5+ minutes',
      initialValue: false,
    },
    {
      name: 'sessionVersion',
      title: 'Session Version',
      type: 'number',
      description: 'Incremented on force logout — old JWTs with lower sv are rejected',
      initialValue: 1,
      hidden: true,
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'employeeId',
      role: 'role',
      active: 'active',
    },
    prepare({ title, subtitle, role, active }: any) {
      return {
        title: `${active ? '🟢' : '🔴'} ${title}`,
        subtitle: `${subtitle} · ${role}`,
      };
    },
  },
};
