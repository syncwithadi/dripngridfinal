import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient } from '@/sanity/client';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Super Admin can see everyone. Admin can see employees.
  if (!canAccess(session.role, 'super_admin') && session.role !== 'admin') {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    // 1. Fetch user to ensure they exist and we have their employeeId
    const targetUser = await sanityClient.fetch(
      `*[_type == "adminUser" && _id == $id][0]{ employeeId, role }`,
      { id }
    );
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Admins cannot analyze super_admins or other admins
    if (session.role === 'admin' && targetUser.role !== 'employee') {
      return NextResponse.json({ error: 'Cannot analyze admins.' }, { status: 403 });
    }

    const employeeId = targetUser.employeeId;

    // 2. Fetch Sessions (for working hours)
    // We get all sessions for this employeeId
    const sessions = await sanityClient.fetch(
      `*[_type == "adminSession" && employeeId == $employeeId] | order(loginTime desc)[0...100] {
        loginTime, logoutTime, totalActiveSeconds, totalIdleSeconds
      }`,
      { employeeId }
    );

    let totalActiveSecs = 0;
    let totalIdleSecs = 0;
    let currentSession = null;
    
    sessions.forEach((s: any) => {
      totalActiveSecs += (s.totalActiveSeconds || 0);
      totalIdleSecs += (s.totalIdleSeconds || 0);
      if (!s.logoutTime && !currentSession) {
        currentSession = s; // The most recent open session
      }
    });

    const hoursWorked = (totalActiveSecs / 3600).toFixed(1);
    const idleHours = (totalIdleSecs / 3600).toFixed(1);

    // 3. Fetch Tasks (completed vs pending)
    const tasks = await sanityClient.fetch(
      `{
        "completed": count(*[_type == "adminTask" && assignedTo == $employeeId && status == "done"]),
        "pending": count(*[_type == "adminTask" && assignedTo == $employeeId && status != "done"])
      }`,
      { employeeId }
    );

    // 4. Fetch the latest action logs (what changes they did)
    // We filter out LOGIN/LOGOUT for the "changes" view to focus on actual work
    const workLogs = await sanityClient.fetch(
      `*[_type == "adminLog" && employeeId == $employeeId && action != "LOGIN" && action != "LOGOUT" && action != "HEARTBEAT"] | order(timestamp desc)[0...50]{
        _id, action, details, timestamp, entity
      }`,
      { employeeId }
    );

    return NextResponse.json({
      ok: true,
      stats: {
        totalActiveSecs,
        totalIdleSecs,
        hoursWorked,
        idleHours,
        sessionsCount: sessions.length,
        tasksCompleted: tasks.completed || 0,
        tasksPending: tasks.pending || 0,
      },
      recentWork: workLogs,
    });
  } catch (err) {
    console.error('[User Analysis GET]', err);
    return NextResponse.json({ error: 'Failed to fetch analysis.' }, { status: 500 });
  }
}
