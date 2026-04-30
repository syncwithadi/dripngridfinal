import { NextRequest, NextResponse } from 'next/server';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAndTriggerEvent } from '@/lib/admin/events';

export async function POST(req: NextRequest) {
  try {
    const { token, action } = await req.json();

    if (!token || !action) {
      return NextResponse.json({ error: 'Missing token or action' }, { status: 400 });
    }

    // Validate the token to find out who generated it and what product it is
    const tokenDoc = await sanityClient.fetch(
        `*[_type == "previewToken" && token == $token][0]{
            expiresAt,
            generatedBy,
            "productName": product->name
        }`,
        { token }
    );

    if (!tokenDoc) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Log the interaction using the adminLog system
    await logAndTriggerEvent(
      { email: tokenDoc.generatedBy || 'system', name: 'System', role: 'system' } as any,
      {
        action: 'PREVIEW_INTERACT', 
        details: 'Preview Interaction: ' + action + ' on product "' + tokenDoc.productName + '"'
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Admin Preview Log POST]', err);
    return NextResponse.json({ error: 'Failed to log preview action.' }, { status: 500 });
  }
}
