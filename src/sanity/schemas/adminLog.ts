export const adminLogSchema = {
  name: 'adminLog',
  title: 'Admin Log',
  type: 'document',
  fields: [
    {
      name: 'timestamp',
      title: 'Timestamp',
      type: 'datetime',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'employeeId',
      title: 'Employee ID',
      type: 'string',
    },
    {
      name: 'employeeName',
      title: 'Employee Name',
      type: 'string',
    },
    {
      name: 'role',
      title: 'Role',
      type: 'string',
    },
    {
      name: 'action',
      title: 'Action',
      type: 'string',
      options: {
        list: [
          { title: 'Login', value: 'LOGIN' },
          { title: 'Logout', value: 'LOGOUT' },
          { title: 'Order Update', value: 'ORDER_UPDATE' },
          { title: 'Coupon Request', value: 'COUPON_REQUEST' },
          { title: 'Coupon Approve', value: 'COUPON_APPROVE' },
          { title: 'Coupon Reject', value: 'COUPON_REJECT' },
          { title: 'Coupon Create', value: 'COUPON_CREATE' },
          { title: 'Inventory Update', value: 'INVENTORY_UPDATE' },
          { title: 'User Create', value: 'USER_CREATE' },
          { title: 'User Update', value: 'USER_UPDATE' },
          { title: 'User Disable', value: 'USER_DISABLE' },
          { title: 'Password Change', value: 'PASSWORD_CHANGE' },
          { title: 'Settings Update', value: 'SETTINGS_UPDATE' },
          { title: 'OTP Send', value: 'OTP_SEND' },
          { title: 'OTP Verify', value: 'OTP_VERIFY' },
          { title: 'OTP Fail', value: 'OTP_FAIL' },
        ],
      },
    },
    {
      name: 'entity',
      title: 'Entity Type',
      type: 'string',
    },
    {
      name: 'entityId',
      title: 'Entity ID',
      type: 'string',
    },
    {
      name: 'details',
      title: 'Details',
      type: 'text',
    },
    {
      name: 'ip',
      title: 'IP Address',
      type: 'string',
    },
  ],
  preview: {
    select: {
      timestamp: 'timestamp',
      employeeName: 'employeeName',
      action: 'action',
      entity: 'entity',
    },
    prepare({ timestamp, employeeName, action, entity }: any) {
      const date = timestamp ? new Date(timestamp).toLocaleString('en-IN') : '—';
      return {
        title: `${action} · ${employeeName || 'Unknown'}`,
        subtitle: `${date}${entity ? ` · ${entity}` : ''}`,
      };
    },
  },
  orderings: [
    {
      title: 'Newest First',
      name: 'newestFirst',
      by: [{ field: 'timestamp', direction: 'desc' }],
    },
  ],
};
