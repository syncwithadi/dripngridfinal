// Order Schema for Sanity Studio - Enhanced with Admin-friendly UX

export const orderSchema = {
  name: 'order',
  title: 'Order',
  type: 'document',
  groups: [
    { name: 'overview', title: 'Overview', default: true },
    { name: 'customer', title: 'Customer' },
    { name: 'items', title: 'Items' },
    { name: 'payment', title: 'Payment' },
    { name: 'shipping', title: 'Shipping' },
    { name: 'notes', title: 'Notes' },
  ],
  fields: [
    // ===== OVERVIEW GROUP (Most important fields at top) =====
    {
      name: 'orderNumber',
      title: 'Order Number',
      type: 'string',
      group: 'overview',
      validation: (Rule: any) => Rule.required(),
      readOnly: true,
    },
    {
      name: 'status',
      title: '📦 Current Status',
      description: 'Update this to reflect the current order status. Changes will be visible to the customer.',
      type: 'string',
      group: 'overview',
      options: {
        list: [
          { title: '🟡 Processing', value: 'processing' },
          { title: '📦 Shipped', value: 'shipped' },
          { title: '🚚 In Transit', value: 'in-transit' },
          { title: '✅ Delivered', value: 'delivered' },
          { title: '❌ Cancelled', value: 'cancelled' },
        ],
        layout: 'radio',
      },
      initialValue: 'processing',
    },
    {
      name: 'createdAt',
      title: 'Order Date',
      type: 'datetime',
      group: 'overview',
      readOnly: true,
    },
    {
      name: 'total',
      title: 'Total Amount',
      type: 'number',
      group: 'overview',
      validation: (Rule: any) => Rule.required(),
      readOnly: true,
    },
    {
      name: 'currency',
      title: 'Currency',
      type: 'string',
      group: 'overview',
      options: {
        list: [
          { title: 'INR (₹)', value: 'INR' },
          { title: 'USD ($)', value: 'USD' },
        ],
      },
      initialValue: 'INR',
      readOnly: true,
    },
    // Status change timestamp (for tracking)
    {
      name: 'statusUpdatedAt',
      title: 'Status Last Updated',
      type: 'datetime',
      group: 'overview',
      description: 'Automatically updated when status changes',
    },

    // ===== CUSTOMER GROUP =====
    {
      name: 'customer',
      title: 'Customer Details',
      type: 'object',
      group: 'customer',
      fields: [
        { name: 'name', title: 'Name', type: 'string' },
        { name: 'email', title: 'Email', type: 'string' },
        { name: 'phone', title: 'Phone', type: 'string' },
      ],
    },

    // ===== ITEMS GROUP =====
    {
      name: 'items',
      title: 'Order Items',
      type: 'array',
      group: 'items',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'product',
              title: 'Product',
              type: 'reference',
              to: [{ type: 'product' }],
            },
            { name: 'productName', title: 'Product Name', type: 'string' },
            { name: 'size', title: 'Size', type: 'string' },
            { name: 'color', title: 'Color', type: 'string' },
            { name: 'quantity', title: 'Quantity', type: 'number' },
            { name: 'priceINR', title: 'Price (INR)', type: 'number' },
            { name: 'priceUSD', title: 'Price (USD)', type: 'number' },
          ],
          preview: {
            select: {
              title: 'productName',
              quantity: 'quantity',
              size: 'size',
            },
            prepare({ title, quantity, size }: { title: string; quantity: number; size: string }) {
              return {
                title: `${title} × ${quantity}`,
                subtitle: `Size: ${size}`,
              };
            },
          },
        },
      ],
    },
    {
      name: 'subtotal',
      title: 'Subtotal',
      type: 'number',
      group: 'items',
      readOnly: true,
    },
    {
      name: 'discountCode',
      title: '🎟️ Coupon Code Used',
      type: 'string',
      group: 'items',
      readOnly: true,
    },
    {
      name: 'discountAmount',
      title: 'Discount Applied (₹)',
      type: 'number',
      group: 'items',
      initialValue: 0,
      readOnly: true,
    },
    {
      name: 'shipping',
      title: 'Shipping Cost',
      type: 'number',
      group: 'items',
      initialValue: 0,
      readOnly: true,
    },
    {
      name: 'tax',
      title: 'Tax',
      type: 'number',
      group: 'items',
      initialValue: 0,
      readOnly: true,
    },

    // ===== PAYMENT GROUP =====
    {
      name: 'paymentStatus',
      title: 'Payment Status',
      type: 'string',
      group: 'payment',
      options: {
        list: [
          { title: '⏳ Pending', value: 'pending' },
          { title: '✅ Paid', value: 'paid' },
          { title: '❌ Failed', value: 'failed' },
          { title: '↩️ Refunded', value: 'refunded' },
        ],
      },
      initialValue: 'pending',
    },
    {
      name: 'paymentMethod',
      title: 'Payment Method',
      type: 'string',
      group: 'payment',
      options: {
        list: [
          { title: 'Razorpay (Online)', value: 'razorpay' },
          { title: 'Cash on Delivery', value: 'cod' },
        ],
      },
      readOnly: true,
    },
    {
      name: 'paymentId',
      title: 'Razorpay Payment ID',
      type: 'string',
      group: 'payment',
      readOnly: true,
    },
    {
      name: 'razorpayOrderId',
      title: 'Razorpay Order ID',
      type: 'string',
      group: 'payment',
      readOnly: true,
    },

    // ===== SHIPPING GROUP =====
    {
      name: 'shippingAddress',
      title: 'Shipping Address',
      type: 'object',
      group: 'shipping',
      fields: [
        { name: 'line1', title: 'Address Line 1', type: 'string' },
        { name: 'line2', title: 'Address Line 2', type: 'string' },
        { name: 'city', title: 'City', type: 'string' },
        { name: 'state', title: 'State', type: 'string' },
        { name: 'postalCode', title: 'Postal Code', type: 'string' },
        { name: 'country', title: 'Country', type: 'string' },
      ],
    },
    {
      name: 'trackingNumber',
      title: 'Tracking Number',
      type: 'string',
      group: 'shipping',
      description: 'Optional: Add courier tracking number for shipped orders',
    },
    {
      name: 'courierPartner',
      title: 'Courier Partner',
      type: 'string',
      group: 'shipping',
      options: {
        list: [
          { title: 'Delhivery', value: 'delhivery' },
          { title: 'BlueDart', value: 'bluedart' },
          { title: 'DTDC', value: 'dtdc' },
          { title: 'Shiprocket', value: 'shiprocket' },
          { title: 'India Post', value: 'indiapost' },
          { title: 'Other', value: 'other' },
        ],
      },
    },

    // ===== NOTES GROUP =====
    {
      name: 'notes',
      title: 'Order Notes',
      type: 'text',
      group: 'notes',
      description: 'Internal notes about this order (not visible to customer)',
    },
  ],

  // Enhanced preview showing status prominently
  preview: {
    select: {
      orderNumber: 'orderNumber',
      customerName: 'customer.name',
      customerEmail: 'customer.email',
      status: 'status',
      total: 'total',
      createdAt: 'createdAt',
    },
    prepare(selection: any) {
      const {
        orderNumber,
        customerName,
        customerEmail,
        status,
        total,
        createdAt,
      } = selection;

      const statusEmoji: Record<string, string> = {
        processing: '🟡',
        shipped: '📦',
        'in-transit': '🚚',
        delivered: '✅',
        cancelled: '❌',
        pending: '⏳',
        confirmed: '🔵',
      };
      const emoji = statusEmoji[status] || '❔';
      const date = createdAt ? new Date(createdAt).toLocaleDateString() : '';

      return {
        title: `${emoji} ${orderNumber}`,
        subtitle: `${customerName || customerEmail} • ₹${total?.toLocaleString()} • ${date}`,
      };
    },
  },

  // Multiple ordering options for admin filtering
  orderings: [
    {
      title: 'Newest First',
      name: 'createdAtDesc',
      by: [{ field: 'createdAt', direction: 'desc' }],
    },
    {
      title: 'Oldest First',
      name: 'createdAtAsc',
      by: [{ field: 'createdAt', direction: 'asc' }],
    },
    {
      title: 'Status (Processing First)',
      name: 'statusProcessing',
      by: [
        { field: 'status', direction: 'asc' },
        { field: 'createdAt', direction: 'desc' },
      ],
    },
    {
      title: 'Status (Delivered First)',
      name: 'statusDelivered',
      by: [
        { field: 'status', direction: 'desc' },
        { field: 'createdAt', direction: 'desc' },
      ],
    },
    {
      title: 'Total (High to Low)',
      name: 'totalDesc',
      by: [{ field: 'total', direction: 'desc' }],
    },
  ],
};

export default orderSchema;
