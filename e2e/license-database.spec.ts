import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Step 21: License Database & Security Boundary', () => {
  test('should verify Supabase SQL migration defines licenses table, indexes, and RLS policies', async () => {
    const migrationPath = path.resolve(
      process.cwd(),
      'supabase/migrations/20261016_create_licenses_table.sql'
    );
    expect(fs.existsSync(migrationPath)).toBeTruthy();

    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    // 1. Table schema & MVP columns
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.licenses');
    expect(sqlContent).toContain('id UUID PRIMARY KEY');
    expect(sqlContent).toContain('license_key TEXT NOT NULL');
    expect(sqlContent).toContain('used BOOLEAN NOT NULL DEFAULT FALSE');
    expect(sqlContent).toContain('created_at TIMESTAMPTZ');
    expect(sqlContent).toContain('customer_name TEXT');
    expect(sqlContent).toContain('customer_email TEXT');

    // 2. Indexes
    expect(sqlContent).toContain('CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_license_key_unique');
    expect(sqlContent).toContain('CREATE INDEX IF NOT EXISTS idx_licenses_used');

    // 3. Row Level Security (RLS) Strategy
    expect(sqlContent).toContain('ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY');
    expect(sqlContent).toContain('CREATE POLICY "Deny public anon access"');
    expect(sqlContent).toContain('CREATE POLICY "Service role full access"');
  });

  test('should verify server-side credentials remain strictly protected and not leaked to client', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Verify service key is never exposed on window or global scope in client browser
    const clientEvaluation = await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const win = window as any;
      return {
        hasServiceKeyInEnv: Boolean(win.process?.env?.SUPABASE_SERVICE_ROLE_KEY),
        hasServiceKeyInWindow: Boolean(win.SUPABASE_SERVICE_ROLE_KEY),
      };
    });

    expect(clientEvaluation.hasServiceKeyInEnv).toBeFalsy();
    expect(clientEvaluation.hasServiceKeyInWindow).toBeFalsy();
  });

  test('should verify license database health check endpoint (GET /api/license/health)', async ({ request }) => {
    const res = await request.get('/api/license/health');
    expect(res.ok()).toBeTruthy();

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.database).toBeDefined();
    expect(json.database.tableExists).toBe(true);
    expect(json.database.rlsEnabled).toBe(true);
    expect(json.security.serviceCredentialsServerSide).toBe(true);
    expect(json.security.clientExposureBlocked).toBe(true);
  });

  test('should create cryptographically random license with used=false and enforce uniqueness', async ({ request }) => {
    // 1. Create a new license
    const createRes = await request.post('/api/license/health', {
      data: {
        customerName: 'PT Nusantara Digital',
        customerEmail: 'admin@nusantara.id',
      },
    });
    expect(createRes.status()).toBe(201);

    const json = await createRes.json();
    expect(json.success).toBe(true);
    expect(json.license).toBeDefined();

    const license = json.license;
    expect(license.id).toBeTruthy();
    // Verify license key adheres to format FCC-XXXX-XXXX-XXXX-XXXX
    expect(license.licenseKey).toMatch(/^FCC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(license.used).toBe(false);
    expect(license.customerName).toBe('PT Nusantara Digital');
    expect(license.customerEmail).toBe('admin@nusantara.id');
    expect(license.createdAt).toBeTruthy();

    // 2. Verify duplicate key rejection
    const customKey = 'FCC-TEST-DUPL-KEY1-9999';
    const firstCustom = await request.post('/api/license/health', {
      data: {
        customerName: 'Customer One',
        customKey,
      },
    });
    expect(firstCustom.status()).toBe(201);

    // Attempt to insert with the same key
    const duplicateRes = await request.post('/api/license/health', {
      data: {
        customerName: 'Customer Two',
        customKey,
      },
    });
    expect(duplicateRes.status()).toBe(500);
    const duplicateJson = await duplicateRes.json();
    expect(duplicateJson.success).toBe(false);
    expect(duplicateJson.error).toContain('unique constraint');
  });
});
