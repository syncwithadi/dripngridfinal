import { sanityWriteClient } from '@/sanity/client';
import { AdminTokenPayload } from './auth';

export interface LogEntry {
  action: string;
  entity?: string;
  entityId?: string;
  details?: string;
  ip?: string;
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
    });
  } catch (err) {
    // Log failure should not break the main operation
    console.error('[AdminLogger] Failed to write log:', err);
  }
}
