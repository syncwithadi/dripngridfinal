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
      name: 'department',
      title: 'Department',
      type: 'string',
      description: 'e.g. Operations, Marketing, Customer Support',
    },
    {
      name: 'internalTitle',
      title: 'Internal Job Title',
      type: 'string',
      description: 'e.g. Senior Product Manager, Logistics Lead',
    },
    {
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
      description: 'Internal contact number',
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
    // ── Session Intelligence ───────────────────────────────────────────────
    {
      name: 'lastLoginIP',
      title: 'Last Login IP',
      type: 'string',
      description: 'IP address captured on last successful login',
      hidden: true,
    },
    // ── Future-Safe: Granular Permissions (schema-only, not enforced yet) ──
    {
      name: 'permissions',
      title: 'Custom Permissions',
      type: 'object',
      description: 'Reserved for future fine-grained RBAC — do not modify without full RBAC review',
      hidden: true,
      fields: [
        { name: 'canManageProducts',    type: 'boolean', title: 'Can Manage Products',    initialValue: false },
        { name: 'canManageOrders',      type: 'boolean', title: 'Can Manage Orders',      initialValue: false },
        { name: 'canViewFinancials',    type: 'boolean', title: 'Can View Financials',    initialValue: false },
        { name: 'canManageStaff',       type: 'boolean', title: 'Can Manage Staff',       initialValue: false },
        { name: 'canBulkExport',        type: 'boolean', title: 'Can Bulk Export',        initialValue: false },
      ],
    },
    // ── Future-Safe: Activity Timeline (schema-only, not rendered yet) ─────
    {
      name: 'activityLog',
      title: 'Activity Log',
      type: 'array',
      description: 'Reserved for future per-user activity timeline',
      hidden: true,
      of: [
        {
          type: 'object',
          fields: [
            { name: 'action',    type: 'string',   title: 'Action' },
            { name: 'details',   type: 'string',   title: 'Details' },
            { name: 'timestamp', type: 'datetime', title: 'Timestamp' },
          ],
        },
      ],
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
