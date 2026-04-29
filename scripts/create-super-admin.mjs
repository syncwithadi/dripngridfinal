/**
 * DRIPNGRID — Create First Super Admin
 * ─────────────────────────────────────
 * Run once to seed the first Super Admin into Sanity.
 * Requires: SANITY_API_TOKEN, NEXT_PUBLIC_SANITY_PROJECT_ID (optional)
 *
 * Usage:
 *   node scripts/create-super-admin.mjs
 *
 * Or with explicit token:
 *   SANITY_API_TOKEN=your_token node scripts/create-super-admin.mjs
 */

import { createClient } from '@sanity/client';
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// ── Load .env.local manually (no dotenv dependency needed) ──────────────────
function loadEnv() {
  const envPath = join(root, '.env.local');
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

// ── Credentials ─────────────────────────────────────────────────────────────
const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'm4jaxdfe';
const SANITY_DATASET    = process.env.NEXT_PUBLIC_SANITY_DATASET    || 'production';
const SANITY_TOKEN      = process.env.SANITY_API_TOKEN;

if (!SANITY_TOKEN) {
  console.error('\n❌  SANITY_API_TOKEN is not set.');
  console.error('    Add it to .env.local or export it before running this script.\n');
  process.exit(1);
}

// ── New Super Admin details ──────────────────────────────────────────────────
const EMPLOYEE_ID = 'ADMIN001';
const PASSWORD    = 'adx1606';
const NAME        = 'Super Admin';
const EMAIL       = 'admin@dripngrid.in';

// ── bcrypt (Node-compatible, already in project) ─────────────────────────────
const require = createRequire(import.meta.url);
const bcrypt  = require('bcryptjs');

// ── Sanity write client ──────────────────────────────────────────────────────
const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset:   SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn:    false,
  token:     SANITY_TOKEN,
});

async function run() {
  console.log('\n🔐  DRIPNGRID — Admin Setup\n');
  console.log(`  Project : ${SANITY_PROJECT_ID}`);
  console.log(`  Dataset : ${SANITY_DATASET}`);
  console.log(`  Employee: ${EMPLOYEE_ID}\n`);

  // 1. Check no admin user already exists
  const existingCount = await client.fetch(`count(*[_type == "adminUser"])`);
  if (existingCount > 0) {
    console.error('⚠️   An adminUser already exists in Sanity.');
    console.error('    If you need to reset, manually delete adminUser documents in Sanity Studio.\n');
    process.exit(1);
  }

  // 2. Hash password
  console.log('  Hashing password...');
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // 3. Create document
  console.log('  Creating Super Admin in Sanity...');
  const doc = await client.create({
    _type: 'adminUser',
    employeeId: EMPLOYEE_ID,
    name: NAME,
    email: EMAIL,
    passwordHash,
    role: 'super_admin',
    active: true,
    mustChangePassword: true,
    createdAt: new Date().toISOString(),
  });

  console.log('\n✅  Super Admin created successfully!');
  console.log(`  Sanity ID : ${doc._id}`);
  console.log(`  Employee  : ${EMPLOYEE_ID}`);
  console.log(`  Password  : ${PASSWORD}  ← change this on first login`);
  console.log(`  Role      : super_admin`);
  console.log('\n  Login at: http://localhost:3000/admin/login\n');
}

run().catch(err => {
  console.error('\n❌  Setup failed:', err.message ?? err);
  process.exit(1);
});
