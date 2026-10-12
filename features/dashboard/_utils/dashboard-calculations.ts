import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
} from 'date-fns';
import {
  Invoice,
  Payment,
  Expense,
  ExpenseCategory,
} from '@/infrastructure/database/schema';
import {
  DashboardFilter,
  DashboardMetrics,
  DashboardDateRangePreset,
  MonthlyFinancialTrend,
  ExpenseCategoryShare,
} from '../_types/dashboard.types';
import {
  roundCurrency,
  calculatePaymentBalance,
} from '@/features/invoices/_utils/invoice-calculations';

/**
 * Returns ISO date boundaries (YYYY-MM-DD) for a given filter preset
 */
export function getDashboardDateBounds(
  preset: DashboardDateRangePreset,
  customStart?: string,
  customEnd?: string,
  refDate: Date = new Date()
): { startDate?: string; endDate?: string } {
  if (preset === 'all') {
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
 * Returns date boundaries for the previous comparison period
 */
export function getPreviousPeriodBounds(
  preset: DashboardDateRangePreset,
  refDate: Date = new Date()
): { startDate?: string; endDate?: string } {
  if (preset === 'this_month') {
    const lastMonth = subMonths(refDate, 1);
    return {
      startDate: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
    };
  }

  if (preset === 'last_month') {
    const twoMonthsAgo = subMonths(refDate, 2);
    return {
      startDate: format(startOfMonth(twoMonthsAgo), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(twoMonthsAgo), 'yyyy-MM-dd'),
    };
  }

  if (preset === 'this_year') {
    const prevYear = subYears(refDate, 1);
    return {
      startDate: format(startOfYear(prevYear), 'yyyy-MM-dd'),
      endDate: format(endOfYear(prevYear), 'yyyy-MM-dd'),
    };
  }

  return {};
}

/**
 * Pure calculation engine for Executive Dashboard metrics
 */
export function calculateDashboardMetrics(
  invoices: Invoice[],
  payments: Payment[],
  expenses: Expense[],
  filter: DashboardFilter,
  refDate: Date = new Date()
): DashboardMetrics {
  const currentBounds = getDashboardDateBounds(
    filter.dateRange,
    filter.startDate,
    filter.endDate,
    refDate
  );
  const prevBounds = getPreviousPeriodBounds(filter.dateRange, refDate);

  // Group payments by invoiceId
  const paymentsByInvoice = new Map<string, Payment[]>();
  for (const pay of payments) {
    const list = paymentsByInvoice.get(pay.invoiceId) || [];
    list.push(pay);
    paymentsByInvoice.set(pay.invoiceId, list);
  }

  // 1. Calculate Revenue (Current period)
  const isDateWithin = (dateStr: string, bounds: { startDate?: string; endDate?: string }) => {
    if (!bounds.startDate && !bounds.endDate) return true;
    if (bounds.startDate && dateStr < bounds.startDate) return false;
    if (bounds.endDate && dateStr > bounds.endDate) return false;
    return true;
  };

  // Collected payments in current period
  let currentRevenue = 0;
  for (const pay of payments) {
    if (isDateWithin(pay.paymentDate, currentBounds)) {
      currentRevenue += pay.amount;
    }
  }

  // Fallback: If an invoice was marked 'paid' directly without individual payment entries
  for (const inv of invoices) {
    const invPayments = paymentsByInvoice.get(inv.id) || [];
    if (invPayments.length === 0 && inv.status === 'paid') {
      if (isDateWithin(inv.issueDate, currentBounds)) {
        currentRevenue += inv.total;
      }
    }
  }
  currentRevenue = roundCurrency(currentRevenue);

  // Previous period revenue
  let prevRevenue = 0;
  if (prevBounds.startDate || prevBounds.endDate) {
    for (const pay of payments) {
      if (isDateWithin(pay.paymentDate, prevBounds)) {
        prevRevenue += pay.amount;
      }
    }
    for (const inv of invoices) {
      const invPayments = paymentsByInvoice.get(inv.id) || [];
      if (invPayments.length === 0 && inv.status === 'paid') {
        if (isDateWithin(inv.issueDate, prevBounds)) {
          prevRevenue += inv.total;
        }
      }
    }
  }
  prevRevenue = roundCurrency(prevRevenue);

  // 2. Calculate Expenses (Current & Previous period)
  let currentExpenses = 0;
  let totalExpensesCount = 0;
  for (const exp of expenses) {
    if (isDateWithin(exp.date, currentBounds)) {
      currentExpenses += exp.amount;
      totalExpensesCount++;
    }
  }
  currentExpenses = roundCurrency(currentExpenses);

  let prevExpenses = 0;
  if (prevBounds.startDate || prevBounds.endDate) {
    for (const exp of expenses) {
      if (isDateWithin(exp.date, prevBounds)) {
        prevExpenses += exp.amount;
      }
    }
  }
  prevExpenses = roundCurrency(prevExpenses);

  // 3. Profit & Margin
  const netProfit = roundCurrency(currentRevenue - currentExpenses);
  const profitMargin =
    currentRevenue > 0
      ? roundCurrency((netProfit / currentRevenue) * 100, 1)
      : 0;

  // MoM growth calculations
  let revenueMoMDiff = 0;
  if (prevRevenue > 0) {
    revenueMoMDiff = roundCurrency(((currentRevenue - prevRevenue) / prevRevenue) * 100, 1);
  } else if (currentRevenue > 0) {
    revenueMoMDiff = 100;
  }

  let expenseMoMDiff = 0;
  if (prevExpenses > 0) {
    expenseMoMDiff = roundCurrency(((currentExpenses - prevExpenses) / prevExpenses) * 100, 1);
  } else if (currentExpenses > 0) {
    expenseMoMDiff = 100;
  }

  // 4. Invoices Metrics (Outstanding, Overdue, Paid)
  let outstandingAmount = 0;
  let outstandingCount = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let paidInvoicesAmount = 0;
  let paidInvoicesCount = 0;
  let totalInvoicesCount = 0;

  const todayStr = format(refDate, 'yyyy-MM-dd');

  for (const inv of invoices) {
    // Check if invoice belongs to current filter period (based on issueDate)
    if (!isDateWithin(inv.issueDate, currentBounds)) {
      continue;
    }

    totalInvoicesCount++;
    const invPayments = paymentsByInvoice.get(inv.id) || [];
    const balanceInfo = calculatePaymentBalance(
      inv.total,
      invPayments,
      inv.dueDate,
      refDate
    );

    if (inv.status === 'cancelled') {
      continue;
    }

    if (balanceInfo.isFullyPaid || inv.status === 'paid') {
      paidInvoicesCount++;
      paidInvoicesAmount += inv.total;
    } else if (inv.status !== 'draft') {
      // Pending, partially_paid, or overdue
      outstandingCount++;
      outstandingAmount += balanceInfo.remainingBalance;

      // Overdue check: currentDate > dueDate
      if (balanceInfo.remainingBalance > 0 && inv.dueDate < todayStr) {
        overdueCount++;
        overdueAmount += balanceInfo.remainingBalance;
      }
    }
  }

  return {
    revenue: currentRevenue,
    expenses: currentExpenses,
    netProfit,
    profitMargin,
    outstandingAmount: roundCurrency(outstandingAmount),
    outstandingCount,
    overdueAmount: roundCurrency(overdueAmount),
    overdueCount,
    paidInvoicesAmount: roundCurrency(paidInvoicesAmount),
    paidInvoicesCount,
    totalInvoicesCount,
    totalExpensesCount,
    revenueMoMDiff,
    expenseMoMDiff,
  };
}

/**
 * Generates monthly trends for the last N months (default 6 months)
 */
export function generateMonthlyTrends(
  payments: Payment[],
  expenses: Expense[],
  invoices: Invoice[] = [],
  monthCount: number = 6,
  refDate: Date = new Date()
): MonthlyFinancialTrend[] {
  const trends: MonthlyFinancialTrend[] = [];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  // Map payments by invoice
  const paymentsByInvoice = new Map<string, Payment[]>();
  for (const pay of payments) {
    const list = paymentsByInvoice.get(pay.invoiceId) || [];
    list.push(pay);
    paymentsByInvoice.set(pay.invoiceId, list);
  }

  for (let i = monthCount - 1; i >= 0; i--) {
    const targetDate = subMonths(refDate, i);
    const monthKey = format(targetDate, 'yyyy-MM');
    const monthIndex = targetDate.getMonth();
    const yearStr = targetDate.getFullYear();
    const label = `${monthNames[monthIndex]} ${yearStr}`;

    const monthStart = format(startOfMonth(targetDate), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(targetDate), 'yyyy-MM-dd');

    // Revenue in this month
    let monthRev = 0;
    for (const pay of payments) {
      if (pay.paymentDate >= monthStart && pay.paymentDate <= monthEnd) {
        monthRev += pay.amount;
      }
    }
    // Fallback direct paid invoices
    for (const inv of invoices) {
      const invPays = paymentsByInvoice.get(inv.id) || [];
      if (invPays.length === 0 && inv.status === 'paid') {
        if (inv.issueDate >= monthStart && inv.issueDate <= monthEnd) {
          monthRev += inv.total;
        }
      }
    }

    // Expenses in this month
    let monthExp = 0;
    for (const exp of expenses) {
      if (exp.date >= monthStart && exp.date <= monthEnd) {
        monthExp += exp.amount;
      }
    }

    const roundedRev = roundCurrency(monthRev);
    const roundedExp = roundCurrency(monthExp);
    const netProfit = roundCurrency(roundedRev - roundedExp);

    trends.push({
      monthKey,
      label,
      revenue: roundedRev,
      expenses: roundedExp,
      netProfit,
    });
  }

  return trends;
}

/**
 * Calculates category breakdown share for dashboard
 */
export function calculateDashboardCategoryBreakdown(
  expenses: Expense[],
  categories: ExpenseCategory[],
  filter: DashboardFilter,
  refDate: Date = new Date()
): ExpenseCategoryShare[] {
  const bounds = getDashboardDateBounds(
    filter.dateRange,
    filter.startDate,
    filter.endDate,
    refDate
  );

  const filteredExpenses = expenses.filter((e) => {
    if (bounds.startDate && e.date < bounds.startDate) return false;
    if (bounds.endDate && e.date > bounds.endDate) return false;
    return true;
  });

  const catMap = new Map<string, string>();
  categories.forEach((c) => catMap.set(c.id, c.name));

  const totalExp = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const grouping = new Map<string, number>();

  for (const exp of filteredExpenses) {
    const current = grouping.get(exp.categoryId) || 0;
    grouping.set(exp.categoryId, current + exp.amount);
  }

  const result: ExpenseCategoryShare[] = [];
  for (const [catId, amount] of grouping.entries()) {
    const name = catMap.get(catId) || 'Lain-lain';
    const percentage = totalExp > 0 ? roundCurrency((amount / totalExp) * 100, 1) : 0;
    result.push({
      categoryId: catId,
      name,
      amount: roundCurrency(amount),
      percentage,
    });
  }

  // Sort descending by amount
  return result.sort((a, b) => b.amount - a.amount).slice(0, 5);
}
