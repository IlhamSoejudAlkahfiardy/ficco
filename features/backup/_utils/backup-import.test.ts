import { parseAndValidateBackupJson } from './backup-import';
import {
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
  APP_VERSION,
  BackupPayload,
} from '../_types/backup.types';

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

export function runBackupImportUnitTests(): {
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

  const sampleValidPayload: BackupPayload = {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: '2026-10-15T12:00:00.000Z',
    data: {
      companies: [
        {
          id: 'comp_1',
          name: 'PT Mitra Usaha',
          currency: 'IDR',
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z',
        },
      ],
      customers: [
        {
          id: 'cust_1',
          name: 'Andi Pratama',
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z',
        },
      ],
      products: [
        {
          id: 'prod_1',
          name: 'Paket Desain',
          unit: 'Paket',
          price: 1_000_000,
          taxRate: 0,
          active: true,
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z',
        },
      ],
      invoices: [
        {
          id: 'inv_1',
          invoiceNumber: 'INV/2026/001',
          customerId: 'cust_1',
          issueDate: '2026-10-01',
          dueDate: '2026-10-15',
          status: 'paid',
          subtotal: 1_000_000,
          discount: 0,
          tax: 0,
          total: 1_000_000,
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z',
        },
      ],
      invoiceItems: [
        {
          id: 'item_1',
          invoiceId: 'inv_1',
          description: 'Paket Desain',
          quantity: 1,
          unitPrice: 1_000_000,
          discount: 0,
          taxRate: 0,
          subtotal: 1_000_000,
          total: 1_000_000,
        },
      ],
      expenses: [
        {
          id: 'exp_1',
          categoryId: 'cat_operasional',
          description: 'Beli ATK',
          amount: 50_000,
          date: '2026-10-05',
          paymentMethod: 'cash',
          createdAt: '2026-10-05T00:00:00Z',
          updatedAt: '2026-10-05T00:00:00Z',
        },
      ],
      expenseCategories: [
        {
          id: 'cat_operasional',
          name: 'Operasional',
          active: true,
        },
      ],
      payments: [
        {
          id: 'pay_1',
          invoiceId: 'inv_1',
          amount: 1_000_000,
          paymentDate: '2026-10-02',
          paymentMethod: 'bank_transfer',
          createdAt: '2026-10-02T00:00:00Z',
        },
      ],
      settings: [
        {
          key: 'invoice_prefix',
          value: 'INV/',
          updatedAt: '2026-10-01T00:00:00Z',
        },
      ],
    },
    metadata: {
      totalRecords: 9,
      tableCounts: {
        companies: 1,
        customers: 1,
        products: 1,
        invoices: 1,
        invoiceItems: 1,
        expenses: 1,
        expenseCategories: 1,
        payments: 1,
        settings: 1,
      },
    },
  };

  // 1. Suite: Valid Backup Validation
  test('Backup Import', 'should validate and parse valid backup JSON successfully', () => {
    const jsonStr = JSON.stringify(sampleValidPayload);
    const result = parseAndValidateBackupJson(jsonStr, {
      filename: 'test-backup.json',
      fileSizeBytes: 1024,
    });

    assert(result.valid, 'Result should be valid');
    assert(result.preview !== undefined, 'Preview should be defined');
    assertEqual(result.preview?.filename, 'test-backup.json', 'Filename matches');
    assertEqual(result.preview?.totalRecords, 9, 'Total records count matches');
    assertEqual(result.preview?.tableSummaries.length, 9, 'All 9 tables represented');
  });

  // 2. Suite: Empty valid tables
  test('Backup Import', 'should handle valid backup with empty tables', () => {
    const emptyPayload: BackupPayload = {
      format: BACKUP_FORMAT,
      schemaVersion: BACKUP_SCHEMA_VERSION,
      appVersion: APP_VERSION,
      exportedAt: '2026-10-15T00:00:00.000Z',
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
    };

    const result = parseAndValidateBackupJson(JSON.stringify(emptyPayload));
    assert(result.valid, 'Empty valid payload should pass validation');
    assertEqual(result.preview?.totalRecords, 0, 'Total records should be 0');
  });

  // 3. Suite: Malformed JSON Syntax
  test('Backup Import', 'should reject malformed JSON syntax gracefully', () => {
    const brokenJson = '{ "format": "invoice-app-backup", "schemaVersion": 1, ';
    const result = parseAndValidateBackupJson(brokenJson);

    assert(!result.valid, 'Malformed JSON must fail validation');
    assert(
      result.error?.includes('bukan format JSON yang valid') ?? false,
      'Error message should indicate JSON syntax issue'
    );
  });

  // 4. Suite: Invalid Root Type
  test('Backup Import', 'should reject non-object JSON payloads', () => {
    const arrayJson = JSON.stringify([1, 2, 3]);
    const result = parseAndValidateBackupJson(arrayJson);

    assert(!result.valid, 'Array root must be rejected');
    assert(
      result.error?.includes('harus berupa objek') ?? false,
      'Error message should require JSON object'
    );
  });

  // 5. Suite: Unrecognized Format
  test('Backup Import', 'should reject payloads with incorrect format identifier', () => {
    const badFormatPayload = {
      ...sampleValidPayload,
      format: 'unknown-vendor-backup',
    };
    const result = parseAndValidateBackupJson(JSON.stringify(badFormatPayload));

    assert(!result.valid, 'Incorrect format should fail validation');
    assert(
      result.error?.includes('tidak didukung') ?? false,
      'Error message should explain format mismatch'
    );
  });

  // 6. Suite: Future Schema Version
  test('Backup Import', 'should reject future schema versions', () => {
    const futurePayload = {
      ...sampleValidPayload,
      schemaVersion: 99,
    };
    const result = parseAndValidateBackupJson(JSON.stringify(futurePayload));

    assert(!result.valid, 'Future schemaVersion should fail validation');
    assert(
      result.error?.includes('lebih baru dari versi aplikasi') ?? false,
      'Error message should notify user of version incompatibility'
    );
  });

  // 7. Suite: Corrupted Entity Inside Tables (Zod validation failure)
  test('Backup Import', 'should reject corrupted entity data failing Zod schemas', () => {
    const corruptedPayload = {
      ...sampleValidPayload,
      data: {
        ...sampleValidPayload.data,
        invoices: [
          {
            ...sampleValidPayload.data.invoices[0],
            status: 'invalid_status_enum', // violates invoiceStatusSchema
          },
        ],
      },
    };
    const result = parseAndValidateBackupJson(JSON.stringify(corruptedPayload));

    assert(!result.valid, 'Corrupted invoice schema must be rejected');
    assert(
      result.error?.includes('Validasi integritas data cadangan gagal') ?? false,
      'Should report integrity error'
    );
    assert(result.details !== undefined && result.details.length > 0, 'Details should contain specific issue paths');
  });

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passedCount,
    failedCount,
    results,
  };
}
