import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest, canAccess } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';
import { logAndTriggerEvent } from '@/lib/admin/events';

/**
 * POST /api/admin/products
 *
 * Publishes a product document directly to Sanity.
 * Auth: admin or super_admin only.
 *
 * Body: {
 *   name, categoryId, gender, priceINR, originalPriceINR?,
 *   badge?, sizes[], colors[], description?, material?,
 *   images: { front?, back?, left?, right?, detail? }  — each { assetId }
 *   sizeGuide?: { assetId }
 *   inStock?, isHidden?
 * }
 */
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    let filter = `_type == "product"`;
    const params: Record<string, string> = {};

    if (search) {
      filter += ` && name match $search`;
      params.search = `*${search}*`;
    }

    const products = await sanityClient.fetch(
      `*[${filter}] | order(_createdAt desc){
        _id, name, slug, priceINR, originalPriceINR, isHidden, badge, gender,
        "categoryId": category->_id,
        "category": category->name,
        "imageUrl": images.front.asset->url,
        sizes, colors, description, material,
        "images": {
          "front": { "url": images.front.asset->url, "_ref": images.front.asset._ref },
          "back": { "url": images.back.asset->url, "_ref": images.back.asset._ref },
          "left": { "url": images.left.asset->url, "_ref": images.left.asset._ref },
          "right": { "url": images.right.asset->url, "_ref": images.right.asset._ref },
          "detail": { "url": images.detail.asset->url, "_ref": images.detail.asset._ref }
        },
        "sizeGuide": { "url": sizeGuide.asset->url, "_ref": sizeGuide.asset._ref },
        inStock
      }`,
      params
    );

    return NextResponse.json({ products: products || [] });
  } catch (err) {
    console.error('[Admin Products GET]', err);
    return NextResponse.json({ error: 'Failed to fetch products.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) {
    return NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 });
  }

  try {
    const { 
      productId, name, categoryId, gender, priceINR, originalPriceINR, 
      badge, sizes, colors, description, material, images, sizeGuide, isHidden 
    } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: 'productId is required.' }, { status: 400 });
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (categoryId !== undefined) updates.category = { _type: 'reference', _ref: categoryId };
    if (gender !== undefined) updates.gender = gender;
    if (priceINR !== undefined) updates.priceINR = Number(priceINR);
    if (originalPriceINR !== undefined) updates.originalPriceINR = Number(originalPriceINR) || null;
    if (badge !== undefined) updates.badge = badge === 'none' ? null : badge;
    if (sizes !== undefined) updates.sizes = sizes;
    if (colors !== undefined) updates.colors = colors;
    if (description !== undefined) updates.description = description;
    if (material !== undefined) updates.material = material;
    if (images !== undefined) {
      const imagesObj: any = {};
      const slots = ['front', 'back', 'left', 'right', 'detail'];
      slots.forEach(slot => {
        if (images[slot] && images[slot].assetId) {
          imagesObj[slot] = { _type: 'image', asset: { _type: 'reference', _ref: images[slot].assetId } };
        }
      });
      updates.images = imagesObj;
    }
    if (sizeGuide !== undefined) {
      updates.sizeGuide = sizeGuide?.assetId 
        ? { _type: 'image', asset: { _type: 'reference', _ref: sizeGuide.assetId } }
        : null;
    }
    if (isHidden !== undefined) updates.isHidden = Boolean(isHidden);

    await sanityWriteClient.patch(productId).set(updates).commit();

    await logAndTriggerEvent(session, {
      action: 'PRODUCT_UPDATE',
      entity: 'product',
      entityId: productId,
      details: `Updated product ${productId}: ${JSON.stringify(updates)}`,
      ip: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Admin Products PATCH]', err);
    return NextResponse.json({ error: 'Failed to update product.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!canAccess(session.role, 'admin')) {
    return NextResponse.json({ error: 'Only Admin+ can publish products directly.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      name, categoryId, gender, priceINR, originalPriceINR,
      badge, sizes, colors, description, material,
      images, sizeGuide,
      inStock = true, isHidden = false,
    } = body;

    if (!name || !priceINR) {
      return NextResponse.json({ error: 'Product name and price are required.' }, { status: 400 });
    }

    // Build slug from name
    const slugCurrent = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Build images object — only include slots that have assetId
    const imagesObj: Record<string, any> = {};
    const slots = ['front', 'back', 'left', 'right', 'detail'] as const;
    for (const slot of slots) {
      const assetId = images?.[slot]?.assetId;
      if (assetId) {
        imagesObj[slot] = {
          _type: 'image',
          asset: { _type: 'reference', _ref: assetId },
        };
      }
    }

    // Size guide
    const sizeGuideObj = sizeGuide?.assetId
      ? { _type: 'image', asset: { _type: 'reference', _ref: sizeGuide.assetId } }
      : undefined;

    // Category reference
    const categoryRef = categoryId
      ? { _type: 'reference', _ref: categoryId }
      : undefined;

    const doc = await sanityWriteClient.create({
      _type: 'product',
      name,
      slug: { _type: 'slug', current: slugCurrent },
      priceINR: Number(priceINR),
      ...(originalPriceINR ? { originalPriceINR: Number(originalPriceINR) } : {}),
      ...(categoryRef ? { category: categoryRef } : {}),
      gender: gender || 'Unisex',
      ...(badge ? { badge } : {}),
      sizes: sizes || [],
      colors: colors || [],
      ...(description ? { description } : {}),
      ...(material ? { material } : {}),
      images: imagesObj,
      ...(sizeGuideObj ? { sizeGuide: sizeGuideObj } : {}),
      inStock,
      isHidden,
      salesCount: 0,
    });

    logAction(session, {
      action: 'PRODUCT_PUBLISH',
      entity: 'product',
      entityId: doc._id,
      details: `Published product: ${name}`,
    });

    return NextResponse.json({ ok: true, id: doc._id, slug: slugCurrent });
  } catch (err: any) {
    console.error('[Admin Products POST]', err);
    return NextResponse.json({ error: err.message || 'Failed to publish product.' }, { status: 500 });
  }
}
