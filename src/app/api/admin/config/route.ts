import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';
import { invalidateConfigCache } from '@/lib/admin/config';

// ── GET /api/admin/config ─────────────────────────────────────────────────────
// Returns the current systemConfig. Accessible to all admin roles.
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }

  try {
    const config = await sanityClient.fetch(
      `*[_type == "systemConfig" && key == "main"][0]{
        visibleFrom, updatedAt, updatedBy
      }`,
      {}
    );
    return NextResponse.json({ config: config ?? null });
  } catch (err) {
    console.error('[Admin Config GET]', err);
    return NextResponse.json({ error: 'Failed to fetch config.' }, { status: 500 });
  }
}

// ── PATCH /api/admin/config ───────────────────────────────────────────────────
// Updates visibleFrom. Super Admin only.
export async function PATCH(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'super_admin')) {
    return NextResponse.json({ error: 'Only Super Admin can change system config.' }, { status: 403 });
  }

  try {
    const { visibleFrom } = await req.json();

    // Accept null/empty to clear the cutoff (show all data)
    const visibleFromValue = visibleFrom ? new Date(visibleFrom).toISOString() : null;

    // Upsert the singleton config document
    const existing = await sanityClient.fetch(
      `*[_type == "systemConfig" && key == "main"][0]._id`,
      {}
    );

    const patch = {
      key: 'main',
      visibleFrom: visibleFromValue,
      updatedAt: new Date().toISOString(),
      updatedBy: session.employeeId,
    };

    if (existing) {
      await sanityWriteClient.patch(existing).set(patch).commit();
    } else {
      await sanityWriteClient.create({ _type: 'systemConfig', ...patch });
    }

    // Invalidate the in-memory cache so next request picks up new value
    invalidateConfigCache();

    logAction(session, {
      action: 'SETTINGS_UPDATE',
      entity: 'systemConfig',
      entityId: 'main',
      details: `visibleFrom set to ${visibleFromValue ?? 'all time'}`,
    });

    return NextResponse.json({ ok: true, visibleFrom: visibleFromValue });
  } catch (err) {
    console.error('[Admin Config PATCH]', err);
    return NextResponse.json({ error: 'Failed to update config.' }, { status: 500 });
  }
}
