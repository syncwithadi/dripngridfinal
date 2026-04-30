import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) return NextResponse.json({ error: 'Admin+ only.' }, { status: 403 });

  const { id } = await params;
  try {
    await sanityWriteClient.delete(id);
    logAction(session, { action: 'RESOURCE_DELETE', entity: 'adminResource', entityId: id });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Resource DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete.' }, { status: 500 });
  }
}
