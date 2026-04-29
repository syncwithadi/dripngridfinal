/**
 * Fetches the global systemConfig from Sanity and caches it for 60 seconds.
 * Returns the visibleFrom ISO string, or null if not set (= all data visible).
 *
 * Super Admin callers should pass the role and skip cutoff application.
 * This helper is only for API layer enforcement — never rely solely on the frontend.
 */

import { sanityClient } from '@/sanity/client';

interface SystemConfig {
  visibleFrom: string | null;
}

// Module-level cache: avoids hammering Sanity on every request
let cached: SystemConfig | null = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

export async function getSystemConfig(): Promise<SystemConfig> {
  const now = Date.now();
  if (cached && now < cacheExpiry) return cached;

  try {
    const doc = await sanityClient.fetch(
      `*[_type == "systemConfig" && key == "main"][0]{ visibleFrom }`,
      {}
    );
    cached = { visibleFrom: doc?.visibleFrom ?? null };
  } catch {
    // On Sanity error keep previous cache or default to no filter
    cached = cached ?? { visibleFrom: null };
  }

  cacheExpiry = Date.now() + CACHE_TTL_MS;
  return cached;
}

/** Invalidate the in-memory cache (call after an admin updates the config) */
export function invalidateConfigCache() {
  cached = null;
  cacheExpiry = 0;
}

/**
 * Returns the GROQ condition string and params to enforce the cutoff.
 * For super_admin: returns an empty string (no filter).
 * For admin/employee: injects `&& createdAt >= $visibleFrom` if a cutoff exists.
 */
export async function getVisibilityFilter(
  role: string,
  existingParams: Record<string, string>
): Promise<{ clause: string; params: Record<string, string> }> {
  if (role === 'super_admin') return { clause: '', params: existingParams };

  const config = await getSystemConfig();
  if (!config.visibleFrom) return { clause: '', params: existingParams };

  return {
    clause: ` && createdAt >= $visibleFrom`,
    params: { ...existingParams, visibleFrom: config.visibleFrom },
  };
}
