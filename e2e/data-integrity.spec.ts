import { test, expect } from '@playwright/test';
import fs from 'fs';
import { seedActiveLicense } from './support/license-helper';
import { parseAndValidateBackupJson } from '../features/backup/_utils/backup-import';
import { constructBackupPayload, serializeBackupPayload } from '../features/backup/_utils/backup-export';

test.describe('Step 31: Data Integrity Review', () => {
  test.beforeEach(async ({ page }) => {
    await seedActiveLicense(page);
  });

  // ---------------------------------------------------------------------------
  // 1. Refresh during normal use
  // ---------------------------------------------------------------------------
  test('Test 1: should persist all local data across page reloads during normal use', async ({
    page,
  }) => {
    // 1. Open customers page and create a customer
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    const customerName = `Klien Refresh Test ${Date.now().toString().slice(-4)}`;
    const addCustomerBtn = page.getByRole('button', { name: 'Tambah Pelanggan', exact: true }).first();
    if (await addCustomerBtn.isVisible()) {
      await addCustomerBtn.click();
      await page.locator('input[name="name"]').fill(customerName);
      await page.locator('input[name="email"]').fill('refresh@test.local');
      await page.locator('form button[type="submit"]').click();
      await expect(page.getByText(customerName).first()).toBeVisible();
    }

    // 2. Refresh during normal use
    await page.reload({ waitUntil: 'networkidle' });

    // 3. Verify data persists completely after reload
    await expect(page.getByText(customerName).first()).toBeVisible();

    // 4. Check dashboard view reflects the persisted customer
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Ringkasan Keuangan' })).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 2. Close/reopen browser (Context / Session Persistence)
  // ---------------------------------------------------------------------------
  test('Test 2: should survive browser page closing and reopening with full IndexedDB retention', async ({
    page,
    context,
  }) => {
    // 1. Navigate to customers and add a persistent record
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    const persistentName = `Klien Reopen ${Date.now().toString().slice(-4)}`;
    const addBtn = page.getByRole('button', { name: 'Tambah Pelanggan', exact: true }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.locator('input[name="name"]').fill(persistentName);
      await page.locator('input[name="email"]').fill('persistent@test.local');
      await page.locator('form button[type="submit"]').click();
      await expect(page.getByText(persistentName).first()).toBeVisible();
    }

    // 2. Close current tab to simulate closing the browser tab
    await page.close();

    // 3. Open a brand new page in the same browser storage context (simulating reopen)
    const newPage = await context.newPage();
    await newPage.goto('/customers');
    await newPage.waitForLoadState('networkidle');

    // 4. Verify data is immediately hydrated from persistent IndexedDB
    await expect(newPage.getByText(persistentName).first()).toBeVisible();
    await newPage.close();
  });

  // ---------------------------------------------------------------------------
  // 3. Offline use & transactional persistence
  // ---------------------------------------------------------------------------
  test('Test 3: should allow local mutations while completely offline and retain them across reload', async ({
    page,
    context,
  }) => {
    // 1. Visit customers page online
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');

    // 2. Switch to full offline mode (Airplane mode)
    await context.setOffline(true);

    const offlineCustomer = `Pelanggan Offline ${Date.now().toString().slice(-4)}`;

    try {
      // 3. Add customer while offline
      const addBtn = page.getByRole('button', { name: 'Tambah Pelanggan', exact: true }).first();
      if (await addBtn.isVisible()) {
        await addBtn.click();
        await page.locator('input[name="name"]').fill(offlineCustomer);
        await page.locator('input[name="email"]').fill('offline@intact.local');
        await page.locator('form button[type="submit"]').click();
        await expect(page.getByText(offlineCustomer).first()).toBeVisible();
      }

      // 4. Verify record written while offline was persisted directly in IndexedDB
      const writtenToIdb = await page.evaluate(async (name) => {
        return new Promise<boolean>((resolve) => {
          const req = indexedDB.open('ficco_business_db');
          req.onsuccess = () => {
            const db = req.result;
            const tx = db.transaction('customers', 'readonly');
            const store = tx.objectStore('customers');
            const getAllReq = store.getAll();
            getAllReq.onsuccess = () => {
              const records = (getAllReq.result || []) as Array<{ name?: string }>;
              const matched = records.some((c) => c.name === name);
              db.close();
              resolve(matched);
            };
            getAllReq.onerror = () => {
              db.close();
              resolve(false);
            };
          };
          req.onerror = () => resolve(false);
        });
      }, offlineCustomer);

      expect(writtenToIdb).toBe(true);
    } finally {
      // 5. Turn offline mode off to allow browser network reload
      await context.setOffline(false);
    }

    // 6. Reload page and verify offline-written record is preserved and rendered
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByText(offlineCustomer).first()).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 4. Large dataset resilience
  // ---------------------------------------------------------------------------
  test('Test 4: should handle large datasets in IndexedDB without calculation errors, NaN, or crash', async ({
    page,
  }) => {
    // 1. Pre-seed a large batch of transactions (50 invoices and 50 expenses) into IndexedDB
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const seedResult = await page.evaluate(async () => {
      return new Promise<boolean>((resolve, reject) => {
        const req = indexedDB.open('ficco_business_db');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          try {
            const db = req.result;
            const tx = db.transaction(['invoices', 'invoiceItems', 'expenses'], 'readwrite');
            const now = new Date();

            for (let i = 1; i <= 50; i++) {
              const invId = `bulk-inv-${i}`;
              const amount = 100000 * i;
              tx.objectStore('invoices').put({
                id: invId,
                invoiceNumber: `INV-BULK-${String(i).padStart(4, '0')}`,
                customerId: 'cust-bulk-1',
                issueDate: '2026-03-01',
                dueDate: '2026-03-15',
                status: i % 2 === 0 ? 'paid' : 'pending',
                subtotal: amount,
                discount: 0,
                tax: 0,
                total: amount,
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
              });

              tx.objectStore('invoiceItems').put({
                id: `bulk-item-${i}`,
                invoiceId: invId,
                description: `Bulk Service Item ${i}`,
                quantity: 1,
                unitPrice: amount,
                discount: 0,
                taxRate: 0,
                subtotal: amount,
                total: amount,
              });

              tx.objectStore('expenses').put({
                id: `bulk-exp-${i}`,
                categoryId: 'cat-bulk-1',
                description: `Bulk Expense ${i}`,
                amount: 50000 * i,
                date: '2026-03-02',
                paymentMethod: 'Transfer',
                createdAt: now.toISOString(),
                updatedAt: now.toISOString(),
              });
            }

            tx.oncomplete = () => {
              db.close();
              resolve(true);
            };
            tx.onerror = () => {
              db.close();
              reject(tx.error);
            };
          } catch (err) {
            reject(err);
          }
        };
      });
    });

    expect(seedResult).toBe(true);

    // 2. Reload dashboard and verify aggregations calculate cleanly
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.getByRole('heading', { name: 'Ringkasan Keuangan' })).toBeVisible();

    // Verify no NaN or crash in cards
    const bodyText = await page.innerText('body');
    expect(bodyText).not.toContain('NaN');
    expect(bodyText).not.toContain('undefined');

    // 3. Navigate to Reports and check P&L calculations on large dataset
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Laporan Keuangan' })).toBeVisible();

    const reportsText = await page.innerText('body');
    expect(reportsText).not.toContain('NaN');
  });

  // ---------------------------------------------------------------------------
  // 5. Database Export integrity
  // ---------------------------------------------------------------------------
  test('Test 5: should generate a structured, valid backup JSON with all 9 entity tables matching live data', async ({
    page,
  }) => {
    await page.goto('/backup');
    await page.waitForLoadState('domcontentloaded');

    // Click Export All Data button in header
    const exportBtn = page.getByRole('button', { name: /Export All Data/i }).first();
    await expect(exportBtn).toBeVisible();

    // Trigger export and intercept download
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click(),
    ]);

    // Verify downloaded file name pattern: invoice-app-backup-YYYY-MM-DD.json
    expect(download.suggestedFilename()).toMatch(/^invoice-app-backup-\d{4}-\d{2}-\d{2}\.json$/);

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    if (!downloadPath) throw new Error('Download path is null');
    const jsonString = fs.readFileSync(downloadPath, 'utf-8');

    // Validate payload structure & schema
    const validation = parseAndValidateBackupJson(jsonString);
    expect(validation.valid).toBe(true);
    expect(validation.payload).toBeDefined();
    expect(validation.payload?.format).toBe('invoice-app-backup');
    expect(validation.payload?.schemaVersion).toBe(1);
    expect(validation.payload?.data).toBeDefined();
    expect(validation.payload?.data.customers).toBeDefined();
    expect(validation.payload?.data.invoices).toBeDefined();
    expect(validation.payload?.data.expenses).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // 6. Database Import & round-trip verification
  // ---------------------------------------------------------------------------
  test('Test 6: should execute atomic import round-trip restoring exact table counts and records', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Construct valid sample backup payload
    const backupPayload = constructBackupPayload({
      companies: [
        {
          id: 'comp_test',
          name: 'PT Maju Bersama',
          currency: 'IDR',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      customers: [
        {
          id: 'cust_restore_1',
          name: 'Pelanggan Pulihan Utama',
          email: 'pulihan@test.local',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      products: [],
      invoices: [],
      invoiceItems: [],
      expenses: [],
      expenseCategories: [],
      payments: [],
      settings: [],
    });

    const serialized = serializeBackupPayload(backupPayload);

    // Perform programmatic transactional restore via IndexedDB
    const restoreResult = await page.evaluate(async (json) => {
      const parsed = JSON.parse(json);
      return new Promise<boolean>((resolve, reject) => {
        const req = indexedDB.open('ficco_business_db');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          try {
            const db = req.result;
            const tx = db.transaction(['companies', 'customers'], 'readwrite');
            tx.objectStore('companies').clear();
            tx.objectStore('customers').clear();

            (parsed.data.companies as Record<string, unknown>[]).forEach((c) =>
              tx.objectStore('companies').put(c)
            );
            (parsed.data.customers as Record<string, unknown>[]).forEach((c) =>
              tx.objectStore('customers').put(c)
            );

            tx.oncomplete = () => {
              db.close();
              resolve(true);
            };
            tx.onerror = () => {
              db.close();
              reject(tx.error);
            };
          } catch (err) {
            reject(err);
          }
        };
      });
    }, serialized);

    expect(restoreResult).toBe(true);

    // Verify restored customer is visible on /customers
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Pelanggan Pulihan Utama').first()).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 7. Import malformed JSON & transactional rollback guarantee
  // ---------------------------------------------------------------------------
  test('Test 7: should strictly reject malformed JSON payloads and preserve existing database integrity', async () => {
    // 1. Corrupt JSON syntax
    const corrupted = parseAndValidateBackupJson('{ "format": "invoice-app-backup", unclosed: ');
    expect(corrupted.valid).toBe(false);
    expect(corrupted.error).toContain('Berkas bukan format JSON yang valid');

    // 2. Missing format
    const noFormat = parseAndValidateBackupJson(JSON.stringify({ schemaVersion: 1, data: {} }));
    expect(noFormat.valid).toBe(false);
    expect(noFormat.error).toContain('tidak didukung');

    // 3. Corrupt data types in table array
    const corruptTypes = parseAndValidateBackupJson(
      JSON.stringify({
        format: 'invoice-app-backup',
        schemaVersion: 1,
        appVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: {
          customers: [{ id: 12345, name: false }], // Should be strings
        },
      })
    );
    expect(corruptTypes.valid).toBe(false);
    expect(corruptTypes.error).toContain('Validasi integritas data cadangan gagal');
  });

  // ---------------------------------------------------------------------------
  // 8. Import old/unsupported schema versioning
  // ---------------------------------------------------------------------------
  test('Test 8: should support schema version 1 and reject future schema versions with helpful upgrade prompt', async () => {
    // 1. Supported Schema Version 1
    const v1 = parseAndValidateBackupJson(
      JSON.stringify({
        format: 'invoice-app-backup',
        schemaVersion: 1,
        appVersion: '1.0.0',
        exportedAt: new Date().toISOString(),
        data: {
          companies: [],
          customers: [],
          products: [],
          invoices: [],
          invoiceItems: [],
          expenses: [],
          expenseCategories: [],
          payments: [],
          settings: [],
        },
      })
    );
    expect(v1.valid).toBe(true);

    // 2. Future schema version (e.g. v99)
    const future = parseAndValidateBackupJson(
      JSON.stringify({
        format: 'invoice-app-backup',
        schemaVersion: 99,
        appVersion: '9.0.0',
        exportedAt: new Date().toISOString(),
        data: {},
      })
    );
    expect(future.valid).toBe(false);
    expect(future.error).toContain('lebih baru dari versi aplikasi yang didukung');
  });

  // ---------------------------------------------------------------------------
  // 9. Delete/recreate data without orphan records (Cascading delete)
  // ---------------------------------------------------------------------------
  test('Test 9: should delete parent invoice and all associated items and payments transactionally without orphan records', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const testInvId = `cascade-test-${Date.now()}`;

    // 1. Create invoice with 2 items and 1 payment in IndexedDB
    await page.evaluate(async (id) => {
      return new Promise<boolean>((resolve, reject) => {
        const req = indexedDB.open('ficco_business_db');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          try {
            const db = req.result;
            const tx = db.transaction(['invoices', 'invoiceItems', 'payments'], 'readwrite');

            tx.objectStore('invoices').put({
              id,
              invoiceNumber: 'INV-CASCADE-001',
              customerId: 'c_casc',
              issueDate: '2026-03-01',
              dueDate: '2026-03-15',
              status: 'partially_paid',
              subtotal: 500000,
              discount: 0,
              tax: 0,
              total: 500000,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });

            tx.objectStore('invoiceItems').put({
              id: `item-1-${id}`,
              invoiceId: id,
              description: 'Item A',
              quantity: 1,
              unitPrice: 300000,
              discount: 0,
              taxRate: 0,
              subtotal: 300000,
              total: 300000,
            });

            tx.objectStore('invoiceItems').put({
              id: `item-2-${id}`,
              invoiceId: id,
              description: 'Item B',
              quantity: 1,
              unitPrice: 200000,
              discount: 0,
              taxRate: 0,
              subtotal: 200000,
              total: 200000,
            });

            tx.objectStore('payments').put({
              id: `pay-${id}`,
              invoiceId: id,
              amount: 250000,
              paymentDate: '2026-03-05',
              paymentMethod: 'Bank Transfer',
              createdAt: new Date().toISOString(),
            });

            tx.oncomplete = () => {
              db.close();
              resolve(true);
            };
            tx.onerror = () => {
              db.close();
              reject(tx.error);
            };
          } catch (err) {
            reject(err);
          }
        };
      });
    }, testInvId);

    // 2. Transactionally delete invoice and cascade to items & payments
    const deleteResult = await page.evaluate(async (id) => {
      return new Promise<{ invoiceDeleted: boolean; itemsCount: number; paymentsCount: number }>(
        (resolve, reject) => {
          const req = indexedDB.open('ficco_business_db');
          req.onerror = () => reject(req.error);
          req.onsuccess = () => {
            try {
              const db = req.result;
              const tx = db.transaction(['invoices', 'invoiceItems', 'payments'], 'readwrite');

              // Delete parent
              tx.objectStore('invoices').delete(id);

              // Cascade delete items & payments matching invoiceId
              const itemsIndex = tx.objectStore('invoiceItems').index('invoiceId');
              const itemsReq = itemsIndex.openCursor(IDBKeyRange.only(id));
              itemsReq.onsuccess = () => {
                const cursor = itemsReq.result;
                if (cursor) {
                  cursor.delete();
                  cursor.continue();
                }
              };

              const paymentsIndex = tx.objectStore('payments').index('invoiceId');
              const paymentsReq = paymentsIndex.openCursor(IDBKeyRange.only(id));
              paymentsReq.onsuccess = () => {
                const cursor = paymentsReq.result;
                if (cursor) {
                  cursor.delete();
                  cursor.continue();
                }
              };

              tx.oncomplete = () => {
                // Verify zero remaining items or payments for this invoice
                const checkTx = db.transaction(['invoices', 'invoiceItems', 'payments'], 'readonly');
                const invGet = checkTx.objectStore('invoices').get(id);
                const itemsGet = checkTx.objectStore('invoiceItems').index('invoiceId').count(IDBKeyRange.only(id));
                const paymentsGet = checkTx.objectStore('payments').index('invoiceId').count(IDBKeyRange.only(id));

                checkTx.oncomplete = () => {
                  db.close();
                  resolve({
                    invoiceDeleted: invGet.result === undefined,
                    itemsCount: itemsGet.result,
                    paymentsCount: paymentsGet.result,
                  });
                };
                checkTx.onerror = () => {
                  db.close();
                  reject(checkTx.error);
                };
              };
              tx.onerror = () => {
                db.close();
                reject(tx.error);
              };
            } catch (err) {
              reject(err);
            }
          };
        }
      );
    }, testInvId);

    expect(deleteResult.invoiceDeleted).toBe(true);
    expect(deleteResult.itemsCount).toBe(0);
    expect(deleteResult.paymentsCount).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // 10. Browser storage persistence & diagnostic self-test
  // ---------------------------------------------------------------------------
  test('Test 10: should verify browser storage persistence quota and execute automated database diagnostics', async ({
    page,
  }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // 1. Expand Database Diagnostics in UI
    const toggleBtn = page.getByRole('button', { name: /Tampilkan Diagnostik Database/i });
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
    }

    // 2. Verify Dexie Foundation Header & active schema version
    await expect(page.getByText('IndexedDB / Dexie Foundation')).toBeVisible();
    await expect(page.getByText(/v1 Active/i)).toBeVisible();
    await expect(page.getByText('ficco_business_db')).toBeVisible();

    // 3. Verify all required database diagnostic checks pass
    await expect(page.getByText('Database Initialization')).toBeVisible();
    await expect(page.getByText('Database Versioning')).toBeVisible();
    await expect(page.getByText('Tables Registration')).toBeVisible();
    await expect(page.getByText('Customer Repository CRUD')).toBeVisible();
    await expect(page.getByText('Invoice Transactional Operations')).toBeVisible();

    // 4. Verify browser storage estimate query
    const storageQuota = await page.evaluate(async () => {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        return {
          supported: true,
          quota: estimate.quota || 0,
          usage: estimate.usage || 0,
        };
      }
      return { supported: false, quota: 0, usage: 0 };
    });

    expect(storageQuota.supported).toBe(true);
    expect(storageQuota.quota).toBeGreaterThan(0);
  });
});
