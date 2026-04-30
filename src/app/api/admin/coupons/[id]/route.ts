import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityWriteClient } from '@/sanity/client';
import { logAndTriggerEvent } from '@/lib/admin/events';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const { active } = await req.json();
    await sanityWriteClient.patch(id).set({ active }).commit();

    await logAndTriggerEvent(session, {
      action: 'COUPON_UPDATE',
      entity: 'coupon',
      entityId: id,
      details: `${active ? 'Enabled' : 'Disabled'} coupon`,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Admin Coupons Update]', err);
    return NextResponse.json({ error: 'Failed to update coupon.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }

  const { id } = await params;

  try {
    await sanityWriteClient.delete(id);

    await logAndTriggerEvent(session, {
      action: 'COUPON_UPDATE',
      entity: 'coupon',
      entityId: id,
      details: `Deleted coupon`,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Admin Coupons Delete]', err);
    return NextResponse.json({ error: 'Failed to delete coupon.' }, { status: 500 });
  }
}
