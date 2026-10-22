import { test, expect } from '@playwright/test';
import fs from 'fs';
import { seedActiveLicense } from './support/license-helper';

test.describe('Step 19: Backup UX & Data Management', () => {
  test.beforeEach(async ({ page }) => {
    await seedActiveLicense(page);
  });
  test('should display Data Management view with all required metrics and visual workflow', async ({ page }) => {
    // 1. Navigate to Settings page with data-management tab
    await page.goto('/settings?tab=data-management');
    await page.waitForLoadState('domcontentloaded');

    // 2. Verify Breadcrumb & Header
    await expect(page.getByRole('heading', { name: 'Manajemen Data & Cadangan' })).toBeVisible();

    // 3. Verify the 3 Key Display Metrics (Blueprint Step 19)
    await expect(page.getByText('Last Backup').first()).toBeVisible();
    await expect(page.getByText('Backup File Format').first()).toBeVisible();
    await expect(page.getByText('Data Size').first()).toBeVisible();

    // Verify format text
    await expect(page.getByText(/JSON \(Schema v1\)/i)).toBeVisible();

    // 4. Verify Visual 3-Step Workflow ("Understandable without documentation")
    await expect(page.getByText('Alur Kerja Cadangan Data (Backup Workflow)')).toBeVisible();
    await expect(page.getByText('Simpan di Perangkat')).toBeVisible();
    await expect(page.getByText('Ekspor Berkala', { exact: true })).toBeVisible();
    await expect(page.getByText('Pulihkan Kapan Saja')).toBeVisible();

    // 5. Verify FAQ Accordion Interaction
    const faqToggle = page.getByRole('button', { name: /Lihat Panduan & FAQ/i });
    await expect(faqToggle).toBeVisible();
    await faqToggle.click();
    await expect(page.getByText(/Apakah data saya aman jika saya berganti browser atau laptop\?/i)).toBeVisible();
    await expect(page.getByText(/Apakah ada risiko data hilang saat melakukan Impor data\?/i)).toBeVisible();
  });

  test('should switch between segment tabs (All, Export, Import)', async ({ page }) => {
    await page.goto('/settings?tab=data-management');
    await page.waitForLoadState('domcontentloaded');

    // Switch to Export segment
    const exportSegment = page.getByRole('button', { name: 'Ekspor Data (Export All Data)' });
    await exportSegment.click();
    await expect(page.getByRole('heading', { name: 'Ekspor Cadangan Data (.json)' })).toBeVisible();

    // Switch to Import segment
    const importSegment = page.getByRole('button', { name: 'Impor Data (Import Data)' });
    await importSegment.click();
    await expect(page.getByRole('heading', { name: 'Pulihkan Cadangan Data (.json)' })).toBeVisible();

    // Switch back to All Modules
    const allSegment = page.getByRole('button', { name: 'Semua Modul (Ekspor & Impor)' });
    await allSegment.click();
    await expect(page.getByRole('heading', { name: 'Ekspor Cadangan Data (.json)' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pulihkan Cadangan Data (.json)' })).toBeVisible();
  });

  test('should execute Export All Data and download valid JSON backup', async ({ page }) => {
    await page.goto('/settings?tab=data-management');
    await page.waitForLoadState('domcontentloaded');

    // Click Export All Data button in header
    const exportBtn = page.getByRole('button', { name: 'Export All Data', exact: true });
    await expect(exportBtn).toBeVisible();

    // Trigger download and await completion
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click(),
    ]);

    const filename = download.suggestedFilename();

    // Verify filename conforms to pattern invoice-app-backup-YYYY-MM-DD.json
    expect(filename).toMatch(/^invoice-app-backup-\d{4}-\d{2}-\d{2}\.json$/);

    // Save and verify downloaded file content
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    if (downloadPath) {
      const fileContent = fs.readFileSync(downloadPath, 'utf-8');
      const payload = JSON.parse(fileContent);

      expect(payload.format).toBe('invoice-app-backup');
      expect(payload.schemaVersion).toBe(1);
      expect(payload.data).toBeDefined();
      expect(payload.data.invoices).toBeDefined();
      expect(payload.data.expenses).toBeDefined();
      expect(payload.data.customers).toBeDefined();
      expect(payload.data.products).toBeDefined();
      expect(payload.data.payments).toBeDefined();
      expect(payload.data.settings).toBeDefined();
    }

    // Verify UI shows success banner
    await expect(page.getByText(/Berkas cadangan berhasil diunduh ke perangkat Anda!/i)).toBeVisible();
  });

  test('should also render properly on dedicated /backup route', async ({ page }) => {
    await page.goto('/backup');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: 'Manajemen Data & Cadangan' })).toBeVisible();
    await expect(page.getByText('Last Backup').first()).toBeVisible();
    await expect(page.getByText('Backup File Format').first()).toBeVisible();
    await expect(page.getByText('Data Size').first()).toBeVisible();
  });
});
