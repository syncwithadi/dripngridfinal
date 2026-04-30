import { sanityWriteClient } from '@/sanity/client';
import { AdminTokenPayload } from './auth';

export type LogSeverity = 'info' | 'warning' | 'critical';

export interface LogEntry {
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  ip?: string;
  severity?: LogSeverity;
}

// Actions that are automatically treated as critical
const CRITICAL_ACTIONS = new Set([
  'DELETE', 'PRODUCT_REQUEST_DELETE', 'USER_DELETE', 'PRODUCT_DELETE',
  'BULK_DELETE', 'PURGE', 'SESSION_REVOKE', 'ROLE_CHANGE',
]);

const WARNING_ACTIONS = new Set([
  'PRODUCT_REQUEST_REJECT', 'LOGIN_FAILED', 'UNAUTHORIZED_ACCESS',
  'PASSWORD_RESET', 'USER_DEACTIVATE',
]);

function inferSeverity(action: string, explicit?: LogSeverity): LogSeverity {
  if (explicit) return explicit;
  if (CRITICAL_ACTIONS.has(action)) return 'critical';
  if (WARNING_ACTIONS.has(action)) return 'warning';
  return 'info';
}

export async function logAction(user: AdminTokenPayload, entry: LogEntry) {
  try {
    await sanityWriteClient.create({
      _type: 'adminLog',
      timestamp: new Date().toISOString(),
      employeeId: user.employeeId,
      employeeName: user.name,
      role: user.role,
      action: entry.action,
      entity: entry.entity || null,
      entityId: entry.entityId || null,
      details: entry.details || null,
      ip: entry.ip || null,
      severity: inferSeverity(entry.action, entry.severity),
    });
  } catch (err) {
    // Log failure should not break the main operation
    console.error('[AdminLogger] Failed to write log:', err);
  }
}
