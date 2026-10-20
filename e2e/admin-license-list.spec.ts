import { test, expect } from '@playwright/test';

test.describe('Step 25: Admin License List & Complete Management', () => {
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

    // Seed demo licenses if needed to ensure at least some used and unused licenses exist
    const seedButton = page.getByRole('button', { name: /Seed 5 Lisensi Demo/i });
    if (await seedButton.isVisible()) {
      await seedButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display license list with search, filter tabs, and management columns', async ({ page }) => {
    // 1. Verify Header and Section
    await expect(page.getByText('Manajemen & Daftar Kunci Lisensi (Step 25)')).toBeVisible();

    // 2. Verify Search Input exists
    const searchInput = page.getByTestId('license-search-input');
    await expect(searchInput).toBeVisible();

    // 3. Verify Filter Tabs exist
    await expect(page.getByTestId('filter-tab-all')).toBeVisible();
    await expect(page.getByTestId('filter-tab-unused')).toBeVisible();
    await expect(page.getByTestId('filter-tab-used')).toBeVisible();

    // 4. Verify Table Headers
    await expect(page.getByRole('columnheader', { name: 'Kunci Lisensi' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Pelanggan' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Aksi Manajemen' })).toBeVisible();
  });

  test('should filter licenses using search input in real time', async ({ page }) => {
    // 1. Create a uniquely identifiable license first
    const uniqueName = `Pelanggan-Khusus-${Date.now().toString().slice(-4)}`;
    await page.getByTestId('open-create-license-modal-btn').click();
    await page.locator('#customerName').fill(uniqueName);
    await page.getByTestId('submit-create-license-btn').click();
    await expect(page.getByRole('heading', { name: 'Kunci Lisensi Berhasil Dibuat' })).toBeVisible();
    await page.getByRole('button', { name: 'Selesai' }).click();

    // 2. Verify the unique customer is initially in the list
    await expect(page.getByText(uniqueName)).toBeVisible();

    // 3. Search for the unique customer name
    const searchInput = page.getByTestId('license-search-input');
    await searchInput.fill(uniqueName);
    await expect(page.getByText(uniqueName)).toBeVisible();

    // 4. Search for a non-existent string
    await searchInput.fill('STRING-YANG-PASTI-TIDAK-ADA-123999');
    await expect(page.getByText(/Tidak ada lisensi yang cocok/i)).toBeVisible();

    // 5. Clear search
    await searchInput.fill('');
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test('should filter licenses by used and unused status tabs', async ({ page }) => {
    // 1. Click "Belum Digunakan" filter tab
    await page.getByTestId('filter-tab-unused').click();
    // All visible status badges should be "Belum Digunakan (Tersedia)"
    const usedBadges = page.locator('span:text-is("Digunakan")');
    expect(await usedBadges.count()).toBe(0);

    // 2. Click "Digunakan" filter tab
    await page.getByTestId('filter-tab-used').click();
    // All visible status badges should be "Digunakan"
    const unusedBadges = page.locator('span:text-is("Belum Digunakan (Tersedia)")');
    expect(await unusedBadges.count()).toBe(0);

    // 3. Click "Semua" filter tab
    await page.getByTestId('filter-tab-all').click();
  });

  test('should copy license key to clipboard when copy button is clicked', async ({ page }) => {
    // Click the copy button on the first license row
    const firstCopyBtn = page.locator('button[data-testid^="copy-btn-"]').first();
    await expect(firstCopyBtn).toBeVisible();
    await firstCopyBtn.click();

    // "Tersalin!" badge should appear
    await expect(page.getByText('Tersalin!').first()).toBeVisible();
  });

  test('should toggle used state of a license and update status badge in real time', async ({ page }) => {
    // Create a new unused license
    const uniqueToggleName = `User-Toggle-${Date.now().toString().slice(-4)}`;
    await page.getByTestId('open-create-license-modal-btn').click();
    await page.locator('#customerName').fill(uniqueToggleName);
    await page.getByTestId('submit-create-license-btn').click();
    await expect(page.getByRole('heading', { name: 'Kunci Lisensi Berhasil Dibuat' })).toBeVisible();
    await page.getByRole('button', { name: 'Selesai' }).click();

    // Search for the newly created license
    await page.getByTestId('license-search-input').fill(uniqueToggleName);
    const row = page.locator('tr', { hasText: uniqueToggleName });
    await expect(row).toBeVisible();

    // Verify it starts as "Belum Digunakan (Tersedia)"
    await expect(row.getByText(/Belum Digunakan/i)).toBeVisible();

    // Click "Tandai Digunakan"
    const toggleBtn = row.locator('button[data-testid^="toggle-used-btn-"]');
    await toggleBtn.click();

    // Status banner should confirm update
    await expect(page.getByTestId('list-action-banner')).toBeVisible();

    // Now status should be "Digunakan"
    await expect(row.getByText(/Digunakan/i).first()).toBeVisible();

    // Toggle back to "Tandai Tersedia"
    await toggleBtn.click();
    await expect(row.getByText(/Belum Digunakan/i)).toBeVisible();
  });

  test('should delete a license with confirmation modal', async ({ page }) => {
    // Create a temporary license to delete
    const uniqueDeleteName = `User-Delete-${Date.now().toString().slice(-4)}`;
    await page.getByTestId('open-create-license-modal-btn').click();
    await page.locator('#customerName').fill(uniqueDeleteName);
    await page.getByTestId('submit-create-license-btn').click();
    await expect(page.getByRole('heading', { name: 'Kunci Lisensi Berhasil Dibuat' })).toBeVisible();
    await page.getByRole('button', { name: 'Selesai' }).click();

    // Search for it
    await page.getByTestId('license-search-input').fill(uniqueDeleteName);
    const row = page.locator('tr', { hasText: uniqueDeleteName });
    await expect(row).toBeVisible();

    // Click delete button
    const deleteBtn = row.locator('button[data-testid^="delete-btn-"]');
    await deleteBtn.click();

    // Confirmation dialog should be visible
    await expect(page.getByRole('heading', { name: 'Hapus Kunci Lisensi?' })).toBeVisible();

    // Click confirm delete button
    await page.getByTestId('confirm-delete-btn').click();

    // Success action banner should appear
    await expect(page.getByTestId('list-action-banner')).toBeVisible();

    // Row should no longer exist
    await expect(page.getByText(uniqueDeleteName)).not.toBeVisible();
  });
});
