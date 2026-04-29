import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient } from '@/sanity/client';

/**
 * GET /api/admin/users/[id]/sessions
 * Returns session history for a given employeeId (the [id] param).
 * super_admin: can view any user's sessions
 * admin: can view employee sessions only (not super_admin)
 * employee: can only view their own sessions
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: targetEmployeeId } = await params;

  // Role checks
  if (session.role === 'employee' && session.employeeId !== targetEmployeeId) {
    return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
  }

  try {
    // Verify the target user exists and get their role
    const targetUser = await sanityClient.fetch(
      `*[_type == "adminUser" && employeeId == $empId][0]{ role }`,
      { empId: targetEmployeeId }
    );

    // Admin cannot view super_admin or other admin sessions
    if (session.role === 'admin' && targetUser?.role !== 'employee') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const sessions = await sanityClient.fetch(
      `*[_type == "adminSession" && employeeId == $empId] | order(loginTime desc)[0...50]{
        _id, loginTime, logoutTime, lastActivityAt,
        totalActiveSeconds, totalIdleSeconds, ipAddress
      }`,
      { empId: targetEmployeeId }
    );

    return NextResponse.json({ sessions: sessions || [] });
  } catch (err) {
    console.error('[Admin User Sessions]', err);
    return NextResponse.json({ error: 'Failed to fetch sessions.' }, { status: 500 });
  }
}
