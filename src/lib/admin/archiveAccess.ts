/**
 * Archive Access Control
 *
 * Manages temporary archive access for super admins.
 * Access is granted after re-authentication and expires after 10 minutes.
 *
 * Security model:
 *   - Only super_admin role can request access
 *   - Access is stored as a signed JWT with a 10-minute expiry
 *   - The token is stored in an httpOnly cookie separate from the admin session
 *   - Every archive API endpoint must call verifyArchiveAccess() before serving data
 */

import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const ARCHIVE_SECRET = new TextEncoder().encode(
  process.env.ARCHIVE_JWT_SECRET || process.env.ADMIN_JWT_SECRET || 'archive-access-secret-32chars-min'
);

const ARCHIVE_COOKIE = 'archive_access';
const ARCHIVE_EXPIRY_MINUTES = 10;

interface ArchiveTokenPayload {
  sub: string;       // admin user document ID
  role: 'super_admin';
  purpose: 'archive_access';
}

/** Issue a 10-minute archive access token */
export async function signArchiveToken(adminId: string): Promise<string> {
  return await new SignJWT({
    sub: adminId,
    role: 'super_admin' as const,
    purpose: 'archive_access' as const,
  } satisfies ArchiveTokenPayload as ArchiveTokenPayload & Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ARCHIVE_EXPIRY_MINUTES}m`)
    .sign(ARCHIVE_SECRET);
}

/** Verify that a request has valid, unexpired archive access */
export async function verifyArchiveAccess(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ARCHIVE_COOKIE)?.value;
  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, ARCHIVE_SECRET);
    const p = payload as unknown as ArchiveTokenPayload;
    return p.purpose === 'archive_access' && p.role === 'super_admin';
  } catch {
    return false;
  }
}

/** Cookie options for the archive access token */
export function archiveCookieOptions(token: string) {
  return {
    name: ARCHIVE_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: ARCHIVE_EXPIRY_MINUTES * 60,
  };
}

/** Clear the archive access cookie */
export function clearArchiveCookie() {
  return {
    name: ARCHIVE_COOKIE,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}

export { ARCHIVE_COOKIE, ARCHIVE_EXPIRY_MINUTES };
