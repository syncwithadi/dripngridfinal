import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';
import { logAndTriggerEvent } from '@/lib/admin/events';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  try {
    const existing = await sanityClient.fetch(
      `*[_type == "productRequest" && _id == $id][0]{
        status, submittedBy, title, description, category, categoryId, gender,
        price, comparePrice, badge, sizes, colors, material, imageAssetsJson
      }`,
      { id }
    );
    if (!existing) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const patch: Record<string, any> = {};

    // Allow updating core fields (own draft or admin)
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.category !== undefined) patch.category = body.category;
    if (body.categoryId !== undefined) patch.categoryId = body.categoryId;
    if (body.gender !== undefined) patch.gender = body.gender;
    if (body.price !== undefined) patch.price = body.price ? Number(body.price) : null;
    if (body.comparePrice !== undefined) patch.comparePrice = body.comparePrice ? Number(body.comparePrice) : null;
    if (body.badge !== undefined) patch.badge = body.badge;
    if (body.sizes !== undefined) patch.sizes = body.sizes;
    if (body.colors !== undefined) patch.colors = body.colors;
    if (body.material !== undefined) patch.material = body.material;
    if (body.imageAssetsJson !== undefined) patch.imageAssetsJson = body.imageAssetsJson;
    if (body.internalNotes !== undefined) patch.internalNotes = body.internalNotes;

    // Submit for review
    if (body.submitForReview) {
      if (existing.submittedBy !== session.employeeId && !canAccess(session.role, 'admin')) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
      patch.status = 'pending';
      patch.submittedAt = new Date().toISOString();
    }

    // Admin/super_admin: approve or reject
    if (body.status === 'approved' || body.status === 'rejected') {
      if (!canAccess(session.role, 'admin')) {
        return NextResponse.json({ error: 'Only Admin+ can review requests.' }, { status: 403 });
      }
      patch.status = body.status;
      patch.reviewedBy = session.employeeId;
      patch.reviewedAt = new Date().toISOString();
      patch.reviewNote = body.reviewNote || null;

      // If approved and publishAsProduct=true, create the real product document
      if (body.status === 'approved' && body.publishAsProduct) {
        const src = { ...existing, ...patch };
        const imageAssets = src.imageAssetsJson ? JSON.parse(src.imageAssetsJson) : {};

        const imagesObj: Record<string, any> = {};
        for (const slot of ['front', 'back', 'left', 'right', 'detail'] as const) {
          const assetId = imageAssets[slot]?.assetId;
          if (assetId) {
            imagesObj[slot] = { _type: 'image', asset: { _type: 'reference', _ref: assetId } };
          }
        }

        const sizeGuideAssetId = imageAssets.sizeGuide?.assetId;
        const slugCurrent = (src.title || 'product')
          .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const productDoc: any = {
          _type: 'product',
          name: src.title,
          slug: { _type: 'slug', current: slugCurrent },
          priceINR: Number(src.price || 0),
          gender: src.gender || 'Unisex',
          sizes: src.sizes || [],
          colors: src.colors || [],
          images: imagesObj,
          inStock: true,
          isHidden: false,
          salesCount: 0,
        };
        if (src.comparePrice) productDoc.originalPriceINR = Number(src.comparePrice);
        if (src.categoryId) productDoc.category = { _type: 'reference', _ref: src.categoryId };
        if (src.badge) productDoc.badge = src.badge;
        if (src.description) productDoc.description = src.description;
        if (src.material) productDoc.material = src.material;
        if (sizeGuideAssetId) productDoc.sizeGuide = { _type: 'image', asset: { _type: 'reference', _ref: sizeGuideAssetId } };

        const productCreated = await sanityWriteClient.create(productDoc);
        patch.publishedProductId = productCreated._id;

        logAction(session, {
          action: 'PRODUCT_PUBLISH',
          entity: 'product',
          entityId: productCreated._id,
          details: `Published from request: ${src.title}`,
        });
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    await sanityWriteClient.patch(id).set(patch).commit();

    // ── Fire event + notification ──────────────────────────────────────────
    const isApprove = body.status === 'approved';
    const isReject  = body.status === 'rejected';

    if ((isApprove || isReject) && existing.submittedBy) {
      // Fetch the submitter title for notification
      const requestTitle = existing.title || 'Your product request';
      logAndTriggerEvent(session, {
        action: isApprove ? 'PRODUCT_REQUEST_APPROVE' : 'PRODUCT_REQUEST_REJECT',
        entity: 'productRequest', entityId: id,
        details: patch.status ? `Status → ${patch.status}` : 'Updated draft',
        notify: {
          recipientId: existing.submittedBy,
          type: isApprove ? 'product_approved' : 'product_rejected',
          title: isApprove
            ? `✅ Product request approved`
            : `❌ Product request rejected`,
          message: isApprove
            ? `"${requestTitle}" was approved by ${session.name}.${body.publishAsProduct ? ' It has been published as a live product.' : ''}`
            : `"${requestTitle}" was rejected by ${session.name}.${body.reviewNote ? ` Note: ${body.reviewNote}` : ''}`,
          link: '/admin/product-requests',
        },
      }).catch(() => {});
    } else {
      logAction(session, {
        action: 'PRODUCT_REQUEST_UPDATE',
        entity: 'productRequest', entityId: id,
        details: patch.status ? `Status → ${patch.status}` : 'Updated draft',
      });
    }

    return NextResponse.json({ ok: true, publishedProductId: patch.publishedProductId });
  } catch (err) {
    console.error('[ProductRequest PATCH]', err);
    return NextResponse.json({ error: 'Failed to update.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) {
    return NextResponse.json({ error: 'Only Admin+ can delete requests.' }, { status: 403 });
  }

  const { id } = await params;
  try {
    await sanityWriteClient.delete(id);
    logAction(session, {
      action: 'PRODUCT_REQUEST_DELETE',
      entity: 'productRequest', entityId: id,
      details: 'Deleted product request',
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[ProductRequest DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete.' }, { status: 500 });
  }
}
