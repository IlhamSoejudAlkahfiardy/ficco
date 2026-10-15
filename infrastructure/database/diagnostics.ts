import { db } from './db';
import { customerRepository } from './repositories/customer-repository';
import { productRepository } from './repositories/product-repository';
import { invoiceRepository } from './repositories/invoice-repository';
import { CURRENT_DB_VERSION } from './migrations';
import { runInvoiceDomainUnitTests } from '@/features/invoices/_utils/invoice-calculations.test';
import { runInvoicePdfUnitTests } from '@/features/invoices/_utils/invoice-pdf.test';
import { runExpenseDomainUnitTests } from '@/features/expenses/_utils/expense-calculations.test';
import { runDashboardDomainUnitTests } from '@/features/dashboard/_utils/dashboard-calculations.test';
import { runReportsDomainUnitTests } from '@/features/reports/_utils/reports-calculations.test';
import { runBackupDomainUnitTests } from '@/features/backup/_utils/backup-export.test';
import { runBackupImportUnitTests } from '@/features/backup/_utils/backup-import.test';

export interface DiagnosticResult {
  step: string;
  passed: boolean;
  message: string;
}

export interface DiagnosticReport {
  success: boolean;
  version: number;
  tablesCount: number;
  results: DiagnosticResult[];
  durationMs: number;
}

/**
 * Executes an automated end-to-end self-test of Dexie foundation,
 * validating initialization, versioning, CRUD, and transactions.
 */
