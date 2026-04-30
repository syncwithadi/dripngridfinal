import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';
import bcrypt from 'bcryptjs';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'super_admin')) {
    return NextResponse.json({ error: 'Only Super Admin can update users.' }, { status: 403 });
  }

  const { id } = await params;

  // Prevent Super Admin from acting on their own account for destructive actions
  if (id === session.sub) {
    return NextResponse.json({ error: 'You cannot modify your own account here.' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const patch: Record<string, any> = {};
    const details: string[] = [];

    // ── Toggle active ────────────────────────────────────────────────────────
    if (body.active !== undefined) {
      patch.active = body.active;
      details.push(`active=${body.active}`);
      // Also force logout when disabling
      if (!body.active) {
        const { sanityClient } = await import('@/sanity/client');
        const user = await sanityClient.fetch(
          `*[_type == "adminUser" && _id == $id][0]{ sessionVersion }`,
          { id }
        );
        patch.sessionVersion = (user?.sessionVersion ?? 1) + 1;
        details.push('session invalidated');
      }
    }

    // ── Update role ──────────────────────────────────────────────────────────
    if (body.role) {
      patch.role = body.role;
      details.push(`role=${body.role}`);
    }

    // ── Update profile fields ────────────────────────────────────────────────
    if (body.name)             { patch.name          = body.name;          details.push(`name=${body.name}`); }
    if (body.email)            { patch.email         = body.email;         details.push(`email=${body.email}`); }
    if (body.department    !== undefined) { patch.department    = body.department;    details.push(`dept=${body.department}`); }
    if (body.internalTitle !== undefined) { patch.internalTitle = body.internalTitle; details.push(`title=${body.internalTitle}`); }
    if (body.phone         !== undefined) { patch.phone         = body.phone;         details.push(`phone=${body.phone}`); }

    // ── Reset password ───────────────────────────────────────────────────────
    if (body.tempPassword) {
      if (body.tempPassword.length < 6) {
        return NextResponse.json({ error: 'Temporary password must be at least 6 characters.' }, { status: 400 });
      }
      patch.passwordHash = await bcrypt.hash(body.tempPassword, 12);
      patch.mustChangePassword = true;
      details.push('password reset (must change on login)');
    }

    // ── Force logout ─────────────────────────────────────────────────────────
    if (body.forceLogout) {
      const { sanityClient } = await import('@/sanity/client');
      const user = await sanityClient.fetch(
        `*[_type == "adminUser" && _id == $id][0]{ sessionVersion }`,
        { id }
      );
      patch.sessionVersion = (user?.sessionVersion ?? 1) + 1;
      details.push('force logged out');
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 });
    }

    await sanityWriteClient.patch(id).set(patch).commit();

    const actionType = body.forceLogout
      ? 'USER_FORCE_LOGOUT'
      : body.tempPassword
      ? 'USER_PASSWORD_RESET'
      : body.active === false
      ? 'USER_DISABLE'
      : 'USER_UPDATE';

    logAction(session, {
      action: actionType,
      entity: 'adminUser',
      entityId: id,
      details: details.join(', '),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Admin User PATCH]', err);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}
