import { Expense, ExpenseCategory } from '@/infrastructure/database/schema';

export type { Expense, ExpenseCategory };

/**
 * Extended Expense interface with resolved category entity
 */
export interface ExpenseWithCategory extends Expense {
  category?: ExpenseCategory;
  categoryName?: string;
}

/**
 * Supported payment methods for expenses
 */
export const EXPENSE_PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Transfer Bank', icon: 'creditCard' },
  { value: 'cash', label: 'Tunai / Kas Kecil', icon: 'wallet' },
  { value: 'credit_card', label: 'Kartu Kredit', icon: 'creditCard' },
  { value: 'debit_card', label: 'Kartu Debit', icon: 'creditCard' },
  { value: 'qris', label: 'QRIS', icon: 'receipt' },
  { value: 'ewallet', label: 'e-Wallet (GoPay, OVO, Dana)', icon: 'wallet' },
  { value: 'giro_check', label: 'Giro / Cek', icon: 'fileText' },
  { value: 'other', label: 'Lainnya', icon: 'receipt' },
] as const;

export type ExpensePaymentMethodValue = (typeof EXPENSE_PAYMENT_METHODS)[number]['value'];

/**
 * Predefined default expense categories for local initialization
 */
export const DEFAULT_EXPENSE_CATEGORIES: Omit<ExpenseCategory, 'id'>[] = [
  {
    name: 'Operasional Kantor',
    description: 'Sewa kantor, listrik, air, internet, alat tulis kantor (ATK)',
    active: true,
  },
  {
    name: 'Gaji & Upah',
    description: 'Gaji karyawan, tunjangan, upah lembur, insentif kerja',
    active: true,
  },
  {
    name: 'Pemasaran & Iklan',
    description: 'Iklan digital, promosi media sosial, materi branding, cetak brosur',
    active: true,
  },
  {
    name: 'Server & Software',
    description: 'Langganan SaaS, cloud hosting, domain, lisensi perangkat lunak',
    active: true,
  },
  {
    name: 'Transportasi & Perjalanan',
    description: 'BBM, tol, tiket transportasi dinas, parkir, akomodasi',
    active: true,
  },
  {
    name: 'Pemeliharaan & Servis',
    description: 'Perbaikan aset, servis AC, perawatan komputer dan perangkat keras',
    active: true,
  },
  {
    name: 'Pajak & Legalitas',
    description: 'Biaya notaris, perizinan usaha, retribusi resmi, konsultasi hukum',
    active: true,
  },
  {
    name: 'Lain-lain',
    description: 'Pengeluaran rupa-rupa dan operasional tak terduga',
    active: true,
  },
];

/**
 * Filter and sorting criteria for expenses
 */
export type ExpenseSortBy = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc';

export type ExpenseDateRangePreset = 'all' | 'this_month' | 'last_month' | 'this_year' | 'custom';

export interface ExpenseFilter {
  search?: string;
  categoryId?: string; // 'all' or specific id
  paymentMethod?: string; // 'all' or specific method
  dateRange?: ExpenseDateRangePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  sortBy?: ExpenseSortBy;
}

/**
 * Breakdown of expenses by category
 */
export interface CategoryBreakdownItem {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number;
}

/**
 * Aggregated summary statistics for expenses
 */
export interface ExpenseSummaryStats {
  totalAmount: number;
  thisMonthAmount: number;
  lastMonthAmount: number;
  monthOverMonthDiff: number; // percentage difference
  totalCount: number;
  thisMonthCount: number;
  averageExpense: number;
  topCategory: {
    id: string;
    name: string;
    amount: number;
    percentage: number;
  } | null;
  categoryBreakdown: CategoryBreakdownItem[];
}
