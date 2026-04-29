import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, clearAdminCookie } from '@/lib/admin/auth';
import { logAction } from '@/lib/admin/logger';
import { sanityClient, sanityWriteClient } from '@/sanity/client';

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);

  if (session) {
    const logoutTime = new Date().toISOString();

    logAction(session, { action: 'LOGOUT', entity: 'adminUser', entityId: session.sub });

    // Close the most recent open session document — fire-and-forget
    (async () => {
      try {
        const openSession = await sanityClient.fetch(
          `*[_type == "adminSession" && employeeId == $empId && !defined(logoutTime)] | order(loginTime desc)[0]._id`,
          { empId: session.employeeId }
        );
        if (openSession) {
          await sanityWriteClient.patch(openSession).set({ logoutTime }).commit();
        }
        // Clear idle flag on user
        await sanityWriteClient
          .patch(session.sub)
          .set({ isCurrentlyIdle: false })
          .commit();
      } catch (e) {
        console.error('[AdminSession Logout]', e);
      }
    })();
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearAdminCookie());
  return response;
}
