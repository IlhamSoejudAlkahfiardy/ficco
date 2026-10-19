import { test, expect } from '@playwright/test';

test.describe('Step 23: Admin Dashboard & Supabase License Statistics', () => {
  const adminDashboardPath = '/admin-dashboard';
  const adminLoginPath = '/admin-dashboard/login';

  test.beforeEach(async ({ page }) => {
    // Authenticate as admin before each dashboard test
    await page.goto(adminLoginPath);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#admin-username').fill('admin');
    await page.locator('#admin-password').fill('ficco-admin-2026');
    await page.getByRole('button', { name: /Masuk ke Admin Portal/i }).click();
    await expect(page).toHaveURL(new RegExp(`${adminDashboardPath}$`));
  });

  test('should display the 3 key license metrics according to blueprint specification', async ({ page }) => {
    // 1. Verify Header and Welcome message
    await expect(
      page.getByRole('heading', { name: 'Dasbor Manajemen Lisensi Ficco' })
    ).toBeVisible();

    // 2. Verify the 3 Core Metrics exist (Total, Available/Unused, Used)
    await expect(page.getByText('Total Licenses', { exact: true })).toBeVisible();
    await expect(page.getByText('Unused Licenses (Available)', { exact: true })).toBeVisible();
    await expect(page.getByText('Used Licenses', { exact: true })).toBeVisible();

    // 3. Verify Database Status Indicator
    await expect(page.getByText(/Supabase Cloud Live|Server Development Mock/i)).toBeVisible();

    // 4. Verify Refresh button exists
    await expect(page.getByRole('button', { name: /Segarkan Data|Memuat/i })).toBeVisible();
  });

  test('should accurately reflect Supabase license statistics when demo data is seeded', async ({ page }) => {
    // Click the development seed button to create 5 demo licenses (3 used + 2 unused)
    const seedButton = page.getByRole('button', { name: /Seed 5 Lisensi Demo/i });
    if (await seedButton.isVisible()) {
      await seedButton.click();
    } else {
      // Fallback: trigger seed API directly
      await page.request.post('/api/admin/dashboard/stats', {
        data: { action: 'seed' },
      });
      await page.getByRole('button', { name: /Segarkan Data/i }).click();
    }

    // Wait for stats to reflect
    await expect(page.getByText('Tingkat Utilisasi Lisensi (Activation Rate)')).toBeVisible({
      timeout: 10000,
    });

    // Verify numbers are updated and greater than zero
    const totalEl = page.getByTestId('stat-total');
    await expect(totalEl).toBeVisible();
    await expect(totalEl).not.toHaveText('...');
    const totalText = await totalEl.innerText();
    expect(Number(totalText)).toBeGreaterThanOrEqual(5);


    // Verify recent activity table displays licenses
    await expect(page.getByText('Aktivitas Lisensi Terbaru')).toBeVisible();
    await expect(page.getByText('FCC-', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Digunakan').first()).toBeVisible();
    await expect(page.getByText('Tersedia').first()).toBeVisible();

    // Verify copy button functions
    const copyButton = page.getByRole('button', { name: 'Salin' }).first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();
    await expect(page.getByText('Tersalin!').first()).toBeVisible();
  });

  test('should enforce API security on /api/admin/dashboard/stats (rejects unauthenticated requests)', async ({
    browser,
  }) => {
    // Create fresh context without admin session cookie
    const freshContext = await browser.newContext();
    const freshPage = await freshContext.newPage();

    const response = await freshPage.request.get('/api/admin/dashboard/stats');
    expect(response.status()).toBe(401);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('Unauthorized');

    await freshContext.close();
  });
});
