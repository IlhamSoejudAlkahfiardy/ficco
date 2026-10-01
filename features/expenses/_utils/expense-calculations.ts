import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
} from 'date-fns';
import {
  Expense,
  ExpenseCategory,
  ExpenseFilter,
  ExpenseSummaryStats,
  CategoryBreakdownItem,
  ExpenseDateRangePreset,
} from '../_types/expense.types';

/**
 * Mitigate JavaScript floating-point precision issues
 */
export function roundCurrency(amount: number, decimals: number = 2): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

/**
 * Calculates basic metrics for an array of expenses
 */
export function calculateExpenseTotals(expenses: Expense[]): {
  totalAmount: number;
  count: number;
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
} {
  if (!expenses || expenses.length === 0) {
    return {
      totalAmount: 0,
      count: 0,
      averageAmount: 0,
      minAmount: 0,
      maxAmount: 0,
    };
  }

  let total = 0;
  let min = expenses[0].amount;
  let max = expenses[0].amount;

  for (const exp of expenses) {
    total += exp.amount;
    if (exp.amount < min) min = exp.amount;
    if (exp.amount > max) max = exp.amount;
  }

  const roundedTotal = roundCurrency(total);
  const count = expenses.length;
  const averageAmount = count > 0 ? roundCurrency(roundedTotal / count) : 0;

  return {
    totalAmount: roundedTotal,
    count,
    averageAmount,
    minAmount: roundCurrency(min),
    maxAmount: roundCurrency(max),
  };
}

/**
 * Categorizes and aggregates expenses with share percentages
 */
export function calculateCategoryBreakdown(
  expenses: Expense[],
  categories: ExpenseCategory[]
): CategoryBreakdownItem[] {
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name));

  const totalAmount = calculateExpenseTotals(expenses).totalAmount;
  const grouping = new Map<string, { amount: number; count: number }>();

  for (const exp of expenses) {
    const current = grouping.get(exp.categoryId) || { amount: 0, count: 0 };
    grouping.set(exp.categoryId, {
      amount: roundCurrency(current.amount + exp.amount),
      count: current.count + 1,
    });
  }

  const result: CategoryBreakdownItem[] = [];

  for (const [categoryId, data] of grouping.entries()) {
    const categoryName = categoryMap.get(categoryId) || 'Kategori Lain';
    const percentage =
      totalAmount > 0 ? roundCurrency((data.amount / totalAmount) * 100, 1) : 0;

    result.push({
      categoryId,
      categoryName,
      amount: data.amount,
      count: data.count,
      percentage,
    });
  }

  // Sort descending by amount
  return result.sort((a, b) => b.amount - a.amount);
}

/**
 * Computes ISO date range boundaries based on preset
 */
export function getDateRangeBounds(
  preset?: ExpenseDateRangePreset,
  customStart?: string,
  customEnd?: string,
  refDate: Date = new Date()
): { startDate?: string; endDate?: string } {
  if (!preset || preset === 'all') {
    return {};
  }

  if (preset === 'this_month') {
    return {
      startDate: format(startOfMonth(refDate), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(refDate), 'yyyy-MM-dd'),
    };
  }

  if (preset === 'last_month') {
    const prevMonth = subMonths(refDate, 1);
    return {
      startDate: format(startOfMonth(prevMonth), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(prevMonth), 'yyyy-MM-dd'),
    };
  }

  if (preset === 'this_year') {
    return {
      startDate: format(startOfYear(refDate), 'yyyy-MM-dd'),
      endDate: format(endOfYear(refDate), 'yyyy-MM-dd'),
    };
  }

  if (preset === 'custom') {
    return {
      startDate: customStart,
      endDate: customEnd,
    };
  }

  return {};
}

/**
 * Pure function to filter and sort expenses
 */
