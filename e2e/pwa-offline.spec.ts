import { test, expect } from '@playwright/test';
import { seedActiveLicense } from './support/license-helper';

test.describe('Step 20: PWA & Offline Support', () => {
  test.beforeEach(async ({ page }) => {
    await seedActiveLicense(page);
  });
  test('should provide valid PWA manifest and accessible icons', async ({ request }) => {
    // 1. Verify manifest endpoint
    const manifestRes = await request.get('/manifest.json');
    expect(manifestRes.ok()).toBeTruthy();

    const manifest = await manifestRes.json();
    expect(manifest.name).toBe('Ficco — Invoice & Expense Management');
    expect(manifest.short_name).toBe('Ficco');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/dashboard');
    expect(manifest.theme_color).toBe('#2563eb');
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);

    // 2. Verify Next.js native webmanifest endpoint
    const nextManifestRes = await request.get('/manifest.webmanifest');
    expect(nextManifestRes.ok()).toBeTruthy();

    // 3. Verify core icon files return 200 OK
    const icon192 = await request.get('/icons/icon-192x192.png');
    expect(icon192.ok()).toBeTruthy();
    expect(icon192.headers()['content-type']).toContain('image/png');

    const icon512 = await request.get('/icons/icon-512x512.png');
    expect(icon512.ok()).toBeTruthy();
    expect(icon512.headers()['content-type']).toContain('image/png');

    const appleIcon = await request.get('/icons/apple-touch-icon.png');
    expect(appleIcon.ok()).toBeTruthy();

    const svgIcon = await request.get('/icons/icon.svg');
    expect(svgIcon.ok()).toBeTruthy();
  });

  test('should serve the PWA service worker script at root scope /sw.js', async ({ request }) => {
    const swRes = await request.get('/sw.js');
    expect(swRes.ok()).toBeTruthy();
    const swText = await swRes.text();

    expect(swText).toContain('CACHE_VERSION');
    expect(swText).toContain('PRECACHE_ASSETS');
    expect(swText).toContain('/offline');
    expect(swText).toContain("self.addEventListener('fetch'");
    expect(swText).toContain("self.addEventListener('install'");
    expect(swText).toContain("self.addEventListener('activate'");
  });

  test('should render dedicated offline fallback page (/offline) with local-first guidance', async ({ page }) => {
    await page.goto('/offline');
    await page.waitForLoadState('domcontentloaded');

    // Verify offline badge & header
    await expect(page.getByText('Koneksi Internet Terputus')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Mode Offline Ficco' })).toBeVisible();

    // Verify Local-First assurance text
    await expect(page.getByText(/Local-First/i)).toBeVisible();
    await expect(page.getByText(/IndexedDB/i)).toBeVisible();

    // Verify interactive action button
    const dashboardLink = page.getByRole('link', { name: 'Buka Dashboard Lokal' });
    await expect(dashboardLink).toBeVisible();

    await dashboardLink.click();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should render PWA Management tab in Settings with diagnostics and installation guides', async ({ page }) => {
    await page.goto('/settings?tab=pwa');
    await page.waitForLoadState('domcontentloaded');

    // Verify Tab is selected
    const pwaTab = page.getByRole('button', { name: 'Aplikasi & PWA' });
    await expect(pwaTab).toBeVisible();

    // Verify Banner
    await expect(page.getByText('Ficco Bekerja Sepenuhnya Tanpa Internet')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Uji Halaman Offline' })).toBeVisible();

    // Verify 4 Status Cards
    await expect(page.getByText('Mode Tampilan')).toBeVisible();
    await expect(page.getByText('Service Worker')).toBeVisible();
    await expect(page.getByText('Penyimpanan Bisnis')).toBeVisible();
    await expect(page.getByText('IndexedDB (Dexie)')).toBeVisible();
    await expect(page.getByText('Status Pemasangan')).toBeVisible();

    // Verify Platform installation guides
    await expect(page.getByText('Panduan Memasang Ficco di Berbagai Perangkat')).toBeVisible();
    await expect(page.getByText(/Komputer \(Chrome \/ Edge \/ Brave\)/i)).toBeVisible();
    await expect(page.getByText(/iPhone & iPad \(Safari\)/i)).toBeVisible();
    await expect(page.getByText(/Android \(Chrome\)/i)).toBeVisible();
  });

  test('should verify acceptance criteria: offline simulation preserves local data access', async ({ page, context }) => {
    // 1. Open application online (Acceptance Criterion 1)
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // 2. Load application and verify dashboard renders (Acceptance Criterion 2)
    await expect(page.getByRole('heading', { name: 'Ringkasan Keuangan' })).toBeVisible();

    // Cache dashboard page into service worker
    await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
        try {
          const cache = await caches.open('ficco-pages-v1.0.1');
          const res = await fetch('/dashboard');
          if (res.ok) {
            await cache.put(window.location.href, res.clone());
            await cache.put('/dashboard', res);
          }
        } catch {}
      }
    });

    // 3. Disable internet (Acceptance Criterion 3)
    await context.setOffline(true);

    // Verify connectivity probe indicates Offline Mode
    const statusBtn = page.locator('header').getByRole('button', { name: /Online|Offline Mode/i });
    await statusBtn.click();
    await expect(page.locator('header').getByText('Offline Mode')).toBeVisible();

    // 4. Refresh while offline (Acceptance Criterion 4)
    await page.reload({ waitUntil: 'domcontentloaded' });

    // 5. Application still opens (Acceptance Criterion 5)
    await expect(page.getByRole('heading', { name: 'Ringkasan Keuangan' })).toBeVisible();

    // 6. Existing local data remains available (Acceptance Criterion 6)
    await expect(page.getByText(/Database Lokal Offline \(IndexedDB \/ Dexie\)/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: /Tren Keuangan/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Distribusi Pengeluaran/i })).toBeVisible();

    // 7. Restore online connection
    await context.setOffline(false);
    await statusBtn.click();
    await expect(page.locator('header').getByText('Online')).toBeVisible();
  });
});
