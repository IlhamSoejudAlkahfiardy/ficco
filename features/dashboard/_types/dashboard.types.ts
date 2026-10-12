import { InvoiceStatus } from '@/infrastructure/database/schema';

export type DashboardDateRangePreset =
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'all'
  | 'custom';

export interface DashboardFilter {
  dateRange: DashboardDateRangePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface DashboardMetrics {
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number; // percentage
  outstandingAmount: number;
  outstandingCount: number;
  overdueAmount: number;
  overdueCount: number;
  paidInvoicesAmount: number;
  paidInvoicesCount: number;
  totalInvoicesCount: number;
  totalExpensesCount: number;
  revenueMoMDiff: number; // % vs previous period
  expenseMoMDiff: number; // % vs previous period
}

export interface RecentInvoiceItem {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  total: number;
  totalPaid: number;
  remainingBalance: number;
}

export interface RecentExpenseItem {
  id: string;
  description: string;
  categoryId: string;
  categoryName: string;
  date: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
}

export interface MonthlyFinancialTrend {
  monthKey: string; // YYYY-MM
  label: string; // e.g. 'Okt 2026'
  revenue: number;
  expenses: number;
  netProfit: number;
}

export interface ExpenseCategoryShare {
  categoryId: string;
  name: string;
  amount: number;
  percentage: number;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  monthlyTrend: MonthlyFinancialTrend[];
  recentInvoices: RecentInvoiceItem[];
  recentExpenses: RecentExpenseItem[];
  categoryBreakdown: ExpenseCategoryShare[];
}
