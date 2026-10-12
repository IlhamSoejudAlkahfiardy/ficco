import {
  getReportDateBounds,
  getPreviousReportBounds,
  calculateProfitLossSummary,
  generatePeriodicFinancialRows,
  calculateCustomerRevenue,
  calculateProductRevenue,
  calculateCategoryExpenses,
  calculatePaymentMethodExpenses,
} from './reports-calculations';
import {
  Invoice,
  InvoiceItem,
  Payment,
  Expense,
  ExpenseCategory,
  Customer,
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

export function runReportsDomainUnitTests(): {
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

  // --- Suite 1: Date Bounds & Periods ---
  test('Suite 1 - Date Bounds', 'Correctly calculates this_month bounds', () => {
    const fixedDate = new Date(2026, 9, 12); // Oct 12, 2026
    const bounds = getReportDateBounds({ preset: 'this_month' }, fixedDate);
    assertEqual(bounds.startDate, '2026-10-01', 'Start of this month');
    assertEqual(bounds.endDate, '2026-10-31', 'End of this month');
  });

  test('Suite 1 - Date Bounds', 'Correctly calculates this_quarter bounds', () => {
    const fixedDate = new Date(2026, 9, 12); // Oct 12, 2026 (Q4)
    const bounds = getReportDateBounds({ preset: 'this_quarter' }, fixedDate);
    assertEqual(bounds.startDate, '2026-10-01', 'Start of Q4');
    assertEqual(bounds.endDate, '2026-12-31', 'End of Q4');
  });

  test('Suite 1 - Date Bounds', 'Correctly calculates previous period bounds', () => {
    const prev = getPreviousReportBounds('2026-10-01', '2026-10-31');
    assert(prev.prevEndDate === '2026-09-30', 'Previous end date is last day of prev month');
  });

  // --- Suite 2: Profit & Loss Calculations ---
  test('Suite 2 - Profit & Loss', 'Calculates net profit, margin %, and growth correctly', () => {
    const pnl = calculateProfitLossSummary(10_000_000, 4_000_000, 8_000_000, 5_000_000);
    assertEqual(pnl.netProfit, 6_000_000, 'Net profit should be 6M');
    assertEqual(pnl.profitMargin, 60, 'Profit margin should be 60%');
    assertEqual(pnl.revenueGrowth, 25, 'Revenue growth should be 25%');
    assertEqual(pnl.expenseGrowth, -20, 'Expense decreased by 20%');
  });

  test('Suite 2 - Profit & Loss', 'Handles zero revenue safely without NaN', () => {
    const pnl = calculateProfitLossSummary(0, 2_000_000, 0, 0);
    assertEqual(pnl.netProfit, -2_000_000, 'Net loss of 2M');
    assertEqual(pnl.profitMargin, 0, 'Zero margin without NaN');
  });

  // --- Suite 3: Periodic Financial Rows ---
  test('Suite 3 - Periodic Rows', 'Aggregates monthly rows chronologically', () => {
    const invoices: Invoice[] = [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-001',
        customerId: 'c1',
        issueDate: '2026-09-10',
        dueDate: '2026-09-20',
        status: 'paid',
        subtotal: 1_000_000,
        discount: 0,
        tax: 0,
        total: 1_000_000,
        createdAt: '2026-09-10T00:00:00Z',
        updatedAt: '2026-09-10T00:00:00Z',
      },
    ];

    const payments: Payment[] = [
      {
        id: 'pm-1',
        invoiceId: 'inv-2',
        amount: 2_000_000,
        paymentDate: '2026-10-05',
        paymentMethod: 'bank_transfer',
        createdAt: '2026-10-05T00:00:00Z',
      },
    ];

    const expenses: Expense[] = [
      {
        id: 'exp-1',
        categoryId: 'cat-1',
        description: 'Server Host',
        amount: 500_000,
        date: '2026-10-06',
        paymentMethod: 'credit_card',
        createdAt: '2026-10-06T00:00:00Z',
        updatedAt: '2026-10-06T00:00:00Z',
      },
    ];

    const rows = generatePeriodicFinancialRows(invoices, payments, expenses, '2026-09-01', '2026-10-31');
    assert(rows.length >= 2, 'Should generate September and October rows');
    const octRow = rows.find((r) => r.periodKey === '2026-10');
    assert(!!octRow, 'October row must exist');
    assertEqual(octRow?.revenue, 2_000_000, 'October revenue is 2M');
    assertEqual(octRow?.expenses, 500_000, 'October expenses is 500k');
    assertEqual(octRow?.netProfit, 1_500_000, 'October net profit is 1.5M');
  });

  // --- Suite 4: Customer Revenue Distribution ---
  test('Suite 4 - Customer Revenue', 'Calculates revenue ranking and customer share', () => {
    const customers: Customer[] = [
      { id: 'c1', name: 'PT Maju Terus', createdAt: '', updatedAt: '' },
      { id: 'c2', name: 'CV Sukses Mandiri', createdAt: '', updatedAt: '' },
    ];

    const invoices: Invoice[] = [
      {
        id: 'inv-1',
        invoiceNumber: 'INV-1',
        customerId: 'c1',
        issueDate: '2026-10-01',
        dueDate: '2026-10-10',
        status: 'paid',
        subtotal: 3_000_000,
        discount: 0,
        tax: 0,
        total: 3_000_000,
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'inv-2',
        invoiceNumber: 'INV-2',
        customerId: 'c2',
        issueDate: '2026-10-02',
        dueDate: '2026-10-10',
        status: 'paid',
        subtotal: 1_000_000,
        discount: 0,
        tax: 0,
        total: 1_000_000,
        createdAt: '',
        updatedAt: '',
      },
    ];

    const payments: Payment[] = [];

    const custRevenue = calculateCustomerRevenue(invoices, payments, customers, '2026-10-01', '2026-10-31');
    assertEqual(custRevenue.length, 2, 'Should have 2 customers');
    assertEqual(custRevenue[0].customerName, 'PT Maju Terus', 'Top customer is PT Maju Terus');
    assertEqual(custRevenue[0].totalRevenue, 3_000_000, 'Top customer revenue is 3M');
    assertEqual(custRevenue[0].percentage, 75, 'Top customer represents 75%');
  });

  // --- Suite 5: Expense Categories & Payment Methods ---
  test('Suite 5 - Expense Breakdown', 'Calculates categories and payment methods breakdown', () => {
    const categories: ExpenseCategory[] = [
      { id: 'cat-1', name: 'Sewa & Kantor', active: true },
      { id: 'cat-2', name: 'Utilitas & Listrik', active: true },
    ];

    const expenses: Expense[] = [
      {
        id: 'e1',
        categoryId: 'cat-1',
        description: 'Sewa Ruko',
        amount: 8_000_000,
        date: '2026-10-02',
        paymentMethod: 'bank_transfer',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'e2',
        categoryId: 'cat-2',
        description: 'Listrik PLN',
        amount: 2_000_000,
        date: '2026-10-04',
        paymentMethod: 'qris',
        createdAt: '',
        updatedAt: '',
      },
    ];

    const catRows = calculateCategoryExpenses(expenses, categories, '2026-10-01', '2026-10-31');
    assertEqual(catRows[0].categoryName, 'Sewa & Kantor', 'Top category is Sewa & Kantor');
    assertEqual(catRows[0].percentage, 80, '80% of total');

    const methodRows = calculatePaymentMethodExpenses(expenses, '2026-10-01', '2026-10-31');
    assertEqual(methodRows[0].method, 'bank_transfer', 'Top method is bank transfer');
    assertEqual(methodRows[0].percentage, 80, '80% via bank transfer');
  });

  const passedCount = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passedCount,
    failedCount: results.length - passedCount,
    results,
  };
}
