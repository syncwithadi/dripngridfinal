import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { signAdminToken, adminCookieOptions } from '@/lib/admin/auth';
import { logAction } from '@/lib/admin/logger';

export async function POST(req: NextRequest) {
  try {
    const { employeeId, password } = await req.json();

    if (!employeeId || !password) {
      return NextResponse.json({ error: 'Employee ID and password are required.' }, { status: 400 });
    }

    const user = await sanityClient.fetch(
      `*[_type == "adminUser" && employeeId == $employeeId && active == true][0]{
        _id, employeeId, name, email, role, passwordHash,
        mustChangePassword, active, sessionVersion
      }`,
      { employeeId }
    );

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Account not set up. Contact your administrator.' }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // Use existing sessionVersion or default to 1
    const sv = user.sessionVersion ?? 1;

    const token = await signAdminToken({
      sub: user._id,
      employeeId: user.employeeId,
      name: user.name,
      role: user.role,
      email: user.email,
      sv,
    });

    const loginTime = new Date().toISOString();

    // Update last login + clear idle flag
    await sanityWriteClient
      .patch(user._id)
      .set({ lastLogin: loginTime, lastActivityAt: loginTime, isCurrentlyIdle: false })
      .commit();

    // Create a new adminSession document for activity tracking
    // Fire-and-forget — don't block the login response
    sanityWriteClient.create({
      _type: 'adminSession',
      sessionToken: `${user._id}_${Date.now()}`,
      adminUserId: user._id,
      employeeId: user.employeeId,
      employeeName: user.name,
      role: user.role,
      loginTime,
      lastActivityAt: loginTime,
      totalActiveSeconds: 0,
      totalIdleSeconds: 0,
      ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
    }).catch((e: Error) => console.error('[AdminSession Create]', e));

    const response = NextResponse.json({
      ok: true,
      mustChangePassword: user.mustChangePassword || false,
      user: { employeeId: user.employeeId, name: user.name, role: user.role, email: user.email },
    });

    response.cookies.set(adminCookieOptions(token));

    logAction(
      { sub: user._id, employeeId: user.employeeId, name: user.name, role: user.role, email: user.email, sv },
      { action: 'LOGIN', entity: 'adminUser', entityId: user._id, ip: req.headers.get('x-forwarded-for') || 'unknown' }
    );

    return response;
  } catch (err) {
    console.error('[Admin Login]', err);
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
