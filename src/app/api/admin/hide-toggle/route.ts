import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';

/**
 * Hide/Unhide Toggle API
 *
 * POST: Toggle the visibility field on any document (order, user, etc.)
 *
 * Security: Super admin only.
 * This controls whether admin/employee can see specific documents.
 */
export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden — super admin only' }, { status: 403 });
  }

  try {
    const { documentId, visibility } = await req.json();

    if (!documentId || !visibility) {
      return NextResponse.json({ error: 'documentId and visibility are required' }, { status: 400 });
    }

    if (!['public', 'hidden'].includes(visibility)) {
      return NextResponse.json({ error: 'visibility must be "public" or "hidden"' }, { status: 400 });
    }

    // Verify document exists
    const doc = await sanityWriteClient.fetch(
      `*[_id == $id][0]{ _id, _type }`,
      { id: documentId }
    );

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Update visibility
    await sanityWriteClient
      .patch(documentId)
      .set({ visibility })
      .commit();

    // Log the action
    logAction(session, {
      action: visibility === 'hidden' ? 'HIDE_DOCUMENT' : 'UNHIDE_DOCUMENT',
      entity: doc._type,
      entityId: documentId,
      details: JSON.stringify({ visibility }),
    });

    return NextResponse.json({
      success: true,
      documentId,
      visibility,
      message: `Document ${visibility === 'hidden' ? 'hidden' : 'made public'}`,
    });
  } catch (err) {
    console.error('[Hide Toggle]', err);
    return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
  }
}
