import { test, expect } from '@playwright/test';

test.describe('Step 27: Local License State & Persistence', () => {
  const licensePageUrl = '/license';
  const adminLoginUrl = '/admin-dashboard/login';
  const adminDashboardUrl = '/admin-dashboard';

  test.beforeEach(async ({ page }) => {
    // Clear storage before each test
    await page.goto(licensePageUrl);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      localStorage.removeItem('ficco_activated_license');
      localStorage.removeItem('ficco_license_store');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should persist activation state across page reloads (User does not need to enter license on every page load)', async ({
    page,
  }) => {
    // 1. Create a fresh license in admin
    await page.goto(adminLoginUrl);
    await page.locator('#admin-username').fill('admin');
    await page.locator('#admin-password').fill('ficco-admin-2026');
    await page.getByRole('button', { name: /Masuk ke Admin Portal/i }).click();
    await expect(page).toHaveURL(new RegExp(`${adminDashboardUrl}$`));

    const customerName = `PT Langgeng Jaya ${Date.now().toString().slice(-4)}`;
    await page.getByTestId('open-create-license-modal-btn').click();
    await page.locator('#customerName').fill(customerName);
    await page.getByTestId('submit-create-license-btn').click();

    await expect(
      page.getByRole('heading', { name: 'Kunci Lisensi Berhasil Dibuat' })
    ).toBeVisible();
    const licenseKey = (await page.getByTestId('created-license-key').innerText()).trim();
    expect(licenseKey).toBeTruthy();
    await page.getByRole('button', { name: 'Selesai' }).click();

    // 2. Activate the license on /license
    await page.goto(licensePageUrl);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('license-key-input')).toBeVisible();
    await page.getByTestId('license-key-input').fill(licenseKey);
    await page.getByTestId('activate-license-submit-btn').click();
    await expect(page.getByTestId('activation-success-banner')).toBeVisible();
    await expect(page.getByTestId('registered-license-key')).toHaveText(licenseKey);

    // 3. Verify Zustand persistence in localStorage
    const storedState = await page.evaluate(() => {
      const raw = localStorage.getItem('ficco_license_store');
      return raw ? JSON.parse(raw) : null;
    });
    expect(storedState).toBeTruthy();
    expect(storedState.state.isActivated).toBe(true);
    expect(storedState.state.licenseKey).toBe(licenseKey);
    expect(storedState.state.customerName).toBe(customerName);

    // 4. Reload the page completely
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // 5. Must remain activated without asking user to re-enter license key
    await expect(page.getByTestId('activation-success-banner')).toBeVisible();
    await expect(page.getByTestId('registered-license-key')).toHaveText(licenseKey);
    await expect(page.getByText(customerName)).toBeVisible();
    await expect(page.getByText('Perangkat Teraktivasi', { exact: true })).toBeVisible();
  });

  test('should allow application to operate offline after successful activation', async ({
    page,
    context,
  }) => {
    // 1. Create and activate a license
    await page.goto(adminLoginUrl);
    await page.locator('#admin-username').fill('admin');
    await page.locator('#admin-password').fill('ficco-admin-2026');
    await page.getByRole('button', { name: /Masuk ke Admin Portal/i }).click();

    const customerName = `UD Sukses Mandiri ${Date.now().toString().slice(-4)}`;
    await page.getByTestId('open-create-license-modal-btn').click();
    await page.locator('#customerName').fill(customerName);
    await page.getByTestId('submit-create-license-btn').click();

    await expect(
      page.getByRole('heading', { name: 'Kunci Lisensi Berhasil Dibuat' })
    ).toBeVisible();
    const licenseKey = (await page.getByTestId('created-license-key').innerText()).trim();
    expect(licenseKey).toBeTruthy();
    await page.getByRole('button', { name: 'Selesai' }).click();

    await page.goto(licensePageUrl);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('license-key-input')).toBeVisible();
    await page.getByTestId('license-key-input').fill(licenseKey);
    await page.getByTestId('activate-license-submit-btn').click();
    await expect(page.getByTestId('activation-success-banner')).toBeVisible();

    // 2. Pre-warm /dashboard so client JS chunks are cached
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.goto(licensePageUrl);
    await page.waitForLoadState('networkidle');

    // 3. Simulate offline network mode
    await context.setOffline(true);

    try {
      // 4. License status remains active locally from Zustand store without network
      const isStoreActive = await page.evaluate(() => {
        const raw = localStorage.getItem('ficco_license_store');
        return raw ? JSON.parse(raw)?.state?.isActivated : false;
      });
      expect(isStoreActive).toBe(true);

      await expect(page.getByTestId('activation-success-banner')).toBeVisible();
      await expect(page.getByTestId('registered-license-key')).toHaveText(licenseKey);
      await expect(page.getByText(customerName)).toBeVisible();

      // 5. User can open Dashboard while offline and access business data
      const dashboardLink = page.getByRole('link', { name: /Buka Dashboard Aplikasi/i });
      await expect(dashboardLink).toBeVisible();
      await dashboardLink.click();
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole('heading', { name: 'Ringkasan Keuangan' })).toBeVisible();
    } finally {
      // Restore online network
      await context.setOffline(false);
    }
  });

  test('should separate license state from business data in IndexedDB', async ({ page }) => {
    // 1. Pre-seed an activated license state into Zustand store
    await page.goto(licensePageUrl);
    await page.evaluate(() => {
      const mockStore = {
        state: {
          isActivated: true,
          licenseKey: 'FCC-ISOL-7777-TEST-8888',
          customerName: 'Toko Terpisah',
          customerEmail: 'admin@terpisah.local',
          activatedAt: new Date().toISOString(),
          deviceFingerprint: 'DEV-TEST-ISOLATION',
          lastVerifiedAt: new Date().toISOString(),
        },
        version: 0,
      };
      localStorage.setItem('ficco_license_store', JSON.stringify(mockStore));
    });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // 2. License state is active
    await expect(page.getByTestId('activation-success-banner')).toBeVisible();
    await expect(page.getByTestId('registered-license-key')).toHaveText('FCC-ISOL-7777-TEST-8888');

    // 3. Clear IndexedDB (simulate clearing or restoring business data)
    await page.evaluate(async () => {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          window.indexedDB.deleteDatabase(db.name);
        }
      }
    });

    // 4. Reload page: license state MUST remain intact because it is stored separately from business data
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByTestId('activation-success-banner')).toBeVisible();
    await expect(page.getByTestId('registered-license-key')).toHaveText('FCC-ISOL-7777-TEST-8888');
    await expect(page.getByText('Toko Terpisah')).toBeVisible();
  });

  test('should handle activation failure without corrupting unactivated state in store', async ({
    page,
  }) => {
    // 1. Initial state is unactivated
    await page.goto(licensePageUrl);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('license-key-input')).toBeVisible();

    // 2. Try activating with non-existent key
    await page.getByTestId('license-key-input').fill('FCC-NON-EXISTENT-KEY-999');
    await page.getByTestId('activate-license-submit-btn').click();

    // 3. Error is displayed
    await expect(page.getByTestId('activation-error-alert')).toBeVisible();

    // 4. Verify store is still NOT activated
    const isActivated = await page.evaluate(() => {
      const raw = localStorage.getItem('ficco_license_store');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return parsed.state.isActivated;
    });
    expect(isActivated).toBe(false);
  });
});
