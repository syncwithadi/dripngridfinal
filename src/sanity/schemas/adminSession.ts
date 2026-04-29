export const adminSessionSchema = {
  name: 'adminSession',
  title: 'Admin Session',
  type: 'document',
  fields: [
    {
      name: 'sessionToken',
      title: 'Session Token',
      type: 'string',
      description: 'Unique identifier for this session (sub + loginTime hash)',
    },
    {
      name: 'adminUserId',
      title: 'Admin User ID',
      type: 'string',
      description: 'Sanity _id of the adminUser document',
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
      name: 'loginTime',
      title: 'Login Time',
      type: 'datetime',
    },
    {
      name: 'logoutTime',
      title: 'Logout Time',
      type: 'datetime',
    },
    {
      name: 'lastActivityAt',
      title: 'Last Activity At',
      type: 'datetime',
    },
    {
      name: 'totalActiveSeconds',
      title: 'Total Active Seconds',
      type: 'number',
      initialValue: 0,
    },
    {
      name: 'totalIdleSeconds',
      title: 'Total Idle Seconds',
      type: 'number',
      initialValue: 0,
    },
    {
      name: 'ipAddress',
      title: 'IP Address',
      type: 'string',
    },
  ],
  preview: {
    select: {
      employeeName: 'employeeName',
      employeeId: 'employeeId',
      loginTime: 'loginTime',
      logoutTime: 'logoutTime',
    },
    prepare({ employeeName, employeeId, loginTime, logoutTime }: any) {
      const status = logoutTime ? '🔴 Logged out' : '🟢 Active';
      const login = loginTime ? new Date(loginTime).toLocaleString('en-IN') : '—';
      return {
        title: `${employeeName || '—'} (${employeeId || '—'})`,
        subtitle: `${status} · Login: ${login}`,
      };
    },
  },
  orderings: [
    {
      title: 'Newest First',
      name: 'newestFirst',
      by: [{ field: 'loginTime', direction: 'desc' }],
    },
  ],
};
