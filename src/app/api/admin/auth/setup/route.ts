/**
 * One-time setup route — creates the first Super Admin.
 * Disabled permanently once any adminUser document exists.
 *
 * POST /api/admin/auth/setup
 * Body: { secret, employeeId, password, name?, email? }
 */
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sanityClient, sanityWriteClient } from '@/sanity/client';

export async function POST(req: NextRequest) {
  try {
    const SETUP_SECRET = process.env.ADMIN_SETUP_SECRET;
    if (!SETUP_SECRET) {
      return NextResponse.json(
        { error: 'Setup is not enabled. Set ADMIN_SETUP_SECRET in environment variables.' },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Accept both 'secret' and 'setupSecret' field names
    const secret = body.secret ?? body.setupSecret ?? null;
    const { employeeId, password } = body;
    const name  = body.name  ?? employeeId ?? 'Super Admin';
    const email = body.email ?? `${(employeeId ?? 'admin').toLowerCase()}@dripngrid.in`;

    // Validate secret
    if (!secret || secret !== SETUP_SECRET) {
      return NextResponse.json({ error: 'Invalid or missing setup secret.' }, { status: 401 });
    }

    // Validate required fields
    if (!employeeId || !password) {
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, password.' },
        { status: 400 }
      );
    }

    // Block if any admin user already exists
    const existingCount = await sanityClient.fetch<number>(
      `count(*[_type == "adminUser"])`,
      {}
    );
    if (existingCount > 0) {
      return NextResponse.json(
        { error: 'Setup already completed. An admin user already exists.' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create Super Admin in Sanity
    const doc = await sanityWriteClient.create({
      _type: 'adminUser',
      employeeId,
      name,
      email,
      passwordHash,
      role: 'super_admin',
      active: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Super admin created successfully.',
      id: doc._id,
      employeeId,
    });
  } catch (err) {
    console.error('[Admin Setup]', err);
    return NextResponse.json({ error: 'Setup failed. Check server logs.' }, { status: 500 });
  }
}
