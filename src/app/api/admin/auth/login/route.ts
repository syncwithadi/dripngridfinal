import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { signAdminToken, adminCookieOptions } from '@/lib/admin/auth';
import { logAction } from '@/lib/admin/logger';

// ── IP-based rate limiting ────────────────────────────────────────────────────
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitEntry { attempts: number; lockedUntil: number | null; }
const rateLimitMap = new Map<string, RateLimitEntry>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { blocked: boolean; remainingMs?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry) return { blocked: false };
  if (entry.lockedUntil && now < entry.lockedUntil) {
    return { blocked: true, remainingMs: entry.lockedUntil - now };
  }
  // Lockout expired — reset
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    rateLimitMap.delete(ip);
  }
  return { blocked: false };
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { attempts: 0, lockedUntil: null };
  entry.attempts += 1;
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_MS;
  }
  rateLimitMap.set(ip, entry);
}

function clearRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { blocked, remainingMs } = checkRateLimit(ip);
  if (blocked) {
    const minutes = Math.ceil((remainingMs || LOCKOUT_MS) / 60000);
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` },
      { status: 429 }
    );
  }

  try {
    const { employeeId, password } = await req.json();

    if (!employeeId || !password) {
      return NextResponse.json({ error: 'ID and password are required.' }, { status: 400 });
    }

    const user = await sanityClient.fetch(
      `*[_type == "adminUser" && employeeId == $employeeId && active == true][0]{
        _id, employeeId, name, email, role, passwordHash,
        mustChangePassword, active, sessionVersion
      }`,
      { employeeId }
    );

    if (!user) {
      recordFailedAttempt(ip);
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Account not set up. Contact your administrator.' }, { status: 401 });
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      recordFailedAttempt(ip);
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    // Successful auth — clear rate limit for this IP
    clearRateLimit(ip);

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

    // Update last login + clear idle flag + store IP
    await sanityWriteClient
      .patch(user._id)
      .set({ lastLogin: loginTime, lastActivityAt: loginTime, isCurrentlyIdle: false, lastLoginIP: ip })
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
