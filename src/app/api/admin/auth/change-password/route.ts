import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both currentPassword and newPassword are required.' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters.' }, { status: 400 });
    }

    const { sanityClient } = await import('@/sanity/client');
    const user = await sanityClient.fetch(
      `*[_type == "adminUser" && _id == $id][0]{ passwordHash }`,
      { id: session.sub }
    );

    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await sanityWriteClient
      .patch(session.sub)
      .set({ passwordHash: newHash, mustChangePassword: false })
      .commit();

    logAction(session, { action: 'PASSWORD_CHANGE', entity: 'adminUser', entityId: session.sub });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Change Password]', err);
    return NextResponse.json({ error: 'Failed to change password.' }, { status: 500 });
  }
}
