import type { Page } from '@playwright/test';

export interface SeedActiveLicenseOptions {
  licenseKey?: string;
  customerName?: string;
  customerEmail?: string;
}

/**
 * Pre-seeds an activated commercial license state into localStorage before any page script executes.
 * Ideal for E2E tests that test post-activation features (e.g. Invoices, Expenses, Dashboard, Backup).
 */
export async function seedActiveLicense(
  page: Page,
  options: SeedActiveLicenseOptions = {}
) {
  const licenseKey = options.licenseKey || 'FCC-TEST-PASS-1234-5678';
  const customerName = options.customerName || 'CV Ficco Test Active';
  const customerEmail = options.customerEmail || 'finance@ficcotest.local';

  await page.addInitScript(
    ({ key, name, email }) => {
      const storeState = {
        state: {
          isActivated: true,
          licenseKey: key,
          customerName: name,
          customerEmail: email,
          activatedAt: new Date().toISOString(),
          deviceFingerprint: 'DEV-TEST-SEEDED-FINGERPRINT',
          lastVerifiedAt: new Date().toISOString(),
        },
        version: 0,
      };

      try {
        localStorage.setItem(
          'ficco_license_store',
          JSON.stringify(storeState)
        );
        localStorage.setItem(
          'ficco_activated_license',
          JSON.stringify(storeState.state)
        );
      } catch {
        // Ignore
      }
    },
    { key: licenseKey, name: customerName, email: customerEmail }
  );
}

/**
 * Clears license state in localStorage before each test run for unactivated tests.
 */
export async function clearLicenseState(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem('ficco_license_store');
      localStorage.removeItem('ficco_activated_license');
    } catch {
      // Ignore
    }
  });
}
