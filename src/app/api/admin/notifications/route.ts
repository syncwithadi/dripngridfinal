import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const notifications = await sanityClient.fetch(
      `*[_type == "adminNotification" && recipientId == $empId] | order(createdAt desc)[0...30]{
        _id, type, title, message, link, read, createdAt
      }`,
      { empId: session.employeeId }
    );
    const unreadCount = (notifications || []).filter((n: any) => !n.read).length;
    return NextResponse.json({ notifications: notifications || [], unreadCount });
  } catch (err) {
    console.error('[Notifications GET]', err);
    return NextResponse.json({ error: 'Failed to fetch.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { ids, markAllRead } = await req.json();

    if (markAllRead) {
      // Fetch all unread for this user and mark them read
      const unread = await sanityClient.fetch(
        `*[_type == "adminNotification" && recipientId == $empId && read == false]._id`,
        { empId: session.employeeId }
      );
      if (unread?.length > 0) {
        await Promise.all(
          unread.map((id: string) => sanityWriteClient.patch(id).set({ read: true }).commit({ visibility: 'async' }))
        );
      }
    } else if (ids?.length > 0) {
      await Promise.all(
        ids.map((id: string) => sanityWriteClient.patch(id).set({ read: true }).commit({ visibility: 'async' }))
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Notifications PATCH]', err);
    return NextResponse.json({ error: 'Failed to update.' }, { status: 500 });
  }
}
