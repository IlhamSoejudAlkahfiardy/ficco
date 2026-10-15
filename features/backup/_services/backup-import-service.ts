import { db } from '@/infrastructure/database/db';
import {
  BackupPayload,
  BackupValidationResult,
  BackupImportResult,
} from '../_types/backup.types';
import { parseAndValidateBackupJson } from '../_utils/backup-import';
import { calculateBackupTableSummaries } from '../_utils/backup-export';

export class BackupImportService {
  /**
   * Reads raw text content from a client File instance
   */
  async readBackupFile(file: File): Promise<string> {
    if (typeof file.text === 'function') {
      return await file.text();
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Gagal membaca berkas cadangan dari disk lokal.'));
      reader.readAsText(file);
    });
  }

  /**
   * Reads and thoroughly validates a candidate backup file
   */
  async validateBackupFile(file: File): Promise<BackupValidationResult> {
    try {
      const text = await this.readBackupFile(file);
      return parseAndValidateBackupJson(text, {
        filename: file.name,
        fileSizeBytes: file.size,
      });
    } catch (err) {
      return {
        valid: false,
        error: (err as Error).message || 'Gagal memproses berkas cadangan.',
      };
    }
  }

  /**
   * Atomically executes transactional database replacement.
   * If any table clear or bulk insertion fails, Dexie rolls back the entire
   * transaction automatically, keeping the existing database 100% intact.
   */
  async restoreBackupTransaction(payload: BackupPayload): Promise<BackupImportResult> {
    const restoredAt = new Date().toISOString();
    const tableSummaries = calculateBackupTableSummaries(payload.data);
    const totalRecords =
      payload.metadata?.totalRecords ??
      tableSummaries.reduce((sum, item) => sum + item.count, 0);

    await db.transaction('rw', [
      db.companies,
      db.customers,
      db.products,
      db.invoices,
      db.invoiceItems,
      db.expenses,
      db.expenseCategories,
      db.payments,
      db.settings,
    ], async () => {
      // 1. Atomically clear all 9 existing tables
      await Promise.all([
        db.companies.clear(),
        db.customers.clear(),
        db.products.clear(),
        db.invoices.clear(),
        db.invoiceItems.clear(),
        db.expenses.clear(),
        db.expenseCategories.clear(),
        db.payments.clear(),
        db.settings.clear(),
      ]);

      // 2. Bulk add all validated entities
      const {
        companies,
        customers,
        products,
        invoices,
        invoiceItems,
        expenses,
        expenseCategories,
        payments,
        settings,
      } = payload.data;

      if (companies.length > 0) await db.companies.bulkAdd(companies);
      if (customers.length > 0) await db.customers.bulkAdd(customers);
      if (products.length > 0) await db.products.bulkAdd(products);
      if (invoices.length > 0) await db.invoices.bulkAdd(invoices);
      if (invoiceItems.length > 0) await db.invoiceItems.bulkAdd(invoiceItems);
      if (expenses.length > 0) await db.expenses.bulkAdd(expenses);
      if (expenseCategories.length > 0) await db.expenseCategories.bulkAdd(expenseCategories);
      if (payments.length > 0) await db.payments.bulkAdd(payments);
      if (settings.length > 0) await db.settings.bulkAdd(settings);

      // 3. Record last import metadata in settings table
      await db.settings.put({
        key: 'last_import_date',
        value: restoredAt,
        updatedAt: restoredAt,
      });
    });

    return {
      success: true,
      restoredAt,
      totalRecords,
      tableSummaries,
    };
  }
}

export const backupImportService = new BackupImportService();
