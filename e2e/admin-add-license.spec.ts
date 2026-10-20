import { test, expect } from '@playwright/test';

test.describe('Step 24: Admin Add License & Secure Generation', () => {
  const adminDashboardPath = '/admin-dashboard';
  const adminLoginPath = '/admin-dashboard/login';

  test.beforeEach(async ({ page }) => {
    // Authenticate as admin before each test
    await page.goto(adminLoginPath);
    await page.waitForLoadState('domcontentloaded');
    await page.locator('#admin-username').fill('admin');
    await page.locator('#admin-password').fill('ficco-admin-2026');
    await page.getByRole('button', { name: /Masuk ke Admin Portal/i }).click();
    await expect(page).toHaveURL(new RegExp(`${adminDashboardPath}$`));
  });

  test('should open add license modal, generate secure license, and verify used=false', async ({ page }) => {
    // 1. Click "Buat Lisensi Baru" button
    const openModalBtn = page.getByTestId('open-create-license-modal-btn');
    await expect(openModalBtn).toBeVisible();
    await openModalBtn.click();

    // 2. Modal should appear with Step 24 header
    await expect(page.getByRole('heading', { name: 'Buat Kunci Lisensi Baru' })).toBeVisible();
    await expect(page.getByText('Step 24: Add License')).toBeVisible();

    // 3. Fill customer metadata (optional)
    await page.locator('#customerName').fill('PT Sinergi Mandiri');
    await page.locator('#customerEmail').fill('finance@sinergimandiri.id');

    // 4. Submit form to generate & save license
    const submitBtn = page.getByTestId('submit-create-license-btn');
    await submitBtn.click();

    // 5. Success state must be displayed
    await expect(page.getByRole('heading', { name: 'Kunci Lisensi Berhasil Dibuat' })).toBeVisible();
    await expect(page.getByText('Status: Belum Digunakan (used=false)')).toBeVisible();

    // 6. Verify generated license key matches FCC format
    const keyElement = page.getByTestId('created-license-key');
    await expect(keyElement).toBeVisible();
    const generatedKey = await keyElement.innerText();
    expect(generatedKey).toMatch(/^FCC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);

    // 7. Verify Copy Button functionality
    const copyBtn = page.getByTestId('copy-license-btn');
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();
    await expect(page.getByText('Tersalin!')).toBeVisible();

    // 8. Close modal
    await page.getByRole('button', { name: 'Selesai' }).click();

    // 9. Verify success banner appears on dashboard
    await expect(page.getByTestId('success-banner')).toBeVisible();
    await expect(page.getByRole('cell', { name: generatedKey })).toBeVisible();

    // 10. Verify recent licenses table lists the new license with "Tersedia" (unused) status
    await expect(page.getByText('PT Sinergi Mandiri')).toBeVisible();
    await expect(page.getByText('finance@sinergimandiri.id')).toBeVisible();
  });

  test('should support creating a custom key and enforce uniqueness', async ({ page }) => {
    const customKey = `FCC-CUSTOM-${Date.now().toString().slice(-4)}-TEST-9999`;

    // 1. Open modal
    await page.getByTestId('open-create-license-modal-btn').click();

    // 2. Toggle custom key mode
    await page.getByRole('button', { name: /Masukkan Kunci Kustom/i }).click();

    // 3. Fill custom key
    await page.locator('#customKey').fill(customKey);
    await page.locator('#customerName').fill('Toko Barokah Jaya');

    // 4. Submit
    await page.getByTestId('submit-create-license-btn').click();

    // 5. Success state shows custom key
    await expect(page.getByRole('heading', { name: 'Kunci Lisensi Berhasil Dibuat' })).toBeVisible();
    await expect(page.getByTestId('created-license-key')).toHaveText(customKey);

    // 6. Close modal
    await page.getByRole('button', { name: 'Selesai' }).click();

    // 7. Attempting to create the exact same key must be rejected (uniqueness check)
    await page.getByTestId('open-create-license-modal-btn').click();
    await page.getByRole('button', { name: /Masukkan Kunci Kustom/i }).click();
    await page.locator('#customKey').fill(customKey);
    await page.getByTestId('submit-create-license-btn').click();

    // 8. Error banner should notify uniqueness violation
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByText(/sudah terdaftar/i)).toBeVisible();
  });

  test('should reject unauthenticated requests to POST /api/admin/licenses with 401', async ({ request }) => {
    // Send request without session cookie
    const response = await request.post('/api/admin/licenses', {
      data: {
        customerName: 'Hacker Inc',
      },
    });

    expect(response.status()).toBe(401);
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/Unauthorized/i);
  });

  test('should reject invalid payload via API with 400 Bad Request', async ({ page }) => {
    // Using authenticated page request
    const response = await page.request.post('/api/admin/licenses', {
      data: {
        customerEmail: 'not-an-email',
      },
    });

    expect(response.status()).toBe(400);
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toMatch(/email/i);
  });
});
