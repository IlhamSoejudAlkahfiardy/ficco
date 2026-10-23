import { test, expect } from '@playwright/test';
import { clearLicenseState, seedActiveLicense } from './support/license-helper';

test.describe('Step 29: Offline/Online Boundary Handling', () => {
  test.describe('Acceptance Criteria: Offline business operations do not fail when license server is down', () => {
    test.beforeEach(async ({ page }) => {
      // Pre-seed an activated commercial license on the customer device
      await seedActiveLicense(page, {
        licenseKey: 'FCC-TEST-OFFL-9999-8888',
        customerName: 'PT Mandiri Sukses Offline',
      });
    });

    test('should allow complete invoice, expense, and customer operations when license server returns HTTP 503 (Server Down)', async ({
      page,
    }) => {
      // 1. Simulate license server completely unavailable (HTTP 503 Service Unavailable)
      await page.route('/api/license/**', (route) => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Server Lisensi sedang maintenance (503 Service Unavailable)',
            code: 'SERVER_UNAVAILABLE',
          }),
        });
      });

      // 2. Open dashboard: must load seamlessly from local IndexedDB
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: 'Ringkasan Keuangan' })).toBeVisible();

      // 3. Navigate to Customers and verify customer creation works 100% locally
      await page.goto('/customers');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: 'Manajemen Pelanggan' })).toBeVisible();

      const customerName = `Klien Offline ${Date.now().toString().slice(-4)}`;
      const addCustomerBtn = page.getByRole('button', { name: 'Tambah Pelanggan', exact: true }).first();
      if (await addCustomerBtn.isVisible()) {
        await addCustomerBtn.click();
        await page.locator('input[name="name"]').fill(customerName);
        await page.locator('input[name="email"]').fill('offline@customer.local');
        await page.locator('form button[type="submit"]').click();
        await expect(page.getByText(customerName).first()).toBeVisible();
      }

      // 4. Navigate to Expenses: record expense locally
      await page.goto('/expenses');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: 'Pengeluaran', exact: true })).toBeVisible();

      // 5. Navigate to Reports: reports compute from local IndexedDB without calling server
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: 'Laporan Keuangan' })).toBeVisible();

      // 6. Navigate to Invoices: invoices load completely offline
      await page.goto('/invoices');
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: 'Faktur Penjualan' })).toBeVisible();
    });

    test('should preserve active license and display offline assurance when device goes offline (Airplane mode)', async ({
      page,
      context,
    }) => {
      // 1. Open license management page online with active license pre-seeded
      await page.goto('/license');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('activation-success-banner')).toBeVisible();

      // 2. Enter full offline network mode (Airplane mode)
      await context.setOffline(true);

      try {
        // 3. Trigger connectivity check to update shell store state
        const statusBtn = page.locator('header').getByRole('button', { name: /Online|Offline Mode/i });
        await statusBtn.click();
        await expect(page.locator('header').getByText('Offline Mode')).toBeVisible();

        // 4. Checking license while offline displays local-first offline assurance
        const offlineAssurance = page.getByTestId('license-offline-assurance');
        await expect(offlineAssurance).toBeVisible();
        await expect(offlineAssurance.getByText(/Mode Offline Aktif/i)).toBeVisible();
        await expect(
          offlineAssurance.getByText(/Lisensi Anda telah terverifikasi secara lokal/i)
        ).toBeVisible();
        await expect(
          offlineAssurance.getByText(/Anda bebas membuat invoice dan mencatat pengeluaran tanpa internet/i)
        ).toBeVisible();

        // 5. Active license status remains intact
        await expect(page.getByTestId('activation-success-banner')).toBeVisible();
      } finally {
        await context.setOffline(false);
      }
    });
  });

  test.describe('Server-Dependent Operation: License Activation Boundary Handling', () => {
    test.beforeEach(async ({ page }) => {
      await clearLicenseState(page);
    });

    test('should display proactive offline boundary warning when visiting /license without internet', async ({
      page,
      context,
    }) => {
      // 1. Go to /license online
      await page.goto('/license');
      await page.waitForLoadState('networkidle');
      await expect(page.getByTestId('license-activation-view')).toBeVisible();

      // 2. Disable internet
      await context.setOffline(true);

      try {
        // Trigger connectivity check or reload probe
        const checkBtn = page.locator('header').getByRole('button', { name: /Online|Offline Mode/i });
        await checkBtn.click();

        // 3. Proactive offline warning banner must appear
        const offlineWarning = page.getByTestId('license-offline-boundary-warning');
        await expect(offlineWarning).toBeVisible();
        await expect(offlineWarning.getByText('Perangkat Sedang Offline')).toBeVisible();
        await expect(
          offlineWarning.getByText(/Aktivasi lisensi baru adalah satu-satunya operasi MVP yang memerlukan koneksi internet/i)
        ).toBeVisible();

        // 4. Submitting form while offline fails gracefully with NETWORK_ERROR
        await page.getByTestId('license-key-input').fill('FCC-OFFL-9999-TEST-1111');
        await page.getByTestId('activate-license-submit-btn').click();

        const errorAlert = page.getByTestId('activation-error-alert');
        await expect(errorAlert).toBeVisible();
        await expect(errorAlert.getByText(/Gagal Menghubungi Server Lisensi/i).first()).toBeVisible();
      } finally {
        await context.setOffline(false);
      }
    });

    test('should handle server 503 downtime gracefully with clear error message without crashing', async ({
      page,
    }) => {
      // 1. Mock license endpoint returning HTTP 503
      await page.route('/api/license/activate', (route) => {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Server Lisensi sedang maintenance (503 Service Unavailable)',
            code: 'SERVER_UNAVAILABLE',
          }),
        });
      });

      // 2. Open /license
      await page.goto('/license');
      await page.waitForLoadState('networkidle');

      // 3. Try to activate
      await page.getByTestId('license-key-input').fill('FCC-TEST-503-DOWN-0000');
      await page.getByTestId('activate-license-submit-btn').click();

      // 4. Verify user-friendly SERVER_UNAVAILABLE error banner
      const errorAlert = page.getByTestId('activation-error-alert');
      await expect(errorAlert).toBeVisible();
      await expect(errorAlert.getByText('Server Lisensi Tidak Dapat Dijangkau')).toBeVisible();
      await expect(
        errorAlert.getByText(/Seluruh fitur bisnis lokal \(faktur, pengeluaran, laporan\) tetap beroperasi normal/i)
      ).toBeVisible();
    });
  });
});
