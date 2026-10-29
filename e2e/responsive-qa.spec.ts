import { test, expect } from '@playwright/test';
import { seedActiveLicense } from './support/license-helper';

/**
 * Step 32: Responsive QA
 *
 * Verifies multi-viewport responsiveness, touch layouts, and mobile-desktop adaptations
 * across the 7 focal areas designated in the PRD blueprint:
 * 1. Invoice form
 * 2. Invoice table
 * 3. Expense form
 * 4. Dashboard
 * 5. Reports
 * 6. Settings
 * 7. Backup/import UI
 *
 * Testing viewports and devices:
 * - Desktop Chrome / Desktop Edge (1280x800)
 * - Android Chrome (412x915 - Pixel 7 emulation)
 * - iOS Safari (390x844 - iPhone 14 emulation)
 * - Tablet (768x1024 - iPad emulation)
 */

test.describe('Step 32: Responsive QA', () => {
  test.beforeEach(async ({ page }) => {
    await seedActiveLicense(page);
  });

  // ===========================================================================
  // 1. DESKTOP VIEWPORT (1280x800) - Desktop Chrome / Edge
  // ===========================================================================
  test.describe('Desktop Chrome / Edge (1280x800)', () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test('Test 1.1: Desktop Shell, Sidebar, and Dashboard Layout', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Desktop sidebar must be visible
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // Mobile bottom nav must NOT be visible
      const bottomNav = page.locator('nav[aria-label="Mobile bottom navigation"]');
      await expect(bottomNav).toBeHidden();

      // Dashboard Header Title
      await expect(page.getByRole('heading', { name: 'Ringkasan Keuangan' })).toBeVisible();

      // Quick action button to create invoice points to /invoices/new
      const newInvoiceLink = page.locator('a[href="/invoices/new"]').first();
      await expect(newInvoiceLink).toBeVisible();

      // KPI Metrics Grid must be visible
      const metricsGrid = page.locator('text=Total Pendapatan').first();
      await expect(metricsGrid).toBeVisible();
    });

    test('Test 1.2: Desktop Invoice Table and List View', async ({ page }) => {
      await page.goto('/invoices');
      await page.waitForLoadState('networkidle');

      // On desktop, the table header row should be visible (if invoices exist or container rendered)
      const desktopTable = page.locator('table');
      const emptyState = page.getByText('Belum Ada Faktur').or(page.getByText('Faktur Tidak Ditemukan'));

      const hasTable = await desktopTable.isVisible().catch(() => false);
      const isEmpty = await emptyState.first().isVisible().catch(() => false);

      expect(hasTable || isEmpty).toBeTruthy();

      if (hasTable) {
        // Table columns must be visible
        await expect(page.locator('th', { hasText: 'Nomor Faktur' })).toBeVisible();
        await expect(page.locator('th', { hasText: 'Total Tagihan' })).toBeVisible();
      }
    });

    test('Test 1.3: Desktop Invoice Form Multi-Column Layout', async ({ page }) => {
      await page.goto('/invoices/new');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'Buat Faktur Baru' })).toBeVisible();

      // Customer selection section and Invoice Number section side-by-side
      await expect(page.getByText('Pilih Pelanggan / Klien')).toBeVisible();
      await expect(page.getByText('Nomor Faktur')).toBeVisible();

      // Line items section
      await expect(page.getByRole('heading', { name: 'Rincian Item & Jasa' })).toBeVisible();

      // Financial summary card
      await expect(page.getByRole('heading', { name: 'Ringkasan Finansial' })).toBeVisible();
    });

    test('Test 1.4: Desktop Expense Form Modal and Management', async ({ page }) => {
      await page.goto('/expenses');
      await page.waitForLoadState('networkidle');

      // Click button to open expense modal
      const addExpenseBtn = page.getByRole('button', { name: /Catat Pengeluaran/i }).first();
      await expect(addExpenseBtn).toBeVisible();
      await addExpenseBtn.click();

      // Expense form modal must appear
      const modalHeading = page.getByRole('heading', { name: 'Catat Pengeluaran Baru' });
      await expect(modalHeading).toBeVisible();

      // Close modal
      const closeBtn = page.getByRole('button', { name: 'Batal' });
      await closeBtn.click();
      await expect(modalHeading).toBeHidden();
    });

    test('Test 1.5: Desktop Reports View, KPI Cards, and Charts', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'Laporan Keuangan' })).toBeVisible();

      // Action buttons: Export CSV, Print
      await expect(page.getByRole('button', { name: 'Ekspor CSV' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Cetak Laporan' })).toBeVisible();

      // Navigation tabs visible
      await expect(page.getByRole('button', { name: 'Ringkasan Laba Rugi' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Laporan Pendapatan' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Laporan Pengeluaran' })).toBeVisible();
    });

    test('Test 1.6: Desktop Settings Tabs and Business Profile', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'Pengaturan Bisnis' })).toBeVisible();

      // Check all 4 tabs exist
      await expect(page.getByRole('button', { name: 'Profil Usaha & Identitas' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Default Faktur & Penomoran' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Data Management' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Aplikasi & PWA' })).toBeVisible();
    });

    test('Test 1.7: Desktop Backup & Data Management UI', async ({ page }) => {
      await page.goto('/backup');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'Manajemen Data & Cadangan' })).toBeVisible();

      // Metric cards
      await expect(page.locator('span', { hasText: 'Last Backup' }).first()).toBeVisible();
      await expect(page.getByText('Backup File Format').first()).toBeVisible();
      await expect(page.getByText('Data Size').first()).toBeVisible();

      // Action buttons in header
      await expect(page.getByRole('button', { name: 'Export All Data', exact: true }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'Import Data', exact: true }).first()).toBeVisible();
    });
  });

  // ===========================================================================
  // 2. ANDROID CHROME VIEWPORT (412x915 - Pixel 7)
  // ===========================================================================
  test.describe('Android Chrome Mobile (412x915)', () => {
    test.use({
      viewport: { width: 412, height: 915 },
      userAgent:
        'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    });

    test('Test 2.1: Mobile Shell, BottomNav, and Hamburger Drawer', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Desktop sidebar must be hidden
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeHidden();

      // Mobile Bottom Nav must be visible
      const bottomNav = page.locator('nav[aria-label="Mobile bottom navigation"]');
      await expect(bottomNav).toBeVisible();

      // BottomNav primary links
      await expect(bottomNav.getByRole('link', { name: 'Dashboard' })).toBeVisible();
      await expect(bottomNav.getByRole('link', { name: 'Invoices' })).toBeVisible();
      await expect(bottomNav.getByRole('link', { name: 'Expenses' })).toBeVisible();
      await expect(bottomNav.getByRole('link', { name: 'Reports' })).toBeVisible();

      // Test Hamburger button opens MobileNav slide-over drawer
      const hamburgerBtn = page.locator('button[aria-label="Open navigation menu"]');
      await expect(hamburgerBtn).toBeVisible();
      await hamburgerBtn.click();

      // Drawer should now be visible
      const drawer = page.locator('div[aria-hidden="false"]');
      await expect(drawer).toBeVisible();

      // Close drawer with Close button
      const closeDrawerBtn = page.locator('button[aria-label="Close menu"]');
      await closeDrawerBtn.click();
      await expect(page.locator('div[aria-hidden="true"]')).toBeVisible();
    });

    test('Test 2.2: Mobile Invoice List / Cards and Actions', async ({ page }) => {
      await page.goto('/invoices');
      await page.waitForLoadState('networkidle');

      // Desktop table (hidden on md) should NOT be visible
      const desktopTable = page.locator('.hidden.md\\:block table');
      await expect(desktopTable).toBeHidden();

      // Page heading should be visible and not clipped
      await expect(page.getByRole('heading', { name: 'Faktur Penjualan' })).toBeVisible();

      // Search bar and filter buttons must be accessible on mobile
      const searchInput = page.locator('input[placeholder*="Cari nomor faktur"]');
      await expect(searchInput).toBeVisible();
    });

    test('Test 2.3: Mobile Invoice Creation Form Stacking and Inputs', async ({ page }) => {
      await page.goto('/invoices/new');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'Buat Faktur Baru' })).toBeVisible();

      // Inputs should be vertically stacked and fully interactive
      const customerSelect = page.locator('text=Pilih Pelanggan / Klien');
      await expect(customerSelect).toBeVisible();

      const invoiceNumInput = page.locator('input[name="invoiceNumber"]');
      await expect(invoiceNumInput).toBeVisible();

      // Issue date and due date inputs
      await expect(page.locator('input[name="issueDate"]')).toBeVisible();
      await expect(page.locator('input[name="dueDate"]')).toBeVisible();

      // Financial Grand Total must be visible
      await expect(page.getByText('Grand Total:')).toBeVisible();
    });

    test('Test 2.4: Mobile Expense Modal Form Scrollability and Touch Controls', async ({
      page,
    }) => {
      await page.goto('/expenses');
      await page.waitForLoadState('networkidle');

      const addBtn = page.getByRole('button', { name: /Catat Pengeluaran/i }).first();
      await addBtn.click();

      // Modal container should fit within mobile viewport
      const modal = page.getByRole('heading', { name: 'Catat Pengeluaran Baru' });
      await expect(modal).toBeVisible();

      // Check fields are accessible within the scrollable modal body
      await expect(page.locator('input[name="date"]')).toBeVisible();
      await expect(page.locator('input[name="amount"]')).toBeVisible();
      await expect(page.locator('input[name="description"]')).toBeVisible();

      // Cancel button dismisses modal
      const cancelBtn = page.getByRole('button', { name: 'Batal' });
      await cancelBtn.click();
      await expect(modal).toBeHidden();
    });

    test('Test 2.5: Mobile Reports View Tabs Scrollability', async ({ page }) => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'Laporan Keuangan' })).toBeVisible();

      // Tabs should be present and clickable
      const profitLossTab = page.getByRole('button', { name: 'Ringkasan Laba Rugi' });
      const revenueTab = page.getByRole('button', { name: 'Laporan Pendapatan' });
      const expensesTab = page.getByRole('button', { name: 'Laporan Pengeluaran' });

      await expect(profitLossTab).toBeVisible();
      await revenueTab.click();
      await expect(page.getByText('Total Ditagihkan').first()).toBeVisible();

      await expensesTab.click();
      await expect(page.getByText('Total Beban').first()).toBeVisible();
    });

    test('Test 2.6: Mobile Settings Tabs and Navigation', async ({ page }) => {
      await page.goto('/settings');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'Pengaturan Bisnis' })).toBeVisible();

      // Tabs must be clickable on mobile
      const profileTab = page.getByRole('button', { name: 'Profil Usaha & Identitas' });
      const invoiceTab = page.getByRole('button', { name: 'Default Faktur & Penomoran' });
      const dataMgmtTab = page.getByRole('button', { name: 'Data Management' });

      await expect(profileTab).toBeVisible();
      await invoiceTab.click();
      await expect(page.getByText('Preview Format Nomor Faktur Selanjutnya:')).toBeVisible();

      await dataMgmtTab.click();
      await expect(page.getByRole('heading', { name: 'Manajemen Data & Cadangan' })).toBeVisible();
    });

    test('Test 2.7: Mobile Backup / Import UI Responsive Layout', async ({ page }) => {
      await page.goto('/backup');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'Manajemen Data & Cadangan' })).toBeVisible();

      // Action buttons should wrap and be tapable
      const exportBtn = page.getByRole('button', { name: 'Export All Data', exact: true }).first();
      const importBtn = page.getByRole('button', { name: 'Import Data', exact: true }).first();

      await expect(exportBtn).toBeVisible();
      await expect(importBtn).toBeVisible();

      // Dropzone or file picker trigger must be visible
      await expect(page.getByText('Pilih atau seret berkas cadangan ke sini')).toBeVisible();
    });
  });

  // ===========================================================================
  // 3. iOS SAFARI VIEWPORT (390x844 - iPhone 14) & NO-OVERFLOW CHECK
  // ===========================================================================
  test.describe('iOS Safari Mobile (390x844)', () => {
    test.use({
      viewport: { width: 390, height: 844 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });

    const routesToCheck = [
      '/dashboard',
      '/invoices',
      '/invoices/new',
      '/expenses',
      '/reports',
      '/settings',
      '/backup',
    ];

    for (const route of routesToCheck) {
      test(`Test 3: No horizontal document overflow on ${route}`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');

        // Verify that documentElement does not scroll horizontally beyond window width
        const hasHorizontalOverflow = await page.evaluate(() => {
          const doc = document.documentElement;
          return doc.scrollWidth > window.innerWidth;
        });

        expect(
          hasHorizontalOverflow,
          `Route ${route} should not have unwanted horizontal document bleed`
        ).toBeFalsy();
      });
    }

    test('Test 3.1: Mobile Bottom Navigation switches routes seamlessly on iOS Safari', async ({
      page,
    }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      const bottomNav = page.locator('nav[aria-label="Mobile bottom navigation"]');

      // Click Invoices in BottomNav
      await bottomNav.getByRole('link', { name: 'Invoices' }).click();
      await page.waitForURL('**/invoices');
      await expect(page.getByRole('heading', { name: 'Faktur Penjualan' })).toBeVisible();

      // Click Expenses in BottomNav
      await bottomNav.getByRole('link', { name: 'Expenses' }).click();
      await page.waitForURL('**/expenses');
      await expect(page.getByRole('heading', { name: 'Pengeluaran' })).toBeVisible();

      // Click Reports in BottomNav
      await bottomNav.getByRole('link', { name: 'Reports' }).click();
      await page.waitForURL('**/reports');
      await expect(page.getByRole('heading', { name: 'Laporan Keuangan' })).toBeVisible();
    });

    test('Test 3.2: Mobile More Button in BottomNav opens MobileNav drawer', async ({
      page,
    }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // Click "More" button in BottomNav
      const moreBtn = page.getByRole('button', { name: 'More navigation options' });
      await expect(moreBtn).toBeVisible();
      await moreBtn.click();

      // MobileNav drawer should appear
      const drawer = page.locator('div[aria-hidden="false"]');
      await expect(drawer).toBeVisible();

      // Navigate to Settings from Drawer
      const settingsDrawerLink = drawer.getByRole('link', { name: 'Settings' });
      await settingsDrawerLink.click();
      await page.waitForURL('**/settings');
      await expect(page.getByRole('heading', { name: 'Pengaturan Bisnis' })).toBeVisible();
    });
  });

  // ===========================================================================
  // 4. TABLET VIEWPORT (768x1024 - iPad)
  // ===========================================================================
  test.describe('Tablet iPad (768x1024)', () => {
    test.use({
      viewport: { width: 768, height: 1024 },
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    });

    test('Test 4.1: Tablet Sidebar Collapse / Expand Toggle', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      // On tablet (768px = md breakpoint), sidebar is visible
      const sidebar = page.locator('aside');
      await expect(sidebar).toBeVisible();

      // Check initial width is w-64
      await expect(sidebar).toHaveClass(/w-64/);

      // Click collapse toggle button
      const collapseBtn = sidebar.locator('button[aria-label*="sidebar"]');
      await collapseBtn.click();

      // Sidebar should transition to w-20
      await expect(sidebar).toHaveClass(/w-20/);

      // Click again to expand
      await collapseBtn.click();
      await expect(sidebar).toHaveClass(/w-64/);
    });

    test('Test 4.2: Tablet Dashboard and Reports Layout', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'Ringkasan Keuangan' })).toBeVisible();
      await expect(page.locator('text=Total Pendapatan').first()).toBeVisible();

      // Navigate to Reports
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      await expect(page.getByRole('heading', { name: 'Laporan Keuangan' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Ringkasan Laba Rugi' })).toBeVisible();
    });
  });
});
