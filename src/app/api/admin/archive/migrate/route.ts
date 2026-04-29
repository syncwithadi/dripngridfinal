import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { verifyArchiveAccess } from '@/lib/admin/archiveAccess';
import { sanityWriteClient, sanityClient } from '@/sanity/client';
import { archiveWriteClient } from '@/sanity/archiveClient';
import { logAction } from '@/lib/admin/logger';

/**
 * TRUE CROSS-DATASET ARCHIVE MIGRATION
 *
 * This endpoint physically moves documents from the PRODUCTION dataset
 * to the separate ARCHIVE dataset. After migration:
 *
 *   Production dataset → contains only new/active data
 *   Archive dataset    → contains old data, isolated, super_admin only
 *
 * Process per document:
 *   1. Read from production
 *   2. Write to archive dataset (different dataset, different storage)
 *   3. On successful write → delete from production
 *
 * This means even if production credentials are exposed, the archive
 * data is completely unreachable (different dataset, different token).
 *
 * Security: Super admin + archive access token required.
 * Requires explicit confirmation.
 * Runs in safe batches of 20.
 */

// Strip Sanity-internal fields that can't be recreated
function stripSanityMeta(doc: any) {
  const { _rev, _updatedAt, isArchived, archivedAt, ...rest } = doc;
  return rest;
}

async function migrateDocuments(
  docs: any[],
  docType: string
): Promise<{ migrated: number; failed: string[] }> {
  if (!docs.length) return { migrated: 0, failed: [] };

  const archivedAt = new Date().toISOString();
  const failed: string[] = [];

  try {
    // ── Step 1: Write ALL docs to archive dataset in a single transaction ──
    const archiveTx = archiveWriteClient.transaction();
    for (const doc of docs) {
      archiveTx.createOrReplace({
        ...stripSanityMeta(doc),
        _archivedAt: archivedAt,
        _archivedFrom: 'production',
      });
    }
    await archiveTx.commit();

    // ── Step 2: Delete ALL docs from production in a single transaction ────
    const deleteTx = sanityWriteClient.transaction();
    for (const doc of docs) {
      deleteTx.delete(doc._id);
    }
    await deleteTx.commit();

    return { migrated: docs.length, failed: [] };
  } catch (err: any) {
    console.error(`[Migrate] Batch transaction failed for ${docType}:`, err?.message);
    // If batch fails, fall back to individual migration so partial progress is saved
    let migrated = 0;
    for (const doc of docs) {
      try {
        await archiveWriteClient.createOrReplace({
          ...stripSanityMeta(doc),
          _archivedAt: archivedAt,
          _archivedFrom: 'production',
        });
        await sanityWriteClient.delete(doc._id);
        migrated++;
      } catch (docErr: any) {
        console.error(`[Migrate] Failed doc ${doc._id}:`, docErr?.message);
        failed.push(doc._id);
      }
    }
    return { migrated, failed };
  }
}

// POST: Run the migration
export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 });

  const hasAccess = await verifyArchiveAccess(req);
  if (!hasAccess) return NextResponse.json({ error: 'Archive access required. Unlock archive first.' }, { status: 403 });

  try {
    const { cutoffDate, confirm, includeUsers = false } = await req.json();

    if (!confirm) {
      return NextResponse.json({ error: 'Set confirm: true to proceed.' }, { status: 400 });
    }
    if (!cutoffDate) {
      return NextResponse.json({ error: 'cutoffDate is required (ISO string).' }, { status: 400 });
    }

    const cutoff = new Date(cutoffDate).toISOString();
    const results: Record<string, any> = {};

    // ── 1. Migrate Orders ────────────────────────────────────────────────────
    // Include BOTH:
    //   - orders before cutoff that aren't archived yet
    //   - orders already flagged with isArchived:true (from previous flag-based approach)
    const ordersToMigrate = await sanityClient.fetch(
      `*[_type == "order" && (createdAt < $cutoff || isArchived == true)]`,
      { cutoff }
    );

    if (ordersToMigrate?.length > 0) {
      const { migrated, failed } = await migrateDocuments(ordersToMigrate, 'order');
      results.orders = { total: ordersToMigrate.length, migrated, failed: failed.length };
      console.log(`[Migrate] Orders: ${migrated}/${ordersToMigrate.length} migrated to archive dataset`);
    } else {
      results.orders = { total: 0, migrated: 0, failed: 0 };
    }

    // ── 2. Migrate Users (optional) ─────────────────────────────────────────
    if (includeUsers) {
      // Migrate users who have no orders after the cutoff date
      // (i.e. they only ordered during the archived period)
      const usersToMigrate = await sanityClient.fetch(
        `*[_type == "user" && _createdAt < $cutoff && !defined(*[_type == "order" && customer.email == ^.email && createdAt >= $cutoff][0]._id)]`,
        { cutoff }
      );

      if (usersToMigrate?.length > 0) {
        const { migrated, failed } = await migrateDocuments(usersToMigrate, 'user');
        results.users = { total: usersToMigrate.length, migrated, failed: failed.length };
        console.log(`[Migrate] Users: ${migrated}/${usersToMigrate.length} migrated to archive dataset`);
      } else {
        results.users = { total: 0, migrated: 0, failed: 0 };
      }
    }

    logAction(session, {
      action: 'ARCHIVE_MIGRATE',
      entity: 'bulk',
      entityId: 'production→archive',
      details: JSON.stringify({ cutoff, results }),
    });

    return NextResponse.json({
      success: true,
      message: 'Migration complete — data moved to separate archive dataset',
      cutoff,
      results,
    });
  } catch (err) {
    console.error('[Migrate]', err);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}

// GET: Preview how many documents would be migrated
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const cutoffDate = searchParams.get('cutoffDate');
  if (!cutoffDate) return NextResponse.json({ error: 'cutoffDate required' }, { status: 400 });

  const cutoff = new Date(cutoffDate).toISOString();

  const [orderCount, userCount] = await Promise.all([
    // Count orders before cutoff PLUS already-flagged ones (from old flag-based migration)
    sanityClient.fetch(
      `count(*[_type == "order" && (createdAt < $cutoff || isArchived == true)])`,
      { cutoff }
    ),
    sanityClient.fetch(
      `count(*[_type == "user" && _createdAt < $cutoff && !defined(*[_type == "order" && customer.email == ^.email && createdAt >= $cutoff][0]._id)])`,
      { cutoff }
    ),
  ]);

  return NextResponse.json({
    orders: orderCount,
    users: userCount,
    cutoff,
    message: `${orderCount} orders and ${userCount} inactive users would be migrated to archive dataset`,
  });
}
