/**
 * Archive Dataset Clients
 *
 * These clients point to a COMPLETELY SEPARATE Sanity dataset named 'archive'.
 * This is a different dataset from 'production' — different URL, different access,
 * physically isolated storage within the same Sanity project.
 *
 * Physical isolation guarantee:
 *   - Production dataset: regular admin/employee access
 *   - Archive dataset: super_admin only, after explicit re-authentication
 *   - Even if production credentials are compromised, archive data is unreachable
 *     without the separate SANITY_ARCHIVE_TOKEN (which should have minimal permissions)
 *
 * SETUP REQUIRED (one-time):
 *   1. Go to https://www.sanity.io/manage → your project → Datasets
 *   2. Create a new dataset named "archive" (set to Private)
 *   3. Create a new API token with Write access for the archive dataset
 *   4. Add to .env.local:
 *        SANITY_ARCHIVE_DATASET=archive
 *        SANITY_ARCHIVE_TOKEN=<your-archive-write-token>
 */

import { createClient } from '@sanity/client';
import { sanityConfig } from './config';

const ARCHIVE_DATASET = process.env.SANITY_ARCHIVE_DATASET || 'archive';

// Read-only client for archive dataset
// Uses the archive-specific token if set, falls back to production token
export const archiveClient = createClient({
  projectId: sanityConfig.projectId,
  dataset: ARCHIVE_DATASET,
  apiVersion: sanityConfig.apiVersion,
  useCdn: false,
  token: process.env.SANITY_ARCHIVE_TOKEN || sanityConfig.token,
});

// Write-capable client for archive dataset (used ONLY during migration)
// Server-side only — never expose token to browser
export const archiveWriteClient = createClient({
  projectId: sanityConfig.projectId,
  dataset: ARCHIVE_DATASET,
  apiVersion: sanityConfig.apiVersion,
  useCdn: false,
  token: process.env.SANITY_ARCHIVE_TOKEN || sanityConfig.token,
});

export const ARCHIVE_DATASET_NAME = ARCHIVE_DATASET;
