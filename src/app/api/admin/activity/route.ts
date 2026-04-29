import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';

/**
 * POST /api/admin/activity
 *
 * Heartbeat endpoint called every 30 seconds from the AdminShell.
 * Body: { isIdle: boolean, activeSecs: number, idleSecs: number }
 *
 * Finds the most recent open session for this user and updates:
 *   - lastActivityAt
 *   - totalActiveSeconds  (incremented by activeSecs)
 *   - totalIdleSeconds    (incremented by idleSecs)
 *
 * Also updates lastActivityAt on the adminUser document (for real-time status).
 * Batched every 30s on the client — minimal Sanity writes.
 */
export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const isIdle: boolean = body.isIdle ?? false;
    const activeSecs: number = Math.max(0, Math.round(body.activeSecs ?? 0));
    const idleSecs: number = Math.max(0, Math.round(body.idleSecs ?? 0));

    const now = new Date().toISOString();

    // Find the most recent open session for this employee
    const openSession = await sanityClient.fetch(
      `*[_type == "adminSession" && employeeId == $empId && !defined(logoutTime)] | order(loginTime desc)[0]{
        _id, totalActiveSeconds, totalIdleSeconds
      }`,
      { empId: session.employeeId }
    );

    if (openSession?._id) {
      await sanityWriteClient
        .patch(openSession._id)
        .set({
          lastActivityAt: now,
          totalActiveSeconds: (openSession.totalActiveSeconds ?? 0) + activeSecs,
          totalIdleSeconds: (openSession.totalIdleSeconds ?? 0) + idleSecs,
        })
        .commit({ visibility: 'async' }); // async commit for speed
    }

    // Also keep lastActivityAt on the adminUser itself (drives real-time status widget)
    await sanityWriteClient
      .patch(session.sub)
      .set({ lastActivityAt: now, isCurrentlyIdle: isIdle })
      .commit({ visibility: 'async' });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Admin Activity]', err);
    // Return 200 so the client doesn't spam retries on a minor Sanity hiccup
    return NextResponse.json({ ok: false });
  }
}
