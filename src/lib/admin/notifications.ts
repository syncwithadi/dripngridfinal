import { sanityWriteClient } from '@/sanity/client';

export interface NotificationPayload {
  recipientId: string;   // employeeId of who receives it
  type: string;          // e.g. 'task_assigned', 'product_approved', 'report_resolved'
  title: string;
  message: string;
  link?: string;         // e.g. '/admin/tasks', '/admin/product-requests'
}

/**
 * Creates a notification document in Sanity for a specific staff member.
 * Fire-and-forget safe — errors are caught and logged, never thrown.
 */
export async function triggerNotification(payload: NotificationPayload): Promise<void> {
  try {
    if (!payload.recipientId || !payload.title) return;
    await sanityWriteClient.create({
      _type: 'adminNotification',
      recipientId: payload.recipientId,
      type: payload.type,
      title: payload.title,
      message: payload.message || '',
      link: payload.link || null,
      read: false,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    // Notification failure must NEVER break the calling operation
    console.error('[triggerNotification] Failed:', err);
  }
}

/**
 * Sends notifications to multiple recipients at once.
 */
export async function triggerNotificationBatch(
  payloads: NotificationPayload[]
): Promise<void> {
  await Promise.allSettled(payloads.map(triggerNotification));
}

/**
 * Sends a notification to all super_admin and admin users.
 * Useful for system-wide events.
 */
export async function notifyAdmins(payload: Omit<NotificationPayload, 'recipientId'>): Promise<void> {
  try {
    const { sanityClient } = await import('@/sanity/client');
    const admins = await sanityClient.fetch(
      `*[_type == "adminUser" && active == true && (role == "super_admin" || role == "admin")]{ employeeId }`,
      {}
    );
    if (!admins?.length) return;
    await Promise.allSettled(
      admins.map((a: { employeeId: string }) =>
        triggerNotification({ ...payload, recipientId: a.employeeId })
      )
    );
  } catch (err) {
    console.error('[notifyAdmins] Failed:', err);
  }
}
