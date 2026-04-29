import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient, sanityWriteClient } from '@/sanity/client';
import { logAction } from '@/lib/admin/logger';

export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const lowStock = searchParams.get('lowStock') === 'true';
    const search = searchParams.get('search') || '';

    let filter = `_type == "product" && isHidden != true`;
    const params: Record<string, string> = {};

    if (search) {
      filter += ` && name match $search`;
      params.search = `*${search}*`;
    }

    const products = await sanityClient.fetch(
      `*[${filter}] | order(name asc){
        _id, name, slug, priceINR,
        "category": category->name,
        sizes, inStock
      }`,
      params
    );

    let result = products || [];
    if (lowStock) {
      result = result.filter((p: any) =>
        (p.sizes || []).some((s: any) => (s.stock ?? 0) <= 5)
      );
    }

    return NextResponse.json({ products: result });
  } catch (err) {
    console.error('[Admin Inventory GET]', err);
    return NextResponse.json({ error: 'Failed to fetch inventory.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { productId, sizes } = await req.json();

    if (!productId || !Array.isArray(sizes)) {
      return NextResponse.json({ error: 'productId and sizes[] are required.' }, { status: 400 });
    }

    await sanityWriteClient.patch(productId).set({ sizes }).commit();

    logAction(session, {
      action: 'INVENTORY_UPDATE',
      entity: 'product',
      entityId: productId,
      details: `Updated sizes: ${JSON.stringify(sizes)}`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Admin Inventory PATCH]', err);
    return NextResponse.json({ error: 'Failed to update inventory.' }, { status: 500 });
  }
}