export async function runDatabaseDiagnostics(): Promise<DiagnosticReport> {
  const startTime = Date.now();
  const results: DiagnosticResult[] = [];

  try {
    // 1. Check Initialization & Open
    if (!db.isOpen()) {
      await db.open();
    }
    results.push({
      step: 'Database Initialization',
      passed: db.isOpen(),
      message: `Database "${db.name}" opened successfully.`,
    });

    // 2. Check Versioning
    const isVersionCorrect = db.verno === CURRENT_DB_VERSION;
    results.push({
      step: 'Database Versioning',
      passed: isVersionCorrect,
      message: `Active schema version is ${db.verno} (Expected: ${CURRENT_DB_VERSION}).`,
    });

    // 3. Check Tables
    const requiredTables = [
      'companies',
      'customers',
      'products',
      'invoices',
      'invoiceItems',
      'expenses',
      'expenseCategories',
      'payments',
      'settings',
    ];
    const missingTables = requiredTables.filter(
      (name) => !db.tables.some((t) => t.name === name)
    );
    results.push({
      step: 'Tables Registration',
      passed: missingTables.length === 0,
      message:
        missingTables.length === 0
          ? `All ${requiredTables.length} tables registered properly.`
          : `Missing tables: ${missingTables.join(', ')}`,
    });

    // 4. Test Customer CRUD
    const testCustomerId = `test-cust-${Date.now()}`;
    await customerRepository.create({
      id: testCustomerId,
      name: 'Diagnostic Test Customer',
      companyName: 'Test Corp',
      email: 'diag@test.com',
      phone: '08123456789',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const readCustomer = await customerRepository.getById(testCustomerId);
    const customerCreatePassed = readCustomer?.name === 'Diagnostic Test Customer';

    await customerRepository.update(testCustomerId, { name: 'Updated Diagnostic Customer' });
    const updatedCustomer = await customerRepository.getById(testCustomerId);
    const customerUpdatePassed = updatedCustomer?.name === 'Updated Diagnostic Customer';

    await customerRepository.delete(testCustomerId);
    const deletedCustomer = await customerRepository.getById(testCustomerId);
    const customerDeletePassed = deletedCustomer === undefined;

    results.push({
      step: 'Customer Repository CRUD',
      passed: customerCreatePassed && customerUpdatePassed && customerDeletePassed,
      message: 'Create, Read, Update, and Delete operations verified.',
    });

    // 5. Test Product CRUD & Search
    const testProductId = `test-prod-${Date.now()}`;
    await productRepository.create({
      id: testProductId,
      name: 'Diagnostic Widget',
      price: 150000,
      unit: 'pcs',
      taxRate: 11,
      active: true,
      sku: 'DIAG-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const searchedProducts = await productRepository.search('Diagnostic');
    const productSearchPassed = searchedProducts.some((p) => p.id === testProductId);

    await productRepository.delete(testProductId);
    results.push({
      step: 'Product Repository & Search Filter',
      passed: productSearchPassed,
      message: 'Product insert, indexed query, and cleanup verified.',
    });

    // 6. Test Invoice + Items Transaction
    const testInvoiceId = `test-inv-${Date.now()}`;
    await invoiceRepository.createWithItems(
      {
        id: testInvoiceId,
        invoiceNumber: 'INV-TEST-001',
        customerId: 'dummy-cust',
        issueDate: '2026-09-24',
        dueDate: '2026-10-24',
        status: 'draft',
        subtotal: 100000,
        discount: 0,
        tax: 11000,
        total: 111000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      [
        {
          id: `item-${Date.now()}`,
          invoiceId: testInvoiceId,
          description: 'Line item 1',
          quantity: 1,
          unitPrice: 100000,
          discount: 0,
          taxRate: 11,
          subtotal: 100000,
          total: 111000,
        },
      ]
    );

    const invoiceWithItems = await invoiceRepository.getWithItems(testInvoiceId);
    const invoiceTransPassed =
      invoiceWithItems !== null &&
      invoiceWithItems.items.length === 1 &&
      invoiceWithItems.invoice.total === 111000;

    await invoiceRepository.deleteWithItems(testInvoiceId);
    const checkDeleted = await invoiceRepository.getWithItems(testInvoiceId);
    const invoiceCleanupPassed = checkDeleted === null;

    results.push({
      step: 'Invoice Transactional Operations',
      passed: invoiceTransPassed && invoiceCleanupPassed,
      message: 'Atomic multi-table transaction and cascading delete verified.',
    });

    // 7. Test Invoice Domain Unit Tests (Calculations, Status, Numbering)
    const domainTestSummary = runInvoiceDomainUnitTests();
    results.push({
      step: 'Invoice Domain Unit Tests',
      passed: domainTestSummary.failedCount === 0,
      message: `${domainTestSummary.passedCount}/${domainTestSummary.total} unit tests passed (Calculations, Status, Precision, & Numbering).`,
    });

    // 8. Test Client-Side Invoice PDF Generation (Step 13)
    const pdfTestSummary = runInvoicePdfUnitTests();
    results.push({
      step: 'Invoice PDF Engine Unit Tests',
      passed: pdfTestSummary.failedCount === 0,
      message: `${pdfTestSummary.passedCount}/${pdfTestSummary.total} unit tests passed (PDF 1.4 Binary, Vector Layout, Resilience, & Multi-Page).`,
    });

    // 9. Test Expense Domain Unit Tests (Step 14)
    const expenseTestSummary = runExpenseDomainUnitTests();
    results.push({
      step: 'Expense Domain Unit Tests',
      passed: expenseTestSummary.failedCount === 0,
      message: `${expenseTestSummary.passedCount}/${expenseTestSummary.total} unit tests passed (Totals, Breakdown, Date Filter, Search, & MoM Stats).`,
    });

    // 10. Test Dashboard Domain Unit Tests (Step 15)
    const dashboardTestSummary = runDashboardDomainUnitTests();
    results.push({
      step: 'Dashboard Domain Unit Tests',
      passed: dashboardTestSummary.failedCount === 0,
      message: `${dashboardTestSummary.passedCount}/${dashboardTestSummary.total} unit tests passed (Revenue, Net Profit, MoM Trends, Outstanding & Expense Breakdown).`,
    });

    // 11. Test Reports Domain Unit Tests (Step 16)
    const reportsTestSummary = runReportsDomainUnitTests();
    results.push({
      step: 'Reports Domain Unit Tests',
      passed: reportsTestSummary.failedCount === 0,
      message: `${reportsTestSummary.passedCount}/${reportsTestSummary.total} unit tests passed (P&L Summary, Periodic Trends, Customer & Category Distribution).`,
    });

    // 12. Test Backup Domain Unit Tests (Step 17)
    const backupTestSummary = runBackupDomainUnitTests();
    results.push({
      step: 'Backup Domain Unit Tests',
      passed: backupTestSummary.failedCount === 0,
      message: `${backupTestSummary.passedCount}/${backupTestSummary.total} unit tests passed (Filename Generation, Versioned Payload, Zod Schema, & Table Summaries).`,
    });

    // 13. Test Backup Import Domain Unit Tests (Step 18)
    const backupImportTestSummary = runBackupImportUnitTests();
    results.push({
      step: 'Backup Import Domain Unit Tests',
      passed: backupImportTestSummary.failedCount === 0,
      message: `${backupImportTestSummary.passedCount}/${backupImportTestSummary.total} unit tests passed (Safe Parsing, Schema Version Guard, Zod Integrity, & Empty Table Handling).`,
    });


    const allPassed = results.every((r) => r.passed);
    return {
      success: allPassed,
      version: db.verno,
      tablesCount: db.tables.length,
      results,
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    results.push({
      step: 'Diagnostic Execution',
      passed: false,
      message: (error as Error).message || 'Unexpected failure during database diagnostics.',
    });

    return {
      success: false,
      version: CURRENT_DB_VERSION,
      tablesCount: db.tables?.length || 0,
      results,
      durationMs: Date.now() - startTime,
    };
  }
}
