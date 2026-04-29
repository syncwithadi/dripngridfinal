/**
 * Hidden Data Filter
 *
 * Generates a GROQ clause to exclude documents with visibility == "hidden"
 * for non-super_admin users.
 *
 * Usage in API routes:
 *   const hiddenClause = getHiddenFilter(session.role);
 *   const query = `*[_type == "order"${hiddenClause}]`;
 *
 * Super admins see everything. Admin/employee see only public documents.
 * Documents without a visibility field are treated as "public" (backward-compatible).
 */

export function getHiddenFilter(role: string): string {
  if (role === 'super_admin') return '';
  // Exclude hidden documents; treat missing visibility as "public"
  return ` && (visibility == "public" || !defined(visibility))`;
}
