export type ReportDatePreset =
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'all'
  | 'custom';

export interface ReportFilter {
  preset: ReportDatePreset;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface ProfitLossSummary {
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number; // percentage
  revenueGrowth: number; // % vs previous period
  expenseGrowth: number; // % vs previous period
  netProfitGrowth: number; // % vs previous period
  previousRevenue: number;
  previousExpenses: number;
  previousNetProfit: number;
}

export interface PeriodicFinancialRow {
  periodKey: string; // YYYY-MM
  periodLabel: string; // e.g. "Okt 2026"
  revenue: number;
  expenses: number;
  netProfit: number;
  profitMargin: number; // percentage
  invoicesCount: number;
  expensesCount: number;
}

export interface CustomerRevenueRow {
  customerId: string;
  customerName: string;
  invoicesCount: number;
  paidInvoicesCount: number;
  totalRevenue: number;
  percentage: number; // % of total revenue
}

export interface ProductRevenueRow {
  productId?: string;
  productName: string;
  quantity: number;
  totalRevenue: number;
  percentage: number; // % of total items revenue
}

export interface CategoryExpenseRow {
  categoryId: string;
  categoryName: string;
  transactionCount: number;
  totalAmount: number;
  percentage: number; // % of total expenses
}

export interface PaymentMethodExpenseRow {
  method: string;
  methodLabel: string;
  count: number;
  totalAmount: number;
  percentage: number; // % of total expenses
}

export interface RevenueReportData {
  totalRevenue: number;
  totalInvoiced: number;
  collectionRate: number; // % of invoiced that is paid
  invoicesPaidCount: number;
  totalInvoicesCount: number;
  averageInvoiceValue: number;
  byCustomer: CustomerRevenueRow[];
  byProduct: ProductRevenueRow[];
  periodicTrend: PeriodicFinancialRow[];
}

export interface ExpenseReportData {
  totalExpenses: number;
  totalTransactions: number;
  averageExpense: number;
  byCategory: CategoryExpenseRow[];
  byPaymentMethod: PaymentMethodExpenseRow[];
  periodicTrend: PeriodicFinancialRow[];
}

export interface ReportsData {
  filter: ReportFilter;
  startDate: string;
  endDate: string;
  profitLoss: ProfitLossSummary;
  periodicRows: PeriodicFinancialRow[];
  revenue: RevenueReportData;
  expenses: ExpenseReportData;
}
