import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { seedActiveLicense } from './support/license-helper';

test.describe('Step 33: Production Deployment & Readiness Verification', () => {
  // ---------------------------------------------------------------------------
  // 1. Zero Business-Data API Requirement
  // ---------------------------------------------------------------------------
  test('Check 1: should enforce zero business-data APIs on the server (Local-First Architecture)', async ({
    request,
    page,
  }) => {
    // 1. Verify non-existent business endpoints return 404
    const endpointsToProbe = [
      '/api/invoices',
      '/api/expenses',
      '/api/customers',
      '/api/products',
      '/api/reports',
      '/api/companies',
      '/api/payments',
    ];

    for (const endpoint of endpointsToProbe) {
      const getRes = await request.get(endpoint);
      expect(getRes.status(), `GET ${endpoint} must return 404`).toBe(404);

      const postRes = await request.post(endpoint, { data: { test: 'payload' } });
      expect(postRes.status(), `POST ${endpoint} must return 404`).toBe(404);
    }

    // 2. Perform business operations in UI and ensure ZERO network calls to server for business data
    await seedActiveLicense(page);
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    const businessApiCalls: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('/api/') && !url.includes('/api/ping') && !url.includes('/api/license/')) {
        businessApiCalls.push(url);
      }
    });

    // Add a customer in UI
    const customerName = `Prod Client ${Date.now().toString().slice(-4)}`;
    const addBtn = page.getByRole('button', { name: 'Tambah Pelanggan', exact: true }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.locator('input[name="name"]').fill(customerName);
      await page.locator('input[name="email"]').fill('prod@client.local');
      await page.locator('form button[type="submit"]').click();
      await expect(page.getByText(customerName).first()).toBeVisible();
    }

    // Zero business data calls must have occurred
    expect(businessApiCalls.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 2. Production Environment Variables & Configuration Artifacts
  // ---------------------------------------------------------------------------
  test('Check 2: should verify production environment configuration template and Vercel artifacts', async () => {
    // 1. Verify .env.production.example exists and contains required keys
    const prodEnvPath = path.join(process.cwd(), '.env.production.example');
    expect(fs.existsSync(prodEnvPath)).toBe(true);

    const prodEnvContent = fs.readFileSync(prodEnvPath, 'utf-8');
    const requiredKeys = [
      'DEVELOPMENT',
      'NEXT_PUBLIC_DEVELOPMENT',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ADMIN_USERNAME',
      'ADMIN_PASSWORD',
      'ADMIN_SESSION_SECRET',
    ];

    for (const key of requiredKeys) {
      expect(prodEnvContent).toContain(key);
    }

    // 2. Verify vercel.json configuration exists
    const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
    expect(fs.existsSync(vercelConfigPath)).toBe(true);

    const vercelContent = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));
    expect(vercelContent.framework).toBe('nextjs');

    // 3. Verify Supabase production SQL migration exists
    const migrationPath = path.join(
      process.cwd(),
      'supabase',
      'migrations',
      '20261016_create_licenses_table.sql'
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(sqlContent).toContain('CREATE TABLE IF NOT EXISTS public.licenses');
    expect(sqlContent).toContain('ENABLE ROW LEVEL SECURITY');
    expect(sqlContent).toContain('CREATE POLICY "Service role full access"');
    expect(sqlContent).toContain('CREATE POLICY "Deny public anon access"');
  });

  // ---------------------------------------------------------------------------
  // 3. HTTPS & Security Headers
  // ---------------------------------------------------------------------------
  test('Check 3: should return standard production security headers including HSTS for HTTPS', async ({
    request,
  }) => {
    const res = await request.get('/api/ping');
    expect(res.ok()).toBeTruthy();

    const headers = res.headers();
    expect(headers['x-frame-options']?.toUpperCase()).toBe('SAMEORIGIN');
    expect(headers['x-content-type-options']?.toLowerCase()).toBe('nosniff');
    expect(headers['referrer-policy']?.toLowerCase()).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toBeDefined();
    expect(headers['strict-transport-security']).toContain('max-age=63072000');
  });

  // ---------------------------------------------------------------------------
  // 4. PWA Metadata & Asset Delivery
  // ---------------------------------------------------------------------------
  test('Check 4: should serve PWA web manifest, service worker, icons, and offline fallback', async ({
    request,
  }) => {
    // 1. Web manifest at /manifest.webmanifest
    const manifestRes = await request.get('/manifest.webmanifest');
    expect(manifestRes.ok()).toBeTruthy();
    const manifest = await manifestRes.json();
    expect(manifest.name).toBe('Ficco — Invoice & Expense Management');
    expect(manifest.short_name).toBe('Ficco');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/dashboard');
    expect(manifest.theme_color).toBe('#2563eb');
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    // 2. Service worker script at /sw.js
    const swRes = await request.get('/sw.js');
    expect(swRes.ok()).toBeTruthy();
    const swHeaders = swRes.headers();
    expect(swHeaders['content-type']).toContain('javascript');
    expect(swHeaders['cache-control']).toContain('no-cache');

    const swBody = await swRes.text();
    expect(swBody).toContain('self.addEventListener');
    expect(swBody).toContain('STATIC_CACHE');

    // 3. Core PWA icons accessibility
    const iconPaths = [
      '/icons/icon-192x192.png',
      '/icons/icon-512x512.png',
      '/icons/apple-touch-icon.png',
      '/icons/icon.svg',
    ];

    for (const iconPath of iconPaths) {
      const iconRes = await request.get(iconPath);
      expect(iconRes.status(), `Icon ${iconPath} should be accessible`).toBe(200);
    }
  });

  // ---------------------------------------------------------------------------
  // 5. License Endpoints & Health Check
  // ---------------------------------------------------------------------------
  test('Check 5: should respond to license health check and validate activation endpoint contract', async ({
    request,
  }) => {
    // 1. Health check endpoint
    const healthRes = await request.get('/api/license/health');
    expect(healthRes.ok()).toBeTruthy();
    const healthJson = await healthRes.json();
    expect(healthJson.success).toBe(true);
    expect(healthJson.database).toBeDefined();
    expect(healthJson.database.tableExists).toBe(true);
    expect(healthJson.database.rlsEnabled).toBe(true);
    expect(healthJson.security.serviceCredentialsServerSide).toBe(true);
    expect(healthJson.security.clientExposureBlocked).toBe(true);

    // 2. Activation endpoint input validation
    const invalidActivateRes = await request.post('/api/license/activate', {
      data: { licenseKey: 'SHORT', customerName: '' },
    });
    expect(invalidActivateRes.status()).toBe(400);

    const invalidJson = await invalidActivateRes.json();
    expect(invalidJson.success).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // 6. Application Shell & Offline Page Standalone Loading
  // ---------------------------------------------------------------------------
  test('Check 6: should render core application pages and dedicated offline fallback cleanly', async ({
    page,
  }) => {
    await seedActiveLicense(page);

    // 1. Dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Ringkasan Keuangan' })).toBeVisible();

    // 2. Invoices
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Faktur Penjualan' })).toBeVisible();

    // 3. Expenses
    await page.goto('/expenses');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Pengeluaran', exact: true })).toBeVisible();

    // 4. Reports
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Laporan Keuangan' })).toBeVisible();

    // 5. Settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Pengaturan Bisnis' })).toBeVisible();

    // 6. Dedicated Offline Fallback Page
    await page.goto('/offline');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByRole('heading', { name: 'Mode Offline Ficco' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Buka Dashboard Lokal' })).toBeVisible();
  });
});
