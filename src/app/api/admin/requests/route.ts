import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient } from '@/sanity/client';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || '';

    let filter = `_type == "couponRequest"`;
    const params: Record<string, string> = {};

    if (status) { filter += ` && status == $status`; params.status = status; }

    const requests = await sanityClient.fetch(
      `*[${filter}] | order(createdAt desc){
        _id, status, couponData, reason,
        requestedByEmployeeId, requestedByName,
        resolvedByEmployeeId, resolvedByName,
        rejectionReason, createdAt, resolvedAt, createdCouponId
      }`,
      params
    );

    return NextResponse.json({ requests: requests || [] });
  } catch (err) {
    console.error('[Admin Requests]', err);
    return NextResponse.json({ error: 'Failed to fetch requests.' }, { status: 500 });
  }
}
