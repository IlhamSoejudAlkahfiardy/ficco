import {
  BackupData,
  BackupPayload,
  BackupTableSummary,
  BACKUP_FORMAT,
  BACKUP_SCHEMA_VERSION,
  APP_VERSION,
} from '../_types/backup.types';

function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

export function generateBackupFilename(referenceDate: Date = new Date()): string {
  const y = referenceDate.getFullYear();
  const m = padZero(referenceDate.getMonth() + 1);
  const d = padZero(referenceDate.getDate());
  return `invoice-app-backup-${y}-${m}-${d}.json`;
}

export function serializeBackupPayload(payload: BackupPayload): string {
  return JSON.stringify(payload, null, 2);
}

export function calculateBackupTableSummaries(data: BackupData): BackupTableSummary[] {
  return [
    { tableKey: 'companies', label: 'Profil Usaha', count: data.companies.length },
    { tableKey: 'customers', label: 'Pelanggan', count: data.customers.length },
    { tableKey: 'products', label: 'Katalog Produk & Layanan', count: data.products.length },
    { tableKey: 'invoices', label: 'Faktur Penjualan', count: data.invoices.length },
    { tableKey: 'invoiceItems', label: 'Rincian Baris Faktur', count: data.invoiceItems.length },
    { tableKey: 'expenses', label: 'Catatan Pengeluaran', count: data.expenses.length },
    { tableKey: 'expenseCategories', label: 'Kategori Beban', count: data.expenseCategories.length },
    { tableKey: 'payments', label: 'Riwayat Pembayaran', count: data.payments.length },
    { tableKey: 'settings', label: 'Konfigurasi Pengaturan', count: data.settings.length },
  ];
}

export function constructBackupPayload(
  data: BackupData,
  referenceDate: Date = new Date()
): BackupPayload {
  const tableCounts: Record<keyof BackupData, number> = {
    companies: data.companies.length,
    customers: data.customers.length,
    products: data.products.length,
    invoices: data.invoices.length,
    invoiceItems: data.invoiceItems.length,
    expenses: data.expenses.length,
    expenseCategories: data.expenseCategories.length,
    payments: data.payments.length,
    settings: data.settings.length,
  };

  const totalRecords = Object.values(tableCounts).reduce((acc, curr) => acc + curr, 0);

  return {
    format: BACKUP_FORMAT,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: referenceDate.toISOString(),
    data,
    metadata: {
      totalRecords,
      tableCounts,
      generatedBy: 'Ficco Local-First Web App',
    },
  };
}

export function triggerJsonDownload(jsonString: string, filename: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
