import { logAction, LogEntry } from './logger';
import { triggerNotification, NotificationPayload } from './notifications';
import { AdminTokenPayload } from './auth';

export interface EventPayload {
  /** The log action string e.g. 'PRODUCT_REQUEST_APPROVE' */
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  ip?: string;
  /** If provided, a notification is fired to the given recipient */
  notify?: NotificationPayload;
  /** If provided, notifications are fired to all listed recipients */
  notifyAll?: NotificationPayload[];
}

/**
 * Central event bus for the admin panel.
 * Writes to the audit log AND fires notifications in a single call.
 * Both operations are non-blocking — a failure in either never crashes the caller.
 *
 * Usage:
 *   await logAndTriggerEvent(session, {
 *     action: 'PRODUCT_REQUEST_APPROVE',
 *     entity: 'productRequest',
 *     entityId: id,
 *     details: 'Approved and published',
 *     notify: {
 *       recipientId: submitterEmployeeId,
 *       type: 'product_approved',
 *       title: 'Your product request was approved!',
 *       message: `"${title}" has been approved by ${session.name}.`,
 *       link: '/admin/product-requests',
 *     }
 *   });
 */
export async function logAndTriggerEvent(
  user: AdminTokenPayload,
  event: EventPayload
): Promise<void> {
  const logEntry: LogEntry = {
    action: event.action,
    entity: event.entity,
    entityId: event.entityId,
    details: event.details,
    ip: event.ip,
  };

  // Run log + notification(s) in parallel, both non-blocking
  const ops: Promise<void>[] = [logAction(user, logEntry)];

  if (event.notify) {
    ops.push(triggerNotification(event.notify));
  }

  if (event.notifyAll?.length) {
    ops.push(...event.notifyAll.map(n => triggerNotification(n)));
  }

  await Promise.allSettled(ops);
}
