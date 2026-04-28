import { NextRequest, NextResponse } from 'next/server';
import { sanityClient } from '@/sanity/client';

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal, customerEmail } = await request.json();

    if (!code?.trim()) {
      return NextResponse.json({ valid: false, message: 'Please enter a coupon code.' });
    }

    const coupon = await sanityClient.fetch(
      `*[_type == "coupon" && code == $code][0]`,
      { code: code.toUpperCase().trim() }
    );

    if (!coupon) {
      return NextResponse.json({ valid: false, message: 'Invalid coupon code.' });
    }

    if (!coupon.active) {
      return NextResponse.json({ valid: false, message: 'This coupon is no longer active.' });
    }

    // Check expiry
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, message: 'This coupon has expired.' });
    }

    // Check max total uses
    if (coupon.maxUses && (coupon.usedCount || 0) >= coupon.maxUses) {
      return NextResponse.json({ valid: false, message: 'This coupon has reached its usage limit.' });
    }

    // Check per-user uses
    if (coupon.maxUsesPerUser && customerEmail && coupon.usages) {
      const userUses = (coupon.usages as any[]).filter(
        (u) => u.customerEmail === customerEmail
      ).length;
      if (userUses >= coupon.maxUsesPerUser) {
        return NextResponse.json({ valid: false, message: 'You have already used this coupon.' });
      }
    }

    // Check minimum order — return needsMore so UI can show "Add ₹X more" nudge
    if (coupon.minOrder && subtotal < coupon.minOrder) {
      const needed = coupon.minOrder - subtotal;
      return NextResponse.json({
        valid: false,
        message: `Add ₹${needed.toLocaleString('en-IN')} more to use this coupon.`,
        needsMore: needed,
        minOrder: coupon.minOrder,
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percent') {
      discountAmount = Math.round(subtotal * (coupon.value / 100));
      if (coupon.maxDiscount) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
      // fixed — can't discount more than subtotal
      discountAmount = Math.min(coupon.value, subtotal);
    }

    return NextResponse.json({
      valid: true,
      discountAmount,
      coupon: {
        code:        coupon.code,
        type:        coupon.type,
        value:       coupon.value,
        description: coupon.description,
        maxDiscount: coupon.maxDiscount,
      },
      message: coupon.type === 'percent'
        ? `${coupon.value}% off applied! You save ₹${discountAmount.toLocaleString('en-IN')}.`
        : `₹${discountAmount.toLocaleString('en-IN')} off applied!`,
    });
  } catch (err) {
    console.error('Coupon validate error:', err);
    return NextResponse.json({ valid: false, message: 'Something went wrong.' }, { status: 500 });
  }
}
