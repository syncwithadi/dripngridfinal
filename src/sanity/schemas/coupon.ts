// Coupon schema for DRIPNGRID — manages discount codes, usage tracking, and analytics

export const couponSchema = {
  name: 'coupon',
  title: 'Coupon',
  type: 'document',
  groups: [
    { name: 'details',  title: '🎟️ Coupon Details', default: true },
    { name: 'rules',    title: '📋 Rules & Limits'  },
    { name: 'stats',    title: '📊 Usage Stats'     },
  ],
  fields: [
    // ─── DETAILS ──────────────────────────────────────────────────────────────
    {
      name: 'code',
      title: 'Coupon Code',
      type: 'string',
      group: 'details',
      description: 'Uppercase, no spaces. E.g. WELCOME20',
      validation: (Rule: any) => Rule.required().uppercase().min(3).max(30),
    },
    {
      name: 'description',
      title: 'Customer-Facing Description',
      type: 'string',
      group: 'details',
      description: 'Shown to customers. E.g. "20% off on orders above ₹999"',
    },
    {
      name: 'type',
      title: 'Discount Type',
      type: 'string',
      group: 'details',
      options: {
        list: [
          { title: 'Percentage Off (%)',   value: 'percent' },
          { title: 'Fixed Amount Off (₹)', value: 'fixed'   },
        ],
        layout: 'radio',
      },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'value',
      title: 'Discount Value',
      type: 'number',
      group: 'details',
      description: 'Enter 20 for 20% off, or 200 for ₹200 off',
      validation: (Rule: any) => Rule.required().positive(),
    },
    {
      name: 'maxDiscount',
      title: 'Maximum Discount Cap (₹)',
      type: 'number',
      group: 'details',
      description: 'For % coupons only: cap the max discount. E.g. 20% off but max ₹500. Leave empty for no cap.',
    },
    {
      name: 'active',
      title: 'Active',
      type: 'boolean',
      group: 'details',
      description: 'Toggle off to instantly deactivate this coupon',
      initialValue: true,
    },
    {
      name: 'isPublic',
      title: 'Show in Checkout Panel',
      type: 'boolean',
      group: 'details',
      description: 'If on, this coupon appears in the "Available Coupons" section at checkout. If off, it is secret — customers must type the code manually.',
      initialValue: true,
    },
    {
      name: 'expiresAt',
      title: 'Expiry Date & Time',
      type: 'datetime',
      group: 'details',
      description: 'Leave empty to never expire',
    },

    // ─── RULES ────────────────────────────────────────────────────────────────
    {
      name: 'minOrder',
      title: 'Minimum Order Amount (₹)',
      type: 'number',
      group: 'rules',
      description: 'Minimum cart value required to use this coupon. Set 0 for no minimum.',
      initialValue: 0,
      validation: (Rule: any) => Rule.min(0),
    },
    {
      name: 'maxUses',
      title: 'Maximum Total Uses',
      type: 'number',
      group: 'rules',
      description: 'Leave empty for unlimited uses',
      validation: (Rule: any) => Rule.positive(),
    },
    {
      name: 'maxUsesPerUser',
      title: 'Max Uses Per Customer',
      type: 'number',
      group: 'rules',
      description: 'How many times a single email can use this coupon. Leave empty for unlimited.',
      initialValue: 1,
    },

    // ─── STATS (read-only, auto-updated via API) ───────────────────────────────
    {
      name: 'usedCount',
      title: 'Total Times Used',
      type: 'number',
      group: 'stats',
      readOnly: true,
      initialValue: 0,
    },
    {
      name: 'totalDiscountGiven',
      title: 'Total Discount Given (₹)',
      type: 'number',
      group: 'stats',
      readOnly: true,
      initialValue: 0,
    },
    {
      name: 'usages',
      title: 'Usage History',
      type: 'array',
      group: 'stats',
      readOnly: true,
      of: [
        {
          type: 'object',
          fields: [
            { name: 'orderNumber',    title: 'Order #',             type: 'string'   },
            { name: 'customerEmail',  title: 'Customer Email',      type: 'string'   },
            { name: 'customerName',   title: 'Customer Name',       type: 'string'   },
            { name: 'discountAmount', title: 'Discount Applied (₹)', type: 'number'  },
            { name: 'orderTotal',     title: 'Order Total (₹)',     type: 'number'   },
            { name: 'usedAt',         title: 'Used At',             type: 'datetime' },
          ],
          preview: {
            select: {
              orderNumber:    'orderNumber',
              customerEmail:  'customerEmail',
              discountAmount: 'discountAmount',
              orderTotal:     'orderTotal',
              usedAt:         'usedAt',
            },
            prepare({ orderNumber, customerEmail, discountAmount, orderTotal, usedAt }: any) {
              const date = usedAt ? new Date(usedAt).toLocaleString('en-IN') : '—';
              return {
                title:    `${orderNumber} — ₹${discountAmount?.toLocaleString('en-IN')} saved`,
                subtitle: `${customerEmail} • Order ₹${orderTotal?.toLocaleString('en-IN')} • ${date}`,
              };
            },
          },
        },
      ],
    },
  ],

  // Studio list preview
  preview: {
    select: {
      code:       'code',
      type:       'type',
      value:      'value',
      active:     'active',
      usedCount:  'usedCount',
      expiresAt:  'expiresAt',
      maxUses:    'maxUses',
    },
    prepare({ code, type, value, active, usedCount, expiresAt, maxUses }: any) {
      const typeLabel = type === 'percent' ? `${value}% off` : `₹${value} off`;
      const now       = new Date();
      const expired   = expiresAt && new Date(expiresAt) < now;
      const exhausted = maxUses && (usedCount || 0) >= maxUses;
      let status = active && !expired && !exhausted ? '🟢 Active' : '🔴 Inactive';
      if (expired)   status = '⏰ Expired';
      if (exhausted) status = '🚫 Exhausted';
      return {
        title:    `${code}`,
        subtitle: `${typeLabel} • Used ${usedCount || 0}x${maxUses ? `/${maxUses}` : ''} • ${status}`,
      };
    },
  },

  orderings: [
    {
      title: 'Active First',
      name:  'activeFirst',
      by:    [{ field: 'active', direction: 'desc' }, { field: 'code', direction: 'asc' }],
    },
    {
      title: 'Most Used',
      name:  'mostUsed',
      by:    [{ field: 'usedCount', direction: 'desc' }],
    },
    {
      title: 'Newest First',
      name:  'newestFirst',
      by:    [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
};
