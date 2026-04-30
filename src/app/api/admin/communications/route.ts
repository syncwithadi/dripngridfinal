import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { sendAdminEmail, AdminEmailFrom } from '@/lib/email';

/**
 * GET  /api/admin/communications — fetch mail history (most recent 80)
 * POST /api/admin/communications — send email via Resend + log to Sanity
 */

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const filter = session.role === 'employee' ? ` && sentBy == "${session.employeeId}"` : ``;
    const mails = await sanityClient.fetch(
      `*[_type == "adminMail"${filter}] | order(sentAt desc) [0...80] {
        _id, subject, to, toName, from, fromName, fromAlias, body, sentAt, status, sentByName
      }`,
      {}
    );
    return NextResponse.json({ mails: mails || [] });
  } catch (err) {
    console.error('[Communications GET]', err);
    return NextResponse.json({ error: 'Failed to fetch mail history.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { to, toName, subject, body, fromAlias } = await req.json();

    // Input validation
    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'to, subject, and body are required.' }, { status: 400 });
    }
    if (!to.includes('@')) {
      return NextResponse.json({ error: 'Invalid recipient email address.' }, { status: 400 });
    }
    if (subject.length > 200) {
      return NextResponse.json({ error: 'Subject too long (max 200 chars).' }, { status: 400 });
    }

    // Fetch sender details from DB
    const sender = await sanityClient.fetch(
      `*[_type == "adminUser" && employeeId == $id][0]{ name, email }`,
      { id: session.employeeId }
    );

    const senderName = sender?.name || session.employeeId;
    const alias: AdminEmailFrom = (fromAlias as AdminEmailFrom) || 'admin';

    // Build clean HTML body
    const html = `
      <div style="font-family:Inter,system-ui,sans-serif;line-height:1.65;color:#1a1a1a;max-width:600px;margin:0 auto">
        <div style="border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px">
          <strong style="font-size:18px;letter-spacing:0.08em">DRIPNGRID</strong>
          <span style="font-size:11px;color:#666;margin-left:10px;text-transform:uppercase;letter-spacing:0.1em">Internal</span>
        </div>
        <p style="font-size:12px;color:#666;margin-bottom:20px">
          From: <strong>${senderName}</strong> via DRIPNGRID Admin
        </p>
        <div style="font-size:15px;white-space:pre-wrap;line-height:1.7">${body.replace(/\n/g, '<br/>')}</div>
        <hr style="margin:32px 0;border:none;border-top:1px solid #eee"/>
        <p style="font-size:11px;color:#aaa">
          DRIPNGRID Internal Communications &middot; ${new Date().getFullYear()}<br/>
          This is an internal message. Do not forward outside the organisation.
        </p>
      </div>
    `;

    // Send via Resend
    const emailResult = await sendAdminEmail({ to, subject, html, from: alias });
    const sendStatus = emailResult.success ? 'sent' : 'failed';

    if (!emailResult.success) {
      console.error('[Communications] Resend failed:', emailResult.error);
    }

    // Always log to Sanity (even on send failure)
    const doc = await sanityWriteClient.create({
      _type: 'adminMail',
      subject,
      to,
      toName: toName || to,
      from: sender?.email || session.employeeId,
      fromName: senderName,
      fromAlias: alias,
      body,
      sentAt: new Date().toISOString(),
      status: sendStatus,
      sentBy: session.employeeId,
      sentByName: senderName,
    });

    return NextResponse.json({
      success: true,
      status: sendStatus,
      id: doc._id,
      ...(emailResult.success && 'messageId' in emailResult
        ? { messageId: emailResult.messageId }
        : {}),
    });
  } catch (err) {
    console.error('[Communications POST]', err);
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
  }
}
