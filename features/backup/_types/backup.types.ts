import {
  Company,
  Customer,
  Product,
  Invoice,
  InvoiceItem,
  Expense,
  ExpenseCategory,
  Payment,
  AppSetting,
} from '@/infrastructure/database/schema';

export const BACKUP_FORMAT = 'invoice-app-backup';
export const BACKUP_SCHEMA_VERSION = 1;
export const APP_VERSION = '1.0.0';

export interface BackupData {
  companies: Company[];
  customers: Customer[];
  products: Product[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  expenses: Expense[];
  expenseCategories: ExpenseCategory[];
  payments: Payment[];
  settings: AppSetting[];
}

export interface BackupMetadata {
  totalRecords: number;
  tableCounts: Record<keyof BackupData, number>;
  generatedBy?: string;
}

export interface BackupPayload {
  format: string; // 'invoice-app-backup'
  schemaVersion: number; // 1
  appVersion: string; // '1.0.0'
  exportedAt: string; // ISO 8601
  data: BackupData;
  metadata?: BackupMetadata;
}

export interface BackupTableSummary {
  tableKey: keyof BackupData;
  label: string;
  count: number;
}

export interface BackupExportResult {
  success: boolean;
  filename: string;
  sizeBytes: number;
  exportedAt: string;
  totalRecords: number;
  tableSummaries: BackupTableSummary[];
}
