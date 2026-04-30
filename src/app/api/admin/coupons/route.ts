import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAndTriggerEvent } from '@/lib/admin/events';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const coupons = await sanityClient.fetch(
      `*[_type == "coupon"] | order(_createdAt desc){
        _id, code, type, value, maxDiscount, minOrder, maxUses, maxUsesPerUser,
        expiresAt, active, isPublic, usedCount, totalDiscountGiven, _createdAt
      }`,
      {}
    );
    return NextResponse.json({ coupons: coupons || [] });
  } catch (err) {
    console.error('[Admin Coupons]', err);
    return NextResponse.json({ error: 'Failed to fetch coupons.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Only Super Admins can create coupons instantly without approval
  if (!canAccess(session.role, 'super_admin')) {
    return NextResponse.json({ error: 'Insufficient permissions. Please submit a coupon request instead.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { code, type, value, maxDiscount, minOrder, maxUses, maxUsesPerUser, expiresAt, description, isPublic } = body;

    if (!code || !value) {
      return NextResponse.json({ error: 'Code and value are required.' }, { status: 400 });
    }

    const doc = {
      _type: 'coupon',
      code: code.toUpperCase(),
      type,
      value: Number(value),
      maxDiscount: maxDiscount ? Number(maxDiscount) : null,
      minOrder: minOrder ? Number(minOrder) : 0,
      maxUses: maxUses ? Number(maxUses) : null,
      maxUsesPerUser: maxUsesPerUser ? Number(maxUsesPerUser) : 1,
      expiresAt: expiresAt || null,
      description: description || '',
      isPublic: isPublic ?? true,
      active: true,
      usedCount: 0,
      totalDiscountGiven: 0,
    };

    const created = await sanityWriteClient.create(doc);

    await logAndTriggerEvent(session, {
      action: 'COUPON_CREATE',
      entity: 'coupon',
      entityId: created._id,
      details: `Instantly created coupon: ${doc.code}`,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ ok: true, coupon: created });
  } catch (err) {
    console.error('[Admin Coupons Create]', err);
    return NextResponse.json({ error: 'Failed to create coupon.' }, { status: 500 });
  }
}
