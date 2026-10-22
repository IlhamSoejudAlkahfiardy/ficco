import { test, expect } from '@playwright/test';
import { clearLicenseState, seedActiveLicense } from './support/license-helper';

test.describe('Step 28: Protect Application Access (License Gate)', () => {
  const adminLoginUrl = '/admin-dashboard/login';
  const adminDashboardUrl = '/admin-dashboard';

  test.describe('Unactivated State (Not activated -> License screen)', () => {
    test.beforeEach(async ({ page }) => {
      await clearLicenseState(page);
    });

    test('should redirect unactivated customer from root (/) to /license', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/\/license$/);
      await expect(page.getByTestId('license-activation-view')).toBeVisible();
      await expect(page.getByText('Belum Diaktivasi')).toBeVisible();
    });

    test('should redirect unactivated customer from /dashboard to /license with from param and notice', async ({
      page,
    }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Must be redirected to /license?from=%2Fdashboard
      await expect(page).toHaveURL(/\/license\?from=%2Fdashboard$/);
      await expect(page.getByTestId('license-activation-view')).toBeVisible();

      // Verify contextual redirection notice
      const redirectNotice = page.getByTestId('license-redirect-from-notice');
      await expect(redirectNotice).toBeVisible();
      await expect(redirectNotice.getByText('/dashboard')).toBeVisible();
    });

    test('should block access to /invoices and redirect unactivated customer to license screen', async ({
      page,
    }) => {
      await page.goto('/invoices');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/\/license\?from=%2Finvoices$/);
      await expect(page.getByTestId('license-activation-view')).toBeVisible();
      const redirectNotice = page.getByTestId('license-redirect-from-notice');
      await expect(redirectNotice).toBeVisible();
      await expect(redirectNotice.getByText('/invoices')).toBeVisible();
    });

    test('should allow access to public and admin routes even when unactivated', async ({
      page,
    }) => {
      // 1. /license is directly accessible
      await page.goto('/license');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/license$/);
      await expect(page.getByTestId('license-activation-view')).toBeVisible();

      // 2. /offline fallback is directly accessible
      await page.goto('/offline');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/offline$/);
      await expect(page.getByRole('heading', { name: 'Mode Offline Ficco' })).toBeVisible();

      // 3. /admin-dashboard/login has its own admin auth gate and is directly accessible
      await page.goto(adminLoginUrl);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(new RegExp(`${adminLoginUrl}$`));
      await expect(page.getByRole('heading', { name: 'Ficco Admin Portal' })).toBeVisible();
    });
  });

  test.describe('Activated State (Activated -> Application)', () => {
    test.beforeEach(async ({ page }) => {
      await seedActiveLicense(page, {
        licenseKey: 'FCC-TEST-PROT-1234-5678',
        customerName: 'PT Perlindungan Akses',
      });
    });

    test('should allow activated customer direct access to root (/) by redirecting to /dashboard', async ({
      page,
    }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole('heading', { name: 'Ringkasan Keuangan' })).toBeVisible();
    });

    test('should allow activated customer direct access to /dashboard, /invoices, /expenses, /reports', async ({
      page,
    }) => {
      // 1. Dashboard
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/dashboard$/);
      await expect(page.getByRole('heading', { name: 'Ringkasan Keuangan' })).toBeVisible();

      // 2. Invoices
      await page.goto('/invoices');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/invoices$/);

      // 3. Expenses
      await page.goto('/expenses');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/expenses$/);

      // 4. Reports
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/reports$/);
    });

    test('should not contact license server during normal application navigation (Zero unnecessary network calls)', async ({
      page,
    }) => {
      let licenseApiCallCount = 0;
      page.on('request', (req) => {
        if (req.url().includes('/api/license')) {
          licenseApiCallCount++;
        }
      });

      // Navigate between multiple application pages
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await page.goto('/invoices');
      await page.waitForLoadState('networkidle');

      await page.goto('/expenses');
      await page.waitForLoadState('networkidle');

      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      // Crucial Blueprint Criterion: "Do not unnecessarily contact the license server during every local operation"
      expect(licenseApiCallCount).toBe(0);
    });
  });

  test.describe('Complete Transition (Activation Unlocks Application)', () => {
    test('should unlock application immediately upon entering valid license from redirected state', async ({
      page,
    }) => {
      // 1. Create a fresh unused license via Admin Portal
      await page.goto(adminLoginUrl);
      await page.locator('#admin-username').fill('admin');
      await page.locator('#admin-password').fill('ficco-admin-2026');
      await page.getByRole('button', { name: /Masuk ke Admin Portal/i }).click();
      await expect(page).toHaveURL(new RegExp(`${adminDashboardUrl}$`));

      const customerName = `PT Bebas Akses ${Date.now().toString().slice(-4)}`;
      await page.getByTestId('open-create-license-modal-btn').click();
      await page.locator('#customerName').fill(customerName);
      await page.getByTestId('submit-create-license-btn').click();

      const newKey = (await page.getByTestId('created-license-key').innerText()).trim();
      expect(newKey).toBeTruthy();
      await page.getByRole('button', { name: 'Selesai' }).click();

      // 2. Clear customer license storage & attempt to open /invoices directly
      await page.evaluate(() => {
        localStorage.removeItem('ficco_license_store');
        localStorage.removeItem('ficco_activated_license');
      });

      await page.goto('/invoices');
      await page.waitForLoadState('networkidle');

      // Verify redirected to /license?from=%2Finvoices
      await expect(page).toHaveURL(/\/license\?from=%2Finvoices$/);
      await expect(page.getByTestId('license-redirect-from-notice')).toBeVisible();

      // 3. Submit valid license key
      await page.getByTestId('license-key-input').fill(newKey);
      await page.getByTestId('activate-license-submit-btn').click();

      // 4. Activation succeeds and shows continue button with destination (/invoices)
      await expect(page.getByTestId('activation-success-banner')).toBeVisible();
      const continueBtn = page.getByTestId('continue-to-destination-btn');
      await expect(continueBtn).toBeVisible();
      await expect(continueBtn).toContainText('/invoices');

      // 5. Click continue button -> successfully lands on /invoices
      await continueBtn.click();
      await expect(page).toHaveURL(/\/invoices$/);
    });
  });
});
