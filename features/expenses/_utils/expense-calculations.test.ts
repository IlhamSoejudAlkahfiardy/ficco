import {
  calculateExpenseTotals,
  calculateCategoryBreakdown,
  calculateExpenseSummary,
  filterExpenses,
  getDateRangeBounds,
  roundCurrency,
} from './expense-calculations';
import { Expense, ExpenseCategory } from '../_types/expense.types';

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
 * Unit test runner for Expense domain calculations and filters
 */
export function runExpenseDomainUnitTests(): {
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

  const mockCategories: ExpenseCategory[] = [
    { id: 'cat_ops', name: 'Operasional Kantor', active: true },
    { id: 'cat_salary', name: 'Gaji & Upah', active: true },
    { id: 'cat_marketing', name: 'Pemasaran & Iklan', active: true },
    { id: 'cat_software', name: 'Server & Software', active: true },
  ];

  // Fixed reference date: 2026-10-15
  const refDate = new Date('2026-10-15T12:00:00Z');

  const mockExpenses: Expense[] = [
    {
      id: 'exp_1',
      categoryId: 'cat_ops',
      description: 'Sewa ruang kantor Oktober',
      amount: 5000000,
      date: '2026-10-01',
      paymentMethod: 'bank_transfer',
      notes: 'Gedung Wisma Flamboyan',
      createdAt: '2026-10-01T08:00:00Z',
      updatedAt: '2026-10-01T08:00:00Z',
    },
    {
      id: 'exp_2',
      categoryId: 'cat_software',
      description: 'Langganan Cloud Server & Vercel',
      amount: 750000,
      date: '2026-10-05',
      paymentMethod: 'credit_card',
      notes: 'Invoice #VCL-9921',
      createdAt: '2026-10-05T09:00:00Z',
      updatedAt: '2026-10-05T09:00:00Z',
    },
    {
      id: 'exp_3',
      categoryId: 'cat_marketing',
      description: 'Iklan Instagram Ads Q4',
      amount: 1500000,
      date: '2026-10-10',
      paymentMethod: 'credit_card',
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
    },
    {
      id: 'exp_4',
      categoryId: 'cat_ops',
      description: 'Pembelian Kertas ATK & Tinta Printer',
      amount: 250000,
      date: '2026-09-20',
      paymentMethod: 'cash',
      createdAt: '2026-09-20T14:00:00Z',
      updatedAt: '2026-09-20T14:00:00Z',
    },
    {
      id: 'exp_5',
      categoryId: 'cat_salary',
      description: 'Gaji Staff IT September',
      amount: 4000000,
      date: '2026-09-28',
      paymentMethod: 'bank_transfer',
      createdAt: '2026-09-28T16:00:00Z',
      updatedAt: '2026-09-28T16:00:00Z',
    },
    {
      id: 'exp_6',
      categoryId: 'cat_software',
      description: 'Domain renewal 2025',
      amount: 200000,
      date: '2025-11-15',
      paymentMethod: 'bank_transfer',
      createdAt: '2025-11-15T10:00:00Z',
      updatedAt: '2025-11-15T10:00:00Z',
    },
  ];

  // -------------------------------------------------------------
  // SUITE 1: Totals & Aggregations
  // -------------------------------------------------------------
  runTest('Totals & Aggregations', 'Calculates sum, average, min, max correctly', () => {
    const subset = [mockExpenses[0], mockExpenses[1], mockExpenses[2]]; // 5M + 750k + 1.5M = 7.25M
    const res = calculateExpenseTotals(subset);

    assertEqual(res.totalAmount, 7250000, 'Total expense amount');
    assertEqual(res.count, 3, 'Total count');
    assertEqual(res.averageAmount, roundCurrency(7250000 / 3), 'Average expense amount');
    assertEqual(res.minAmount, 750000, 'Min expense amount');
    assertEqual(res.maxAmount, 5000000, 'Max expense amount');
  });

  runTest('Totals & Aggregations', 'Handles empty array gracefully', () => {
    const res = calculateExpenseTotals([]);
    assertEqual(res.totalAmount, 0, 'Total should be 0');
    assertEqual(res.count, 0, 'Count should be 0');
    assertEqual(res.averageAmount, 0, 'Average should be 0');
  });

  runTest('Totals & Aggregations', 'Avoids floating point precision errors', () => {
    const decimals: Expense[] = [
      {
        id: '1',
        categoryId: 'cat_ops',
        description: 'T1',
        amount: 0.1,
        date: '2026-10-01',
        paymentMethod: 'cash',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        categoryId: 'cat_ops',
        description: 'T2',
        amount: 0.2,
        date: '2026-10-01',
        paymentMethod: 'cash',
        createdAt: '',
        updatedAt: '',
      },
    ];
    const res = calculateExpenseTotals(decimals);
    assertEqual(res.totalAmount, 0.3, '0.1 + 0.2 should be rounded to 0.3');
  });

  // -------------------------------------------------------------
  // SUITE 2: Category Breakdown
  // -------------------------------------------------------------
  runTest('Category Breakdown', 'Aggregates amount and calculates percentage per category', () => {
    // Oct expenses:
    // cat_ops: 5M
    // cat_software: 750k
    // cat_marketing: 1.5M
    // Total = 7.25M
    const octExpenses = [mockExpenses[0], mockExpenses[1], mockExpenses[2]];
    const breakdown = calculateCategoryBreakdown(octExpenses, mockCategories);

    assertEqual(breakdown.length, 3, '3 categories present');
    assertEqual(breakdown[0].categoryId, 'cat_ops', 'Top category is Operasional Kantor');
    assertEqual(breakdown[0].amount, 5000000, 'Operasional Kantor amount');
    assertEqual(breakdown[0].percentage, roundCurrency((5000000 / 7250000) * 100, 1), 'Share percentage');

    assertEqual(breakdown[1].categoryId, 'cat_marketing', 'Second is Marketing');
    assertEqual(breakdown[2].categoryId, 'cat_software', 'Third is Software');
  });

  // -------------------------------------------------------------
  // SUITE 3: Date Filtering
  // -------------------------------------------------------------
  runTest('Date Filtering', 'Filters this_month correctly relative to refDate', () => {
    const filtered = filterExpenses(
      mockExpenses,
      mockCategories,
      { dateRange: 'this_month' },
      refDate
    );
    assertEqual(filtered.length, 3, 'Only Oct 2026 expenses');
    assert(
      filtered.every((e) => e.date.startsWith('2026-10')),
      'All are in 2026-10'
    );
  });

  runTest('Date Filtering', 'Filters last_month correctly relative to refDate', () => {
    const filtered = filterExpenses(
      mockExpenses,
      mockCategories,
      { dateRange: 'last_month' },
      refDate
    );
    assertEqual(filtered.length, 2, 'Only Sep 2026 expenses (exp_4, exp_5)');
    assert(
      filtered.every((e) => e.date.startsWith('2026-09')),
      'All are in 2026-09'
    );
  });

  runTest('Date Filtering', 'Filters this_year correctly', () => {
    const filtered = filterExpenses(
      mockExpenses,
      mockCategories,
      { dateRange: 'this_year' },
      refDate
    );
    assertEqual(filtered.length, 5, 'All 2026 expenses (excludes 2025)');
    assert(
      filtered.every((e) => e.date.startsWith('2026')),
      'All belong to 2026'
    );
  });

  runTest('Date Filtering', 'Custom date range boundaries', () => {
    const bounds = getDateRangeBounds('custom', '2026-09-01', '2026-09-25');
    assertEqual(bounds.startDate, '2026-09-01', 'Start date match');
    assertEqual(bounds.endDate, '2026-09-25', 'End date match');

    const filtered = filterExpenses(
      mockExpenses,
      mockCategories,
      {
        dateRange: 'custom',
        startDate: '2026-09-01',
        endDate: '2026-09-25',
      },
      refDate
    );
    assertEqual(filtered.length, 1, 'Only exp_4 matches 2026-09-20');
    assertEqual(filtered[0].id, 'exp_4', 'Matched exp_4');
  });

  // -------------------------------------------------------------
  // SUITE 4: Search & Payment Method
  // -------------------------------------------------------------
  runTest('Search & Filter', 'Searches by description and notes', () => {
    const searchDesc = filterExpenses(mockExpenses, mockCategories, { search: 'kantor' });
    assertEqual(searchDesc.length, 1, 'Found office rental');

    const searchNotes = filterExpenses(mockExpenses, mockCategories, { search: 'flamboyan' });
    assertEqual(searchNotes.length, 1, 'Found via notes match');

    const searchCat = filterExpenses(mockExpenses, mockCategories, { search: 'pemasaran' });
    assertEqual(searchCat.length, 1, 'Found via category name match');
  });

  runTest('Search & Filter', 'Filters by payment method', () => {
    const creditCardOnly = filterExpenses(mockExpenses, mockCategories, {
      paymentMethod: 'credit_card',
    });
    assertEqual(creditCardOnly.length, 2, '2 credit card transactions');
    assert(
      creditCardOnly.every((e) => e.paymentMethod === 'credit_card'),
      'Matches credit_card'
    );
  });

  // -------------------------------------------------------------
  // SUITE 5: Sorting
  // -------------------------------------------------------------
  runTest('Sorting', 'Sorts by amount descending and ascending', () => {
    const desc = filterExpenses(mockExpenses, mockCategories, { sortBy: 'amount_desc' });
    assertEqual(desc[0].amount, 5000000, 'Highest first');
    assertEqual(desc[desc.length - 1].amount, 200000, 'Lowest last');

    const asc = filterExpenses(mockExpenses, mockCategories, { sortBy: 'amount_asc' });
    assertEqual(asc[0].amount, 200000, 'Lowest first');
    assertEqual(asc[asc.length - 1].amount, 5000000, 'Highest last');
  });

  // -------------------------------------------------------------
  // SUITE 6: Executive Summary
  // -------------------------------------------------------------
  runTest('Executive Summary', 'Calculates summary metrics and month-over-month comparison', () => {
    const summary = calculateExpenseSummary(mockExpenses, mockCategories, refDate);

    // This month (Oct 2026) = 7,250,000
    // Last month (Sep 2026) = 4,250,000
    assertEqual(summary.thisMonthAmount, 7250000, 'This month amount');
    assertEqual(summary.lastMonthAmount, 4250000, 'Last month amount');
    assertEqual(summary.thisMonthCount, 3, 'This month count');
    assertEqual(summary.totalCount, 6, 'Total count');

    const expectedMoM = roundCurrency(((7250000 - 4250000) / 4250000) * 100, 1);
    assertEqual(summary.monthOverMonthDiff, expectedMoM, 'MoM diff percentage');
    assert(summary.topCategory !== null, 'Top category is present');
    assertEqual(summary.topCategory?.name, 'Operasional Kantor', 'Top category name');
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
