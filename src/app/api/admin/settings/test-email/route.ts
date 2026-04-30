import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sendAdminAccessEmail } from '@/lib/email';
import { sanityWriteClient } from '@/sanity/client';

/**
 * POST /api/admin/settings/test-email
 *
 * Sends a single test access email to verify the template design + delivery.
 * Only callable by super_admin. Fire once, check inbox, then confirm approval.
 */
export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Only Super Admin can send test emails.' }, { status: 403 });
  }

  const testPayload = {
    name: 'Adi',
    userId: 'DG-4821',
    tempPassword: 'Drip@2026!',
    email: 'thenexusadi@gmail.com',
  };

  const result = await sendAdminAccessEmail(testPayload);

  // Log in adminMail regardless of success
  try {
    await sanityWriteClient.create({
      _type: 'adminMail',
      subject: '[TEST] DRIPNGRID Access Mail',
      to: testPayload.email,
      toName: testPayload.name,
      from: 'noreply@dripngrid.in',
      fromName: 'DRIPNGRID',
      fromAlias: 'noreply',
      body: `[TEST] Access email sent to ${testPayload.email} with dummy credentials.`,
      sentAt: new Date().toISOString(),
      status: result.success ? 'sent' : 'failed',
      sentBy: session.employeeId,
      sentByName: session.name,
    });
  } catch (err) {
    console.error('[test-email] Failed to log:', err);
  }

  if (result.success) {
    return NextResponse.json({
      ok: true,
      message: `Test email delivered to ${testPayload.email}`,
      messageId: result.messageId,
    });
  }

  return NextResponse.json(
    { ok: false, error: 'Email send failed. Check RESEND_API_KEY env var.', detail: String(result.error) },
    { status: 500 }
  );
}
