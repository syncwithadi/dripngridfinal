import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAndTriggerEvent } from '@/lib/admin/events';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let settings = await sanityClient.fetch(
      `*[_type == "siteSettings"][0]{ _id, isLive, closedMessage }`
    );

    // Auto-create if it doesn't exist
    if (!settings) {
      settings = await sanityWriteClient.create({
        _type: 'siteSettings',
        isLive: true,
        closedMessage: 'DRIPNGRID is closed for now. We’ll be back soon.',
      });
    }

    return NextResponse.json({
      isLive: settings.isLive ?? true,
      closedMessage: settings.closedMessage || 'DRIPNGRID is closed for now. We’ll be back soon.',
    });
  } catch (err) {
    console.error('[SiteSettings GET]', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (session.role !== 'admin' && session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { isLive, message } = await req.json();

    const existing = await sanityClient.fetch(`*[_type == "siteSettings"][0]._id`);
    let docId = existing;

    if (existing) {
      await sanityWriteClient.patch(existing).set({ isLive, closedMessage: message }).commit();
    } else {
      const doc = await sanityWriteClient.create({
        _type: 'siteSettings',
        isLive,
        closedMessage: message,
      });
      docId = doc._id;
    }

    // Log the event
    await logAndTriggerEvent(session, {
      action: isLive ? 'SITE_STATUS_LIVE' : 'SITE_STATUS_OFFLINE',
      entity: 'siteSettings',
      entityId: docId,
      details: `Site set to ${isLive ? 'LIVE' : 'OFFLINE'}`,
    });

    return NextResponse.json({ success: true, isLive, closedMessage: message });
  } catch (err) {
    console.error('[SiteSettings PATCH]', err);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
