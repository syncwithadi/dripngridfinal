import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'dripngrid-admin-secret-change-in-production-32chars'
);

const COOKIE_NAME = 'admin_token';
const TOKEN_EXPIRY = '8h';

export interface AdminTokenPayload {
  sub: string;           // Sanity document ID
  employeeId: string;
  name: string;
  role: 'super_admin' | 'admin' | 'employee';
  email: string;
  sv: number;            // sessionVersion — incremented on force logout
}

export async function signAdminToken(payload: AdminTokenPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function getAdminSessionFromRequest(req: NextRequest): Promise<AdminTokenPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export function adminCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 8,
  };
}

export function clearAdminCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };
}

export function canAccess(role: string, minRole: 'employee' | 'admin' | 'super_admin'): boolean {
  const hierarchy = { employee: 1, admin: 2, super_admin: 3 };
  return (hierarchy[role as keyof typeof hierarchy] || 0) >= hierarchy[minRole];
}