export function filterExpenses(
  expenses: Expense[],
  categories: ExpenseCategory[],
  filter: ExpenseFilter,
  refDate: Date = new Date()
): Expense[] {
  const categoryMap = new Map<string, string>();
  categories.forEach((c) => categoryMap.set(c.id, c.name.toLowerCase()));

  const searchKeyword = filter.search?.trim().toLowerCase();
  const categoryFilter = filter.categoryId;
  const paymentMethodFilter = filter.paymentMethod;
  const dateBounds = getDateRangeBounds(
    filter.dateRange,
    filter.startDate,
    filter.endDate,
    refDate
  );

  let filtered = expenses.filter((exp) => {
    // 1. Search across description, notes, and category name
    if (searchKeyword) {
      const descMatch = exp.description.toLowerCase().includes(searchKeyword);
      const notesMatch = exp.notes?.toLowerCase().includes(searchKeyword) ?? false;
      const catName = categoryMap.get(exp.categoryId) ?? '';
      const catMatch = catName.includes(searchKeyword);

      if (!descMatch && !notesMatch && !catMatch) {
        return false;
      }
    }

    // 2. Category Filter
    if (categoryFilter && categoryFilter !== 'all') {
      if (exp.categoryId !== categoryFilter) {
        return false;
      }
    }

    // 3. Payment Method Filter
    if (paymentMethodFilter && paymentMethodFilter !== 'all') {
      if (exp.paymentMethod !== paymentMethodFilter) {
        return false;
      }
    }

    // 4. Date Range Filter
    if (dateBounds.startDate && exp.date < dateBounds.startDate) {
      return false;
    }
    if (dateBounds.endDate && exp.date > dateBounds.endDate) {
      return false;
    }

    return true;
  });

  // Sorting
  const sortBy = filter.sortBy || 'date_desc';
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'date_asc':
        return a.date.localeCompare(b.date);
      case 'amount_desc':
        return b.amount - a.amount;
      case 'amount_asc':
        return a.amount - b.amount;
      case 'date_desc':
      default:
        // Newest date first, fallback to createdAt
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }
        return b.createdAt.localeCompare(a.createdAt);
    }
  });

  return filtered;
}

/**
 * Calculates comprehensive executive summary statistics for expenses
 */
export function calculateExpenseSummary(
  expenses: Expense[],
  categories: ExpenseCategory[],
  refDate: Date = new Date()
): ExpenseSummaryStats {
  const totalTotals = calculateExpenseTotals(expenses);
  const totalAmount = totalTotals.totalAmount;
  const totalCount = totalTotals.count;
  const averageExpense = totalTotals.averageAmount;

  // This month
  const thisMonthStart = format(startOfMonth(refDate), 'yyyy-MM-dd');
  const thisMonthEnd = format(endOfMonth(refDate), 'yyyy-MM-dd');
  const thisMonthExpenses = expenses.filter(
    (e) => e.date >= thisMonthStart && e.date <= thisMonthEnd
  );
  const thisMonthTotals = calculateExpenseTotals(thisMonthExpenses);

  // Last month
  const lastMonth = subMonths(refDate, 1);
  const lastMonthStart = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
  const lastMonthEnd = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
  const lastMonthExpenses = expenses.filter(
    (e) => e.date >= lastMonthStart && e.date <= lastMonthEnd
  );
  const lastMonthTotals = calculateExpenseTotals(lastMonthExpenses);

  // Month-over-month calculation
  let monthOverMonthDiff = 0;
  if (lastMonthTotals.totalAmount > 0) {
    monthOverMonthDiff = roundCurrency(
      ((thisMonthTotals.totalAmount - lastMonthTotals.totalAmount) /
        lastMonthTotals.totalAmount) *
        100,
      1
    );
  } else if (thisMonthTotals.totalAmount > 0) {
    monthOverMonthDiff = 100;
  }

  // Category breakdown for all expenses
  const categoryBreakdown = calculateCategoryBreakdown(expenses, categories);
  const topCategory =
    categoryBreakdown.length > 0
      ? {
          id: categoryBreakdown[0].categoryId,
          name: categoryBreakdown[0].categoryName,
          amount: categoryBreakdown[0].amount,
          percentage: categoryBreakdown[0].percentage,
        }
      : null;

  return {
    totalAmount,
    thisMonthAmount: thisMonthTotals.totalAmount,
    lastMonthAmount: lastMonthTotals.totalAmount,
    monthOverMonthDiff,
    totalCount,
    thisMonthCount: thisMonthTotals.count,
    averageExpense,
    topCategory,
    categoryBreakdown,
  };
}
