import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient } from '@/sanity/client';

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
