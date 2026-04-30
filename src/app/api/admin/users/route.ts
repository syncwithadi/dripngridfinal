import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';
import { sendAdminAccessEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const roleFilter = ``;

    const users = await sanityClient.fetch(
      `*[_type == "adminUser"${roleFilter}] | order(createdAt desc){
        _id, employeeId, name, email, role, active, mustChangePassword, lastLogin, lastActivityAt, createdAt,
        department, internalTitle, phone,
        "profileImageUrl": profileImage.asset->url
      }`,
      {},
      { cache: 'no-store' }
    );
    return NextResponse.json({ users: users || [] });
  } catch (err) {
    console.error('[Admin Users GET]', err);
    return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'super_admin')) {
    return NextResponse.json({ error: 'Only Super Admin can create users.' }, { status: 403 });
  }

  try {
    const { employeeId, name, email, role, tempPassword, department, internalTitle, phone } = await req.json();

    if (!employeeId || !name || !email || !role || !tempPassword) {
      return NextResponse.json({ error: 'All required fields must be filled.' }, { status: 400 });
    }

    const existing = await sanityClient.fetch(
      `*[_type == "adminUser" && employeeId == $empId][0]._id`,
      { empId: employeeId }
    );
    if (existing) {
      return NextResponse.json({ error: 'ID already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const doc = await sanityWriteClient.create({
      _type: 'adminUser',
      employeeId, name, email, role,
      department: department || null,
      internalTitle: internalTitle || null,
      phone: phone || null,
      passwordHash,
      active: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    });

    logAction(session, {
      action: 'USER_CREATE',
      entity: 'adminUser',
      entityId: doc._id,
      details: `Created ${role}: ${name} (${employeeId})`,
    });

    // Send welcome email with credentials (fire-and-forget — never blocks the response)
    sendAdminAccessEmail({
      name,
      userId: employeeId,
      tempPassword,
      email,
    }).then(async (emailResult) => {
      // Log email delivery event to adminMail
      try {
        await sanityWriteClient.create({
          _type: 'adminMail',
          subject: 'DRIPNGRID — Your Access Is Ready',
          to: email,
          toName: name,
          from: 'noreply@dripngrid.in',
          fromName: 'DRIPNGRID',
          fromAlias: 'noreply',
          body: `Access credentials sent to ${name} (${employeeId})`,
          sentAt: new Date().toISOString(),
          status: emailResult.success ? 'sent' : 'failed',
          sentBy: session.employeeId,
          sentByName: session.name,
        });
      } catch (logErr) {
        console.error('[USER_CREATE] Failed to log access email:', logErr);
      }
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('[Admin Users POST]', err);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
