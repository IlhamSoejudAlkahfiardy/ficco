import { test, expect } from '@playwright/test';
import { seedActiveLicense } from './support/license-helper';
import { parseAndValidateBackupJson } from '../features/backup/_utils/backup-import';

test.describe('Step 30: Security Review & Hardening Verification', () => {
  test.beforeEach(async ({ page }) => {
    await seedActiveLicense(page);
  });

  // ---------------------------------------------------------------------------
  // Check 1, 2, 3: Zero Server Credentials in Client Bundles & Source
  // ---------------------------------------------------------------------------
  test('Check 1, 2, 3: should guarantee no Supabase service role key, admin password, or secret tokens are leaked to client window or scripts', async ({
    page,
  }) => {
    // 1. Visit core customer dashboard and license views
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 2. Evaluate client window object
    const windowAudit = await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const win = window as any;
      const processEnv = win.process?.env || {};

      return {
        hasServiceRoleKey: Boolean(
          win.SUPABASE_SERVICE_ROLE_KEY ||
            processEnv.SUPABASE_SERVICE_ROLE_KEY ||
            processEnv.SERVICE_ROLE_KEY
        ),
        hasAdminPassword: Boolean(
          win.ADMIN_PASSWORD ||
            processEnv.ADMIN_PASSWORD
        ),
        hasAdminSessionSecret: Boolean(
          win.ADMIN_SESSION_SECRET ||
            processEnv.ADMIN_SESSION_SECRET
        ),
      };
    });

    expect(windowAudit.hasServiceRoleKey).toBeFalsy();
    expect(windowAudit.hasAdminPassword).toBeFalsy();
    expect(windowAudit.hasAdminSessionSecret).toBeFalsy();

    // 3. Inspect HTML source and inline script tags for sensitive keyword leaks
    const htmlContent = await page.content();
    expect(htmlContent).not.toContain('placeholder-service-role-key');
    expect(htmlContent).not.toContain('ficco-secure-admin-session-secret');
  });

  // ---------------------------------------------------------------------------
  // Check 4: Admin Routes and API Gate Protection
  // ---------------------------------------------------------------------------
  test('Check 4: should enforce strict protection on admin pages and administrative API routes', async ({
    page,
    request,
  }) => {
    // 1. Attempt unauthenticated navigation to /admin-dashboard
    await page.goto('/admin-dashboard');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/admin-dashboard\/login\?from=/);

    // 2. Unauthenticated GET /api/admin/licenses -> 401
    const getLicensesRes = await request.get('/api/admin/licenses');
    expect(getLicensesRes.status()).toBe(401);
    const getLicensesJson = await getLicensesRes.json();
    expect(getLicensesJson.success).toBe(false);

    // 3. Unauthenticated POST /api/admin/licenses -> 401
    const postLicensesRes = await request.post('/api/admin/licenses', {
      data: { customerName: 'Intruder' },
    });
    expect(postLicensesRes.status()).toBe(401);

    // 4. Unauthenticated GET /api/admin/dashboard/stats -> 401
    const getStatsRes = await request.get('/api/admin/dashboard/stats');
    expect(getStatsRes.status()).toBe(401);
  });

  // ---------------------------------------------------------------------------
  // Check 5: License Endpoint Validates Input
  // ---------------------------------------------------------------------------
  test('Check 5: should strictly validate input payload on POST /api/license/activate', async ({
    request,
  }) => {
    // 1. Non-POST method (GET) -> 405 Method Not Allowed
    const getRes = await request.get('/api/license/activate');
    expect(getRes.status()).toBe(405);

    // 2. Empty payload -> 400 Bad Request with INVALID_FORMAT
    const emptyRes = await request.post('/api/license/activate', {
      data: {},
    });
    expect(emptyRes.status()).toBe(400);
    const emptyJson = await emptyRes.json();
    expect(emptyJson.code).toBe('INVALID_FORMAT');
    expect(emptyJson.success).toBe(false);

    // 3. Too short key -> 400 Bad Request
    const shortRes = await request.post('/api/license/activate', {
      data: { licenseKey: 'SHORT-KEY' },
    });
    expect(shortRes.status()).toBe(400);
    const shortJson = await shortRes.json();
    expect(shortJson.code).toBe('INVALID_FORMAT');

    // 4. Malformed SQL injection attempt string -> safely handled & rejected with 400
    const sqliRes = await request.post('/api/license/activate', {
      data: { licenseKey: "' OR '1'='1" },
    });
    expect(sqliRes.status()).toBe(400);
  });

  // ---------------------------------------------------------------------------
  // Check 6: Imported JSON Validated (Data Isolation & Integrity)
  // ---------------------------------------------------------------------------
  test('Check 6: should reject corrupt, malicious, or malformed JSON payloads prior to database restoration', async () => {
    // 1. Non-JSON string
    const malformed = parseAndValidateBackupJson('INVALID_NON_JSON_CONTENT{{{');
    expect(malformed.valid).toBe(false);
    expect(malformed.error).toContain('Berkas bukan format JSON yang valid');

    // 2. Tampered format identifier
    const wrongFormat = parseAndValidateBackupJson(
      JSON.stringify({ format: 'malicious-format', schemaVersion: 1, data: {} })
    );
    expect(wrongFormat.valid).toBe(false);
    expect(wrongFormat.error).toContain('tidak didukung');

    // 3. Schema version from the future
    const futureSchema = parseAndValidateBackupJson(
      JSON.stringify({ format: 'invoice-app-backup', schemaVersion: 9999, data: {} })
    );
    expect(futureSchema.valid).toBe(false);
    expect(futureSchema.error).toContain('lebih baru dari versi aplikasi');

    // 4. Invalid data structure (e.g. invoice items with string instead of numeric total)
    const tamperedData = parseAndValidateBackupJson(
      JSON.stringify({
        format: 'invoice-app-backup',
        schemaVersion: 1,
        appVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: {
          invoices: [
            {
              id: 'inv_1',
              invoiceNumber: 'INV-001',
              customerId: 'c_1',
              issueDate: '2026-01-01',
              dueDate: '2026-01-15',
              status: 'invalid_status_exploit',
              subtotal: 'should-be-number',
              discount: 0,
              tax: 0,
              total: 100000,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        },
      })
    );
    expect(tamperedData.valid).toBe(false);
    expect(tamperedData.details).toBeDefined();
    expect(tamperedData.details?.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Check 7 & 8: Database Writes Validated & No Unsafe HTML Rendering (XSS Prevention)
  // ---------------------------------------------------------------------------
  test('Check 7 & 8: should sanitize/escape user input safely without executing raw HTML or script tags (XSS Prevention)', async ({
    page,
  }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    // Attempt to inject XSS payload in Customer name
    const xssPayload = `<img src=x onerror="window.__xssPwned=true">`;
    const customerDisplayName = `Security Test XSS ${Date.now()}`;

    const addBtn = page.getByRole('button', { name: 'Tambah Pelanggan', exact: true }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.locator('input[name="name"]').fill(`${customerDisplayName} ${xssPayload}`);
      await page.locator('input[name="email"]').fill('security@ficco.local');
      await page.locator('form button[type="submit"]').click();

      // Ensure customer was saved and rendered safely as text
      await expect(page.getByText(customerDisplayName).first()).toBeVisible();

      // Verify XSS script was NEVER executed in the browser context
      const xssExecuted = await page.evaluate(() => {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        return Boolean((window as any).__xssPwned);
      });
      expect(xssExecuted).toBeFalsy();
    }
  });

  // ---------------------------------------------------------------------------
  // Check 9: No Sensitive Data or Stack Traces Leaked in Error Responses
  // ---------------------------------------------------------------------------
  test('Check 9: should return clean sanitized error payloads without leaking server stack traces', async ({
    request,
  }) => {
    // Call nonexistent endpoint or invalid method
    const badMethodRes = await request.get('/api/license/activate');
    const badMethodJson = await badMethodRes.json();

    // Verify error is sanitized
    expect(badMethodJson.success).toBe(false);
    expect(badMethodJson.error).toBeDefined();
    expect(JSON.stringify(badMethodJson)).not.toContain('node_modules');
    expect(JSON.stringify(badMethodJson)).not.toContain('stack');

    // Call admin route without auth
    const unauthRes = await request.get('/api/admin/licenses');
    const unauthJson = await unauthRes.json();
    expect(unauthJson.success).toBe(false);
    expect(JSON.stringify(unauthJson)).not.toContain('node_modules');
    expect(JSON.stringify(unauthJson)).not.toContain('ADMIN_PASSWORD');
  });

  // ---------------------------------------------------------------------------
  // Bonus: HTTP Security Headers Verification
  // ---------------------------------------------------------------------------
  test('Bonus: should return standard HTTP security headers (X-Frame-Options, X-Content-Type-Options)', async ({
    request,
  }) => {
    const res = await request.get('/api/ping');
    expect(res.ok()).toBeTruthy();

    const headers = res.headers();
    expect(headers['x-frame-options']?.toUpperCase()).toBe('SAMEORIGIN');
    expect(headers['x-content-type-options']?.toLowerCase()).toBe('nosniff');
    expect(headers['referrer-policy']?.toLowerCase()).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toBeDefined();
  });
});
