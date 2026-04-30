import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionFromRequest } from '@/lib/admin/auth';
import { sanityClient } from '@/sanity/client';

/**
 * GET /api/admin/categories
 * Returns all categories from Sanity for use in dropdowns.
 * Auth: any authenticated admin role.
 */
export async function GET(req: NextRequest) {
  const session = await getAdminSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const categories = await sanityClient.fetch(
      `*[_type == "category"] | order(order asc, name asc){
        _id, name, slug
      }`,
      {}
    );
    return NextResponse.json({ categories: categories || [] });
  } catch (err) {
    console.error('[Admin Categories GET]', err);
    return NextResponse.json({ error: 'Failed to fetch categories.' }, { status: 500 });
  }
}
