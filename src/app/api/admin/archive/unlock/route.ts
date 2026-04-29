import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { signArchiveToken, archiveCookieOptions, clearArchiveCookie, ARCHIVE_EXPIRY_MINUTES } from '@/lib/admin/archiveAccess';
import { sanityClient } from '@/sanity/client';
import bcrypt from 'bcryptjs';

/**
 * Archive Unlock API
 *
 * POST: Re-authenticate super admin to grant 10-minute archive access.
 * DELETE: Revoke archive access immediately.
 *
 * Security:
 *   - Must already have a valid admin session
 *   - Must be super_admin role
 *   - Must provide correct password for re-verification
 */

// POST: Unlock archive access
export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 });
  }

  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    // Fetch the admin user's hashed password from Sanity
    const adminUser = await sanityClient.fetch(
      `*[_type == "adminUser" && _id == $id][0]{ _id, passwordHash }`,
      { id: session.sub }
    );

    if (!adminUser?.passwordHash) {
      return NextResponse.json({ error: 'Admin user not found or password not set' }, { status: 404 });
    }

    // Verify password against the stored hash
    const valid = await bcrypt.compare(password, adminUser.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Issue archive access token (10 minutes)
    const token = await signArchiveToken(session.sub);

    const response = NextResponse.json({
      success: true,
      message: `Archive access granted for ${ARCHIVE_EXPIRY_MINUTES} minutes`,
      expiresIn: ARCHIVE_EXPIRY_MINUTES * 60,
    });

    response.cookies.set(archiveCookieOptions(token));
    return response;
  } catch (err) {
    console.error('[Archive Unlock]', err);
    return NextResponse.json({ error: 'Failed to unlock archive' }, { status: 500 });
  }
}

// DELETE: Revoke archive access
export async function DELETE(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, message: 'Archive access revoked' });
  response.cookies.set(clearArchiveCookie());
  return response;
}
