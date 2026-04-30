import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }

  try {
    // Role restriction: admin can only see employees (not super_admin or other admins)
    const roleFilter =
      session.role === 'super_admin'
        ? ``
        : ` && role == "employee"`;

    const users = await sanityClient.fetch(
      `*[_type == "adminUser"${roleFilter}] | order(createdAt desc){
        _id, employeeId, name, email, role, active, mustChangePassword, lastLogin, lastActivityAt, createdAt,
        department, internalTitle, phone,
        "profileImageUrl": profileImage.asset->url
      }`,
      {}
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
    const { employeeId, name, email, role, tempPassword } = await req.json();

    if (!employeeId || !name || !email || !role || !tempPassword) {
      return NextResponse.json({ error: 'All fields required.' }, { status: 400 });
    }

    const existing = await sanityClient.fetch(
      `*[_type == "adminUser" && employeeId == $empId][0]._id`,
      { empId: employeeId }
    );
    if (existing) {
      return NextResponse.json({ error: 'Employee ID already exists.' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const doc = await sanityWriteClient.create({
      _type: 'adminUser',
      employeeId, name, email, role,
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

    return NextResponse.json({ ok: true, id: doc._id });
  } catch (err) {
    console.error('[Admin Users POST]', err);
    return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
  }
}
