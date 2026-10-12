import {
  calculateDashboardMetrics,
  generateMonthlyTrends,
  calculateDashboardCategoryBreakdown,
  getDashboardDateBounds,
} from './dashboard-calculations';
import {
  Invoice,
  Payment,
  Expense,
  ExpenseCategory,
} from '@/infrastructure/database/schema';

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

/**
 * Unit test runner for Dashboard financial metrics and aggregations
 */
export function runDashboardDomainUnitTests(): {
  total: number;
  passedCount: number;
  failedCount: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];

  const runTest = (suite: string, name: string, fn: () => void) => {
    try {
      fn();
      results.push({ suite, name, passed: true });
    } catch (err) {
      results.push({
        suite,
        name,
        passed: false,
        error: (err as Error).message,
      });
    }
  };

  // Fixed reference date: 2026-10-15
  const refDate = new Date('2026-10-15T12:00:00Z');

  const mockCategories: ExpenseCategory[] = [
    { id: 'cat_ops', name: 'Operasional', active: true },
    { id: 'cat_soft', name: 'Software', active: true },
  ];

  const mockInvoices: Invoice[] = [
    {
      id: 'inv_1',
      invoiceNumber: 'INV-2026-0001',
      customerId: 'cust_1',
      issueDate: '2026-10-01',
      dueDate: '2026-10-10', // Overdue since refDate is 2026-10-15
      status: 'pending',
      subtotal: 1000000,
      discount: 0,
      tax: 110000,
      total: 1110000,
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'inv_2',
      invoiceNumber: 'INV-2026-0002',
      customerId: 'cust_2',
      issueDate: '2026-10-05',
      dueDate: '2026-10-25', // Not overdue
      status: 'partially_paid',
      subtotal: 2000000,
      discount: 0,
      tax: 0,
      total: 2000000,
      createdAt: '2026-10-05T08:00:00Z',
      updatedAt: '2026-10-05T08:00:00Z',
    },
    {
      id: 'inv_3',
      invoiceNumber: 'INV-2026-0003',
      customerId: 'cust_1',
      issueDate: '2026-09-10',
      dueDate: '2026-09-20',
      status: 'paid',
      subtotal: 500000,
      discount: 0,
      tax: 0,
      total: 500000,
      createdAt: '2026-09-10T08:00:00Z',
      updatedAt: '2026-09-10T08:00:00Z',
    },
  ];

  const mockPayments: Payment[] = [
    {
      id: 'pay_1',
      invoiceId: 'inv_2',
      amount: 800000,
      paymentDate: '2026-10-06',
      paymentMethod: 'bank_transfer',
      createdAt: '2026-10-06T10:00:00Z',
    },
    {
      id: 'pay_2',
      invoiceId: 'inv_3',
      amount: 500000,
      paymentDate: '2026-09-12',
      paymentMethod: 'cash',
      createdAt: '2026-09-12T10:00:00Z',
    },
  ];

  const mockExpenses: Expense[] = [
    {
      id: 'exp_1',
      categoryId: 'cat_ops',
      description: 'Sewa kantor',
      amount: 400000,
      date: '2026-10-02',
      paymentMethod: 'bank_transfer',
      createdAt: '2026-10-02T10:00:00Z',
      updatedAt: '2026-10-02T10:00:00Z',
    },
    {
      id: 'exp_2',
      categoryId: 'cat_soft',
      description: 'Domain & SaaS',
      amount: 150000,
      date: '2026-10-08',
      paymentMethod: 'credit_card',
      createdAt: '2026-10-08T10:00:00Z',
      updatedAt: '2026-10-08T10:00:00Z',
    },
    {
      id: 'exp_3',
      categoryId: 'cat_ops',
      description: 'ATK September',
      amount: 200000,
      date: '2026-09-15',
      paymentMethod: 'cash',
      createdAt: '2026-09-15T10:00:00Z',
      updatedAt: '2026-09-15T10:00:00Z',
    },
  ];

  // -------------------------------------------------------------
  // SUITE 1: Date Range Boundaries
  // -------------------------------------------------------------
  runTest('Date Boundaries', 'Calculates this_month boundaries correctly', () => {
    const bounds = getDashboardDateBounds('this_month', undefined, undefined, refDate);
    assertEqual(bounds.startDate, '2026-10-01', 'Start of Oct 2026');
    assertEqual(bounds.endDate, '2026-10-31', 'End of Oct 2026');
  });

  runTest('Date Boundaries', 'Calculates last_month boundaries correctly', () => {
    const bounds = getDashboardDateBounds('last_month', undefined, undefined, refDate);
    assertEqual(bounds.startDate, '2026-09-01', 'Start of Sep 2026');
    assertEqual(bounds.endDate, '2026-09-30', 'End of Sep 2026');
  });

  // -------------------------------------------------------------
  // SUITE 2: Revenue & Expense Derivation
  // -------------------------------------------------------------
  runTest('Metrics Derivation', 'Calculates revenue and expenses for this_month', () => {
    const metrics = calculateDashboardMetrics(
      mockInvoices,
      mockPayments,
      mockExpenses,
      { dateRange: 'this_month' },
      refDate
    );

    // Revenue in Oct: pay_1 = 800,000
    assertEqual(metrics.revenue, 800000, 'Oct revenue from pay_1');
    // Expenses in Oct: exp_1 (400k) + exp_2 (150k) = 550,000
    assertEqual(metrics.expenses, 550000, 'Oct expenses sum');
  });

  // -------------------------------------------------------------
  // SUITE 3: Profit & Margin Calculation
  // -------------------------------------------------------------
  runTest('Profit & Margin', 'Computes net profit and profit margin percentage', () => {
    const metrics = calculateDashboardMetrics(
      mockInvoices,
      mockPayments,
      mockExpenses,
      { dateRange: 'this_month' },
      refDate
    );

    // 800,000 - 550,000 = 250,000
    assertEqual(metrics.netProfit, 250000, 'Net profit = 250,000');
    // (250,000 / 800,000) * 100 = 31.3%
    assertEqual(metrics.profitMargin, 31.3, 'Profit margin 31.3%');
  });

  // -------------------------------------------------------------
  // SUITE 4: Outstanding & Overdue Invoices
  // -------------------------------------------------------------
  runTest('Invoices Status', 'Detects outstanding and overdue invoices accurately', () => {
    const metrics = calculateDashboardMetrics(
      mockInvoices,
      mockPayments,
      mockExpenses,
      { dateRange: 'this_month' },
      refDate
    );

    // In Oct:
    // inv_1: unpaid 1,110,000, dueDate 2026-10-10 < refDate (2026-10-15) -> OVERDUE
    // inv_2: partially paid (800k paid, 1,200,000 remaining), dueDate 2026-10-25 > refDate -> OUTSTANDING (not overdue)
    // Outstanding total = 1,110,000 + 1,200,000 = 2,310,000
    assertEqual(metrics.outstandingAmount, 2310000, 'Total outstanding amount');
    assertEqual(metrics.outstandingCount, 2, '2 outstanding invoices');

    // Overdue: inv_1 only (1,110,000)
    assertEqual(metrics.overdueAmount, 1110000, 'Overdue amount is 1,110,000');
    assertEqual(metrics.overdueCount, 1, '1 overdue invoice');
  });

  // -------------------------------------------------------------
  // SUITE 5: Monthly Trends
  // -------------------------------------------------------------
  runTest('Monthly Trends', 'Generates 6 months historical trend correctly', () => {
    const trends = generateMonthlyTrends(
      mockPayments,
      mockExpenses,
      mockInvoices,
      6,
      refDate
    );

    assertEqual(trends.length, 6, 'Should generate 6 months of trends');
    const octTrend = trends[trends.length - 1];
    assertEqual(octTrend.monthKey, '2026-10', 'Latest month is Oct 2026');
    assertEqual(octTrend.revenue, 800000, 'Oct trend revenue');
    assertEqual(octTrend.expenses, 550000, 'Oct trend expenses');
    assertEqual(octTrend.netProfit, 250000, 'Oct trend net profit');

    const sepTrend = trends[trends.length - 2];
    assertEqual(sepTrend.monthKey, '2026-09', 'Previous month is Sep 2026');
    assertEqual(sepTrend.revenue, 500000, 'Sep trend revenue');
    assertEqual(sepTrend.expenses, 200000, 'Sep trend expenses');
  });

  // -------------------------------------------------------------
  // SUITE 6: Category Breakdown
  // -------------------------------------------------------------
  runTest('Category Breakdown', 'Aggregates expense shares for dashboard', () => {
    const breakdown = calculateDashboardCategoryBreakdown(
      mockExpenses,
      mockCategories,
      { dateRange: 'this_month' },
      refDate
    );

    assertEqual(breakdown.length, 2, '2 categories in Oct');
    assertEqual(breakdown[0].categoryId, 'cat_ops', 'Top category is Operasional');
    assertEqual(breakdown[0].amount, 400000, 'Operasional amount = 400,000');
    // 400k / 550k = 72.7%
    assertEqual(breakdown[0].percentage, 72.7, 'Operasional percentage = 72.7%');
  });

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    total: results.length,
    passedCount,
    failedCount,
    results,
  };
}
