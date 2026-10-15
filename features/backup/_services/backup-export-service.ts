import { db } from '@/infrastructure/database/db';
import { settingsRepository } from '@/infrastructure/database/repositories/settings-repository';
import {
  BackupData,
  BackupPayload,
  BackupExportResult,
} from '../_types/backup.types';
import { backupPayloadSchema } from '../_schemas/backup.schemas';
import {
  constructBackupPayload,
  generateBackupFilename,
  serializeBackupPayload,
  triggerJsonDownload,
  calculateBackupTableSummaries,
} from '../_utils/backup-export';

export class BackupExportService {
  /**
   * Reads all 9 tables from IndexedDB and constructs the BackupData object.
   */
  async readAllTables(): Promise<BackupData> {
    const [
      companies,
      customers,
      products,
      invoices,
      invoiceItems,
      expenses,
      expenseCategories,
      payments,
      settings,
    ] = await Promise.all([
      db.companies.toArray(),
      db.customers.toArray(),
      db.products.toArray(),
      db.invoices.toArray(),
      db.invoiceItems.toArray(),
      db.expenses.toArray(),
      db.expenseCategories.toArray(),
      db.payments.toArray(),
      db.settings.toArray(),
    ]);

    return {
      companies,
      customers,
      products,
      invoices,
      invoiceItems,
      expenses,
      expenseCategories,
      payments,
      settings,
    };
  }

  /**
   * Retrieves quick summary of database counts and last backup timestamp
   */
  async getDatabaseStats(): Promise<{
    data: BackupData;
    totalRecords: number;
    tableSummaries: ReturnType<typeof calculateBackupTableSummaries>;
    lastBackupDate: string | null;
    dataSizeBytes: number;
  }> {
    const data = await this.readAllTables();
    const tableSummaries = calculateBackupTableSummaries(data);
    const totalRecords = tableSummaries.reduce((sum, item) => sum + item.count, 0);
    const lastBackupDate = (await settingsRepository.get<string>('last_backup_date')) || null;
    const jsonString = JSON.stringify(data);
    const dataSizeBytes = new Blob([jsonString]).size;

    return {
      data,
      totalRecords,
      tableSummaries,
      lastBackupDate,
      dataSizeBytes,
    };
  }

  /**
   * Constructs, validates with Zod, serializes, and initiates browser JSON download
   */
  async exportBackup(options?: { filename?: string }): Promise<BackupExportResult> {
    const data = await this.readAllTables();
    const payload: BackupPayload = constructBackupPayload(data);

    // 1. Zod schema validation to guarantee 100% compliant data format
    backupPayloadSchema.parse(payload);

    // 2. Serialize JSON string
    const jsonString = serializeBackupPayload(payload);
    const filename = options?.filename || generateBackupFilename();
    const sizeBytes = new Blob([jsonString]).size;

    // 3. Update last backup date in database
    await settingsRepository.set('last_backup_date', payload.exportedAt);

    // 4. Trigger download on client
    triggerJsonDownload(jsonString, filename);

    return {
      success: true,
      filename,
      sizeBytes,
      exportedAt: payload.exportedAt,
      totalRecords: payload.metadata?.totalRecords || 0,
      tableSummaries: calculateBackupTableSummaries(data),
    };
  }
}

export const backupExportService = new BackupExportService();
