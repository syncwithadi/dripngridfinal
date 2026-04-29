import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityWriteClient } from '@/sanity/client';
import { generateOTP, hashOTP, otpExpiryISO } from '@/lib/admin/otp';
import { logAction } from '@/lib/admin/logger';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { couponData, reason } = body;

    if (!couponData?.code || !couponData?.type || !couponData?.value) {
      return NextResponse.json({ error: 'couponData.code, type, and value are required.' }, { status: 400 });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpHash = await hashOTP(otp);
    const otpExpiry = otpExpiryISO();

    // Create coupon request in Sanity
    const doc = await sanityWriteClient.create({
      _type: 'couponRequest',
      requestedByEmployeeId: session.employeeId,
      requestedByName: session.name,
      couponData,
      reason: reason || '',
      status: 'otp_sent',
      otpHash,
      otpExpiry,
      otpAttempts: 0,
      createdAt: new Date().toISOString(),
    });

    // Send OTP email to Super Admin
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (superAdminEmail) {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'noreply@dripngrid.in',
        to: superAdminEmail,
        subject: `[DRIPNGRID Admin] Coupon Request OTP — ${couponData.code}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #000;">Coupon Request Approval</h2>
            <p><strong>${session.name}</strong> (${session.employeeId}) has requested a new coupon:</p>
            <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Code</strong></td><td style="padding: 8px; border: 1px solid #eee;">${couponData.code}</td></tr>
              <tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Type</strong></td><td style="padding: 8px; border: 1px solid #eee;">${couponData.type === 'percent' ? `${couponData.value}% off` : `₹${couponData.value} off`}</td></tr>
              ${couponData.minOrder ? `<tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Min Order</strong></td><td style="padding: 8px; border: 1px solid #eee;">₹${couponData.minOrder}</td></tr>` : ''}
              ${couponData.maxUses ? `<tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Max Uses</strong></td><td style="padding: 8px; border: 1px solid #eee;">${couponData.maxUses}</td></tr>` : ''}
              ${reason ? `<tr><td style="padding: 8px; border: 1px solid #eee;"><strong>Reason</strong></td><td style="padding: 8px; border: 1px solid #eee;">${reason}</td></tr>` : ''}
            </table>
            <div style="background: #f9f9f9; padding: 24px; text-align: center; border-radius: 8px; margin: 24px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">Your approval OTP</p>
              <p style="font-size: 40px; font-weight: bold; letter-spacing: 8px; margin: 8px 0; color: #000;">${otp}</p>
              <p style="margin: 0; color: #999; font-size: 12px;">Expires in 5 minutes</p>
            </div>
            <p style="color: #666; font-size: 12px;">Request ID: ${doc._id}<br>If you did not expect this, ignore this email.</p>
          </div>
        `,
      });
    }

    logAction(session, {
      action: 'COUPON_REQUEST',
      entity: 'couponRequest',
      entityId: doc._id,
      details: `Code: ${couponData.code}, Type: ${couponData.type}, Value: ${couponData.value}`,
    });

    return NextResponse.json({ ok: true, requestId: doc._id });
  } catch (err) {
    console.error('[Coupon Request]', err);
    return NextResponse.json({ error: 'Failed to submit coupon request.' }, { status: 500 });
  }
}
