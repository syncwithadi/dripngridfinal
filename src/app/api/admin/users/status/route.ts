import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient } from '@/sanity/client';

/**
 * GET /api/admin/users/status
 * Returns real-time presence status for admin users.
 *
 * Status logic (based on lastActivityAt):
 *   online  → lastActivityAt within last 2 minutes
 *   idle    → lastActivityAt exists but >5 minutes ago (or isCurrentlyIdle=true)
 *   offline → no lastActivityAt, or >8h without activity
 */
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }

  try {
    const roleClause =
      session.role === 'super_admin'
        ? ``
        : ` && role == "employee"`;

    const users = await sanityClient.fetch(
      `*[_type == "adminUser" && active == true${roleClause}]{
        _id, employeeId, name, role, lastActivityAt, isCurrentlyIdle, lastLogin
      }`,
      {}
    );

    const now = Date.now();
    const ONLINE_THRESHOLD_MS  = 2 * 60 * 1000;   // 2 minutes
    const IDLE_THRESHOLD_MS    = 5 * 60 * 1000;   // 5 minutes
    const SESSION_EXPIRY_MS    = 8 * 60 * 60 * 1000; // 8 hours

    const withStatus = (users || []).map((u: any) => {
      let status: 'online' | 'idle' | 'offline' = 'offline';

      if (u.lastActivityAt) {
        const age = now - new Date(u.lastActivityAt).getTime();
        if (age > SESSION_EXPIRY_MS) {
          status = 'offline';
        } else if (u.isCurrentlyIdle || age >= IDLE_THRESHOLD_MS) {
          status = 'idle';
        } else if (age < ONLINE_THRESHOLD_MS) {
          status = 'online';
        } else {
          status = 'online';
        }
      }

      return {
        employeeId: u.employeeId,
        name: u.name,
        role: u.role,
        status,
        lastActivityAt: u.lastActivityAt ?? null,
        lastLogin: u.lastLogin ?? null,
      };
    });

    const order: Record<'online' | 'idle' | 'offline', number> = { online: 0, idle: 1, offline: 2 };
    withStatus.sort((a: any, b: any) =>
      order[a.status as 'online' | 'idle' | 'offline'] - order[b.status as 'online' | 'idle' | 'offline']
    );

    return NextResponse.json({ users: withStatus });
  } catch (err) {
    console.error('[Admin Users Status GET]', err);
    return NextResponse.json({ error: 'Failed to fetch status.' }, { status: 500 });
  }
}
