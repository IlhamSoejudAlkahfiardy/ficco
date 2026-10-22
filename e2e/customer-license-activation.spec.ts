import { test, expect } from '@playwright/test';

test.describe('Step 26: Customer License Activation Flow', () => {
  const licensePageUrl = '/license';
  const adminLoginUrl = '/admin-dashboard/login';
  const adminDashboardUrl = '/admin-dashboard';

  test.beforeEach(async ({ page }) => {
    // Clear localStorage on customer device before each test
    await page.goto(licensePageUrl);
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      localStorage.removeItem('ficco_activated_license');
      localStorage.removeItem('ficco_license_store');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test('should display license activation screen with inputs, device id, and educational cards', async ({
    page,
  }) => {
    // 1. Verify Header and Section
    await expect(page.getByTestId('license-activation-view')).toBeVisible();
    await expect(
      page.getByText('Step 26: Customer License Activation')
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Aktivasi Lisensi Perangkat' })
    ).toBeVisible();

    // 2. Initial status must show "Belum Diaktivasi"
    await expect(page.getByText('Belum Diaktivasi')).toBeVisible();

    // 3. Verify Form elements
    await expect(page.getByTestId('license-key-input')).toBeVisible();
    await expect(
      page.getByTestId('activate-license-submit-btn')
    ).toBeVisible();
    await expect(
      page.getByTestId('device-fingerprint-display')
    ).toBeVisible();

    // 4. Verify Local-First and Offline education cards
    await expect(page.getByText('100% Local-First & Privat')).toBeVisible();
    await expect(page.getByText('Operasional Offline Bebas')).toBeVisible();
    await expect(page.getByText('Satu Lisensi Satu Perangkat')).toBeVisible();
  });

  test('should reject short or invalid license format via client-side validation', async ({
    page,
  }) => {
    const keyInput = page.getByTestId('license-key-input');
    const submitBtn = page.getByTestId('activate-license-submit-btn');

    // Fill with a string shorter than 12 characters
    await keyInput.fill('FCC-SHORT');
    await submitBtn.click();

    // Validation error must appear without calling API
    await expect(page.getByTestId('license-key-error')).toBeVisible();
    await expect(
      page.getByText('Kunci lisensi terlalu pendek (minimal 12 karakter).')
    ).toBeVisible();
  });

  test('should reject unknown / non-existent license key (HTTP 404 NOT_FOUND)', async ({
    page,
  }) => {
    const keyInput = page.getByTestId('license-key-input');
    const submitBtn = page.getByTestId('activate-license-submit-btn');

    // Fill a formatted but non-existent key
    await keyInput.fill('FCC-NONE-9999-XXXX-0000');
    await submitBtn.click();

    // Error alert banner must be displayed
    const errorAlert = page.getByTestId('activation-error-alert');
    await expect(errorAlert).toBeVisible();
    await expect(
      errorAlert.getByText('Kunci Lisensi Tidak Ditemukan', { exact: true })
    ).toBeVisible();
    await expect(
      errorAlert.getByText('Kunci lisensi tidak ditemukan di sistem.')
    ).toBeVisible();
  });

  test('should successfully activate an unused valid license and display registered details', async ({
    page,
  }) => {
    // 1. Create a fresh unused license via Admin Portal first
    await page.goto(adminLoginUrl);
    await page.locator('#admin-username').fill('admin');
    await page.locator('#admin-password').fill('ficco-admin-2026');
    await page.getByRole('button', { name: /Masuk ke Admin Portal/i }).click();
    await expect(page).toHaveURL(new RegExp(`${adminDashboardUrl}$`));

    const customerName = `PT Sukses Makmur ${Date.now().toString().slice(-4)}`;
    const customerEmail = 'finance@suksesmakmur.test';

    await page.getByTestId('open-create-license-modal-btn').click();
    await page.locator('#customerName').fill(customerName);
    await page.locator('#customerEmail').fill(customerEmail);
    await page.getByTestId('submit-create-license-btn').click();

    await expect(
      page.getByRole('heading', { name: 'Kunci Lisensi Berhasil Dibuat' })
    ).toBeVisible();
    const generatedKey = await page
      .getByTestId('created-license-key')
      .innerText();
    expect(generatedKey).toBeTruthy();
    await page.getByRole('button', { name: 'Selesai' }).click();

    // 2. Navigate to Customer License Activation screen
    await page.goto(licensePageUrl);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('license-key-input')).toBeVisible();

    // 3. Fill the valid unused license key
    await page.getByTestId('license-key-input').fill(generatedKey);
    await page.getByTestId('activate-license-submit-btn').click();

    // 4. Verify Activation Succeeded
    await expect(
      page.getByTestId('activation-success-banner')
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Aplikasi Berhasil Diaktivasi!' })
    ).toBeVisible();
    await expect(page.getByTestId('registered-license-key')).toHaveText(
      generatedKey
    );
    await expect(page.getByText(customerName)).toBeVisible();
    await expect(page.getByText(customerEmail)).toBeVisible();
    await expect(page.getByText('Perangkat Teraktivasi', { exact: true })).toBeVisible();

    // 5. Verify Link to Dashboard is available
    const dashboardLink = page.getByRole('link', {
      name: /Buka Dashboard Aplikasi/i,
    });
    await expect(dashboardLink).toBeVisible();
  });

  test('should reject an already used license key (HTTP 409 ALREADY_USED)', async ({
    page,
  }) => {
    // 1. Create a fresh license via Admin Portal
    await page.goto(adminLoginUrl);
    await page.locator('#admin-username').fill('admin');
    await page.locator('#admin-password').fill('ficco-admin-2026');
    await page.getByRole('button', { name: /Masuk ke Admin Portal/i }).click();

    const customerName = `CV Mandiri Perkasa ${Date.now().toString().slice(-4)}`;
    await page.getByTestId('open-create-license-modal-btn').click();
    await page.locator('#customerName').fill(customerName);
    await page.getByTestId('submit-create-license-btn').click();
    const validKey = await page.getByTestId('created-license-key').innerText();
    await page.getByRole('button', { name: 'Selesai' }).click();

    // 2. Activate the key for the first time
    await page.goto(licensePageUrl);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('license-key-input').fill(validKey);
    await page.getByTestId('activate-license-submit-btn').click();
    await expect(page.getByTestId('activation-success-banner')).toBeVisible();

    // 3. Now simulate trying to activate this already-used key on another session / device
    // Reset local cache to return to the input form
    await page.getByTestId('reactivate-btn').click();
    await expect(page.getByTestId('license-key-input')).toBeVisible();

    // Try submitting the exact same key again
    await page.getByTestId('license-key-input').fill(validKey);
    await page.getByTestId('activate-license-submit-btn').click();

    // 4. Must be rejected with ALREADY_USED error
    const usedErrorAlert = page.getByTestId('activation-error-alert');
    await expect(usedErrorAlert).toBeVisible();
    await expect(
      usedErrorAlert.getByText('Lisensi Sudah Pernah Digunakan', { exact: true })
    ).toBeVisible();
    await expect(
      usedErrorAlert.getByText('Kunci lisensi sudah pernah digunakan pada perangkat lain.')
    ).toBeVisible();
  });

  test('should allow user to change license key via re-activation flow', async ({
    page,
  }) => {
    // 1. Create two separate licenses
    await page.goto(adminLoginUrl);
    await page.locator('#admin-username').fill('admin');
    await page.locator('#admin-password').fill('ficco-admin-2026');
    await page.getByRole('button', { name: /Masuk ke Admin Portal/i }).click();

    // License 1
    await page.getByTestId('open-create-license-modal-btn').click();
    await page.locator('#customerName').fill('User A');
    await page.getByTestId('submit-create-license-btn').click();
    const key1 = await page.getByTestId('created-license-key').innerText();
    await page.getByRole('button', { name: 'Selesai' }).click();

    // License 2
    await page.getByTestId('open-create-license-modal-btn').click();
    await page.locator('#customerName').fill('User B');
    await page.getByTestId('submit-create-license-btn').click();
    const key2 = await page.getByTestId('created-license-key').innerText();
    await page.getByRole('button', { name: 'Selesai' }).click();

    // 2. Activate with License 1
    await page.goto(licensePageUrl);
    await page.waitForLoadState('networkidle');
    await page.getByTestId('license-key-input').fill(key1);
    await page.getByTestId('activate-license-submit-btn').click();
    await expect(page.getByTestId('activation-success-banner')).toBeVisible();
    await expect(page.getByTestId('registered-license-key')).toHaveText(key1);

    // 3. Click "Ganti Kunci / Aktivasi Ulang"
    await page.getByTestId('reactivate-btn').click();
    await expect(page.getByTestId('license-key-input')).toBeVisible();

    // 4. Fill with License 2 and submit
    await page.getByTestId('license-key-input').fill(key2);
    await page.getByTestId('activate-license-submit-btn').click();

    // 5. Must now display License 2 as active
    await expect(page.getByTestId('activation-success-banner')).toBeVisible();
    await expect(page.getByTestId('registered-license-key')).toHaveText(key2);
    await expect(page.getByText('User B')).toBeVisible();
  });
});
