import {
  generateBackupFilename,
  constructBackupPayload,
  serializeBackupPayload,
  calculateBackupTableSummaries,
} from './backup-export';
import {
  BackupData,
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
} from '../_types/backup.types';
import { backupPayloadSchema } from '../_schemas/backup.schemas';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
  }
}

export function runBackupDomainUnitTests(): {
  total: number;
  passedCount: number;
  failedCount: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  function test(suite: string, name: string, fn: () => void) {
    try {
      fn();
      results.push({ suite, name, passed: true });
    } catch (err) {
      results.push({ suite, name, passed: false, error: (err as Error).message });
    }
  }

  const sampleData: BackupData = {
    companies: [
      {
        id: 'comp_1',
        name: 'CV Sukses Mandiri',
        currency: 'IDR',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ],
    customers: [
      {
        id: 'cust_1',
        name: 'Budi Santoso',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ],
    products: [
      {
        id: 'prod_1',
        name: 'Jasa Konsultasi',
        unit: 'Jam',
        price: 500_000,
        taxRate: 0,
        active: true,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ],
    invoices: [
      {
        id: 'inv_1',
        invoiceNumber: 'INV/2026/10/001',
        customerId: 'cust_1',
        issueDate: '2026-10-01',
        dueDate: '2026-10-15',
        status: 'paid',
        subtotal: 500_000,
        discount: 0,
        tax: 0,
        total: 500_000,
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ],
    invoiceItems: [
      {
        id: 'item_1',
        invoiceId: 'inv_1',
        description: 'Jasa Konsultasi',
        quantity: 1,
        unitPrice: 500_000,
        discount: 0,
        taxRate: 0,
        subtotal: 500_000,
        total: 500_000,
      },
    ],
    expenses: [
      {
        id: 'exp_1',
        categoryId: 'cat_1',
        description: 'Internet Kantor',
        amount: 350_000,
        date: '2026-10-02',
        paymentMethod: 'bank_transfer',
        createdAt: '2026-10-02T00:00:00Z',
        updatedAt: '2026-10-02T00:00:00Z',
      },
    ],
    expenseCategories: [
      {
        id: 'cat_1',
        name: 'Utilitas',
        active: true,
      },
    ],
    payments: [
      {
        id: 'pay_1',
        invoiceId: 'inv_1',
        amount: 500_000,
        paymentDate: '2026-10-05',
        paymentMethod: 'bank_transfer',
        createdAt: '2026-10-05T00:00:00Z',
      },
    ],
    settings: [
      {
        key: 'currency',
        value: 'IDR',
        updatedAt: '2026-10-01T00:00:00Z',
      },
    ],
  };

  // --- Suite 1: Filename Generation ---
  test('Suite 1 - Filename Generation', 'Generates correct format invoice-app-backup-YYYY-MM-DD.json', () => {
    const fixedDate = new Date(2026, 8, 24); // Sept 24, 2026
    const filename = generateBackupFilename(fixedDate);
    assertEqual(filename, 'invoice-app-backup-2026-09-24.json', 'Filename matches blueprint section 13.1');
  });

  // --- Suite 2: Payload Construction & Serialization ---
  test('Suite 2 - Payload Construction', 'Wraps data with format, schemaVersion, and metadata', () => {
    const fixedDate = new Date('2026-10-15T12:00:00.000Z');
    const payload = constructBackupPayload(sampleData, fixedDate);

    assertEqual(payload.format, BACKUP_FORMAT, 'Format must be invoice-app-backup');
    assertEqual(payload.schemaVersion, BACKUP_SCHEMA_VERSION, 'Schema version must be 1');
    assertEqual(payload.exportedAt, '2026-10-15T12:00:00.000Z', 'ExportedAt is valid ISO string');
    assertEqual(payload.metadata?.totalRecords, 9, 'Total records should be 9');
    assertEqual(payload.data.invoices.length, 1, 'Invoices count is 1');
  });

  test('Suite 2 - Serialization', 'Serializes payload into valid, parseable JSON string', () => {
    const payload = constructBackupPayload(sampleData);
    const jsonStr = serializeBackupPayload(payload);
    assert(typeof jsonStr === 'string' && jsonStr.length > 50, 'Serialized string is not empty');

    const parsed = JSON.parse(jsonStr);
    assertEqual(parsed.format, BACKUP_FORMAT, 'Parsed format matches');
    assertEqual(parsed.data.invoices[0].invoiceNumber, 'INV/2026/10/001', 'Parsed invoice number matches');
  });

  // --- Suite 3: Zod Schema Validation ---
  test('Suite 3 - Zod Validation', 'Successfully validates compliant backup payload', () => {
    const payload = constructBackupPayload(sampleData);
    const validated = backupPayloadSchema.parse(payload);
    assert(!!validated, 'Validation should succeed without throwing');
  });

  test('Suite 3 - Zod Validation', 'Rejects corrupt format identifier', () => {
    const payload = constructBackupPayload(sampleData);
    const corruptPayload = { ...payload, format: 'unknown-format' };

    let threw = false;
    try {
      backupPayloadSchema.parse(corruptPayload);
    } catch {
      threw = true;
    }
    assert(threw, 'Should throw ZodError for invalid format');
  });

  // --- Suite 4: Table Summaries ---
  test('Suite 4 - Table Summaries', 'Accurately maps Indonesian labels and record counts', () => {
    const summaries = calculateBackupTableSummaries(sampleData);
    assertEqual(summaries.length, 9, 'Must summarize all 9 IndexedDB tables');

    const invSummary = summaries.find((s) => s.tableKey === 'invoices');
    assert(!!invSummary, 'Invoice summary must exist');
    assertEqual(invSummary?.count, 1, 'Invoices count should be 1');
    assertEqual(invSummary?.label, 'Faktur Penjualan', 'Label is Faktur Penjualan');
  });

  const passedCount = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passedCount,
    failedCount: results.length - passedCount,
    results,
  };
}
