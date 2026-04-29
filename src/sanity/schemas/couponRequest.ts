export const couponRequestSchema = {
  name: 'couponRequest',
  title: 'Coupon Request',
  type: 'document',
  fields: [
    {
      name: 'requestedByEmployeeId',
      title: 'Requested By (Employee ID)',
      type: 'string',
    },
    {
      name: 'requestedByName',
      title: 'Requested By (Name)',
      type: 'string',
    },
    {
      name: 'couponData',
      title: 'Coupon Data',
      type: 'object',
      fields: [
        { name: 'code', title: 'Code', type: 'string' },
        { name: 'type', title: 'Type', type: 'string' },
        { name: 'value', title: 'Value', type: 'number' },
        { name: 'maxDiscount', title: 'Max Discount', type: 'number' },
        { name: 'minOrder', title: 'Min Order', type: 'number' },
        { name: 'maxUses', title: 'Max Uses', type: 'number' },
        { name: 'maxUsesPerUser', title: 'Max Uses Per User', type: 'number' },
        { name: 'expiresAt', title: 'Expires At', type: 'datetime' },
        { name: 'description', title: 'Description', type: 'string' },
        { name: 'isPublic', title: 'Is Public', type: 'boolean' },
      ],
    },
    {
      name: 'reason',
      title: 'Reason for Request',
      type: 'text',
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'OTP Sent', value: 'otp_sent' },
          { title: 'Approved', value: 'approved' },
          { title: 'Rejected', value: 'rejected' },
        ],
        layout: 'radio',
      },
      initialValue: 'pending',
    },
    {
      name: 'otpHash',
      title: 'OTP Hash',
      type: 'string',
      hidden: true,
    },
    {
      name: 'otpExpiry',
      title: 'OTP Expiry',
      type: 'datetime',
      hidden: true,
    },
    {
      name: 'otpAttempts',
      title: 'OTP Attempts',
      type: 'number',
      initialValue: 0,
      hidden: true,
    },
    {
      name: 'resolvedByEmployeeId',
      title: 'Resolved By (Employee ID)',
      type: 'string',
    },
    {
      name: 'resolvedByName',
      title: 'Resolved By (Name)',
      type: 'string',
    },
    {
      name: 'rejectionReason',
      title: 'Rejection Reason',
      type: 'text',
    },
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
    },
    {
      name: 'resolvedAt',
      title: 'Resolved At',
      type: 'datetime',
    },
    {
      name: 'createdCouponId',
      title: 'Created Coupon ID (Sanity)',
      type: 'string',
    },
  ],
  preview: {
    select: {
      code: 'couponData.code',
      status: 'status',
      requestedByName: 'requestedByName',
      createdAt: 'createdAt',
    },
    prepare({ code, status, requestedByName, createdAt }: any) {
      const icons: Record<string, string> = {
        pending: '🟡',
        otp_sent: '📧',
        approved: '🟢',
        rejected: '🔴',
      };
      const date = createdAt ? new Date(createdAt).toLocaleDateString('en-IN') : '—';
      return {
        title: `${icons[status] || '⚪'} ${code || 'Unnamed'} · ${status?.toUpperCase()}`,
        subtitle: `By ${requestedByName || '—'} · ${date}`,
      };
    },
  },
  orderings: [
    {
      title: 'Newest First',
      name: 'newestFirst',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
  ],
};
