import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin routes (not /admin/login or /api/admin/auth/*)
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Allow the login page through
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // Allow auth API routes through (login, logout, setup)
  if (pathname.startsWith('/api/admin/auth/')) {
    return NextResponse.next();
  }

  // Verify session
  const session = await getAdminSessionFromRequest(req);

  if (!session) {
    const loginUrl = new URL('/admin/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Attach user info to request headers for API routes
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-admin-id', session.sub);
  requestHeaders.set('x-admin-employee-id', session.employeeId);
  requestHeaders.set('x-admin-name', session.name);
  requestHeaders.set('x-admin-role', session.role);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
