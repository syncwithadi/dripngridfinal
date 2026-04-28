import { NextRequest, NextResponse } from 'next/server';
import { sanityClient } from '@/sanity/client';

// Returns only public, active, non-expired coupons — safe to expose to customers
export async function GET(request: NextRequest) {
  try {
    const now = new Date().toISOString();

    const coupons = await sanityClient.fetch(
      `*[_type == "coupon" && active == true && isPublic == true
         && (expiresAt == null || expiresAt > $now)
         && (maxUses == null || usedCount < maxUses)
        ] | order(_createdAt desc) {
          code,
          description,
          type,
          value,
          maxDiscount,
          minOrder,
          maxUses,
          usedCount,
          expiresAt,
        }`,
      { now }
    );

    return NextResponse.json({ coupons: coupons || [] });
  } catch (err) {
    console.error('Available coupons error:', err);
    return NextResponse.json({ coupons: [] }, { status: 500 });
  }
}
