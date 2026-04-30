import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityWriteClient } from '@/sanity/client';
import { logAndTriggerEvent } from '@/lib/admin/events';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { productId, productName } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: 'productId is required.' }, { status: 400 });
    }

    // Generate a secure token
    const token = crypto.randomBytes(32).toString('hex');
    
    // 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    await sanityWriteClient.create({
      _type: 'previewToken',
      token,
      product: { _type: 'reference', _ref: productId },
      expiresAt,
      generatedBy: session.email,
    });

    // Log the generation of the preview link
    await logAndTriggerEvent(session as any, {
      action: 'PREVIEW_LINK_GENERATE',
      entity: 'product',
      entityId: productId,
      details: 'Generated 5-minute preview link for hidden product: ' + (productName || productId)
    });

    // The frontend will receive this token and construct the URL
    return NextResponse.json({ token, expiresAt });
  } catch (err) {
    console.error('[Admin Preview Link POST]', err);
    return NextResponse.json({ error: 'Failed to generate preview link.' }, { status: 500 });
  }
}
// force-rebuild
// hard-rebuild-trigger
