import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { verifyOTP, isOTPExpired, hasExceededAttempts, MAX_ATTEMPTS } from '@/lib/admin/otp';
import { logAction } from '@/lib/admin/logger';

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Only admin or super_admin can verify
  if (!canAccess(session.role, 'admin')) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }

  try {
    const { requestId, otp, action } = await req.json(); // action: 'approve' | 'reject'

    if (!requestId || !action) {
      return NextResponse.json({ error: 'requestId and action are required.' }, { status: 400 });
    }

    const couponReq = await sanityClient.fetch(
      `*[_type == "couponRequest" && _id == $id][0]{
        _id, status, couponData, otpHash, otpExpiry, otpAttempts, requestedByName
      }`,
      { id: requestId }
    );

    if (!couponReq) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    if (couponReq.status === 'approved' || couponReq.status === 'rejected') {
      return NextResponse.json({ error: 'Request already resolved.' }, { status: 409 });
    }

    if (action === 'reject') {
      const { rejectionReason } = await req.json().catch(() => ({}));
      await sanityWriteClient.patch(requestId).set({
        status: 'rejected',
        resolvedByEmployeeId: session.employeeId,
        resolvedByName: session.name,
        resolvedAt: new Date().toISOString(),
        rejectionReason: rejectionReason || 'Rejected by admin.',
      }).commit();

      logAction(session, {
        action: 'COUPON_REJECT',
        entity: 'couponRequest',
        entityId: requestId,
        details: `Rejected coupon request for ${couponReq.couponData?.code}`,
      });
      return NextResponse.json({ ok: true, result: 'rejected' });
    }

    // Approve flow requires OTP
    if (!otp) return NextResponse.json({ error: 'OTP is required to approve.' }, { status: 400 });

    // Check attempts
    if (hasExceededAttempts(couponReq.otpAttempts || 0)) {
      return NextResponse.json({
        error: `Maximum ${MAX_ATTEMPTS} OTP attempts exceeded. Request is blocked.`,
        blocked: true,
      }, { status: 429 });
    }

    // Check expiry
    if (!couponReq.otpExpiry || isOTPExpired(couponReq.otpExpiry)) {
      return NextResponse.json({ error: 'OTP has expired. Please resend.' }, { status: 410 });
    }

    // Verify OTP
    const valid = await verifyOTP(otp, couponReq.otpHash);
    if (!valid) {
      const newAttempts = (couponReq.otpAttempts || 0) + 1;
      await sanityWriteClient.patch(requestId).set({ otpAttempts: newAttempts }).commit();

      logAction(session, {
        action: 'OTP_FAIL',
        entity: 'couponRequest',
        entityId: requestId,
        details: `Attempt ${newAttempts}/${MAX_ATTEMPTS}`,
      });

      return NextResponse.json({
        error: `Incorrect OTP. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`,
        attemptsLeft: MAX_ATTEMPTS - newAttempts,
      }, { status: 400 });
    }

    // OTP valid — create coupon in Sanity
    const cd = couponReq.couponData;
    const coupon = await sanityWriteClient.create({
      _type: 'coupon',
      code: cd.code,
      description: cd.description || '',
      type: cd.type,
      value: cd.value,
      maxDiscount: cd.maxDiscount || null,
      minOrder: cd.minOrder || 0,
      maxUses: cd.maxUses || null,
      maxUsesPerUser: cd.maxUsesPerUser || 1,
      expiresAt: cd.expiresAt || null,
      isPublic: cd.isPublic !== false,
      active: true,
      usedCount: 0,
      totalDiscountGiven: 0,
      usages: [],
    });

    // Mark request as approved
    await sanityWriteClient.patch(requestId).set({
      status: 'approved',
      resolvedByEmployeeId: session.employeeId,
      resolvedByName: session.name,
      resolvedAt: new Date().toISOString(),
      createdCouponId: coupon._id,
    }).commit();

    logAction(session, {
      action: 'COUPON_APPROVE',
      entity: 'couponRequest',
      entityId: requestId,
      details: `Approved. Coupon ${cd.code} created (${coupon._id})`,
    });
    logAction(session, {
      action: 'COUPON_CREATE',
      entity: 'coupon',
      entityId: coupon._id,
      details: `Code: ${cd.code}, Type: ${cd.type}, Value: ${cd.value}`,
    });

    return NextResponse.json({ ok: true, result: 'approved', couponId: coupon._id });
  } catch (err) {
    console.error('[Coupon Verify]', err);
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 });
  }
}

// Resend OTP
export async function PUT(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }

  try {
    const { requestId } = await req.json();
    const { generateOTP, hashOTP, otpExpiryISO } = await import('@/lib/admin/otp');
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const couponReq = await sanityClient.fetch(
      `*[_type == "couponRequest" && _id == $id][0]{ _id, status, couponData }`,
      { id: requestId }
    );
    if (!couponReq) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });
    if (couponReq.status === 'approved' || couponReq.status === 'rejected') {
      return NextResponse.json({ error: 'Request already resolved.' }, { status: 409 });
    }

    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const otpExpiry = otpExpiryISO();

    await sanityWriteClient.patch(requestId).set({
      otpHash, otpExpiry, otpAttempts: 0, status: 'otp_sent',
    }).commit();

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (superAdminEmail) {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@dripngrid.in',
        to: superAdminEmail,
        subject: `[DRIPNGRID Admin] New OTP — ${couponReq.couponData?.code}`,
        html: `<div style="font-family:sans-serif;text-align:center;padding:40px"><h2>New OTP Requested</h2><p style="font-size:40px;font-weight:bold;letter-spacing:8px;">${otp}</p><p style="color:#999">Expires in 5 minutes</p></div>`,
      });
    }

    logAction(session, { action: 'OTP_SEND', entity: 'couponRequest', entityId: requestId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Resend OTP]', err);
    return NextResponse.json({ error: 'Failed to resend OTP.' }, { status: 500 });
  }
}
