import {
  Invoice,
  InvoiceItem,
  Payment,
  Expense,
  ExpenseCategory,
  Customer,
} from '@/infrastructure/database/schema';
import {
  ReportFilter,
  ProfitLossSummary,
  PeriodicFinancialRow,
  CustomerRevenueRow,
  ProductRevenueRow,
  CategoryExpenseRow,
  PaymentMethodExpenseRow,
} from '../_types/reports.types';

const MONTH_NAMES_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

function formatDateISO(d: Date): string {
  return `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
}

export function getReportDateBounds(
  filter: ReportFilter,
  referenceDate: Date = new Date()
): { startDate: string; endDate: string } {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  switch (filter.preset) {
    case 'this_month': {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return { startDate: formatDateISO(start), endDate: formatDateISO(end) };
    }
    case 'last_month': {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return { startDate: formatDateISO(start), endDate: formatDateISO(end) };
    }
    case 'this_quarter': {
      const quarterIndex = Math.floor(month / 3);
      const start = new Date(year, quarterIndex * 3, 1);
      const end = new Date(year, quarterIndex * 3 + 3, 0);
      return { startDate: formatDateISO(start), endDate: formatDateISO(end) };
    }
    case 'this_year': {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      return { startDate: formatDateISO(start), endDate: formatDateISO(end) };
    }
    case 'all': {
      return { startDate: '1970-01-01', endDate: '2099-12-31' };
    }
    case 'custom': {
      const start = filter.startDate || `${year}-01-01`;
      const end = filter.endDate || formatDateISO(referenceDate);
      return { startDate: start, endDate: end };
    }
    default: {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      return { startDate: formatDateISO(start), endDate: formatDateISO(end) };
    }
  }
}

export function getPreviousReportBounds(
  startDate: string,
  endDate: string
): { prevStartDate: string; prevEndDate: string } {
  const currentStart = new Date(startDate);
  const currentEnd = new Date(endDate);

  const durationMs = currentEnd.getTime() - currentStart.getTime();
  const prevEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return {
    prevStartDate: formatDateISO(prevStart),
    prevEndDate: formatDateISO(prevEnd),
  };
}

export function calculateProfitLossSummary(
  currentRevenue: number,
  currentExpenses: number,
  previousRevenue: number,
  previousExpenses: number
): ProfitLossSummary {
  const netProfit = currentRevenue - currentExpenses;
  const previousNetProfit = previousRevenue - previousExpenses;

  const profitMargin =
    currentRevenue > 0
      ? Number(((netProfit / currentRevenue) * 100).toFixed(1))
      : 0;

  const calcGrowth = (curr: number, prev: number): number => {
    if (prev > 0) {
      return Number((((curr - prev) / prev) * 100).toFixed(1));
    }
    if (curr > 0) return 100;
    return 0;
  };

  return {
    revenue: currentRevenue,
    expenses: currentExpenses,
    netProfit,
    profitMargin,
    revenueGrowth: calcGrowth(currentRevenue, previousRevenue),
    expenseGrowth: calcGrowth(currentExpenses, previousExpenses),
    netProfitGrowth: calcGrowth(netProfit, previousNetProfit),
    previousRevenue,
    previousExpenses,
    previousNetProfit,
  };
}

export function generatePeriodicFinancialRows(
  invoices: Invoice[],
  payments: Payment[],
  expenses: Expense[],
  startDate: string,
  endDate: string
): PeriodicFinancialRow[] {
  const periodsMap = new Map<
    string,
    {
      revenue: number;
      expenses: number;
      invoicesCount: number;
      expensesCount: number;
    }
  >();

  // Helper to ensure period bucket exists
  const getPeriodEntry = (periodKey: string) => {
    let entry = periodsMap.get(periodKey);
    if (!entry) {
      entry = { revenue: 0, expenses: 0, invoicesCount: 0, expensesCount: 0 };
      periodsMap.set(periodKey, entry);
    }
    return entry;
  };

  // Determine all calendar months between startDate and endDate
  const [startYear, startMonth] = startDate.split('-').map(Number);
  const [endYear, endMonth] = endDate.split('-').map(Number);

  if (startYear && endYear && !isNaN(startYear) && !isNaN(endYear)) {
    let currY = startYear;
    let currM = startMonth;

    // Safety guard max 60 months
    let guard = 0;
    while ((currY < endYear || (currY === endYear && currM <= endMonth)) && guard < 60) {
      const pKey = `${currY}-${padZero(currM)}`;
      getPeriodEntry(pKey);
      currM++;
      if (currM > 12) {
        currM = 1;
        currY++;
      }
      guard++;
    }
  }

  // 1. Accumulate Revenue from Payments in range
  payments.forEach((p) => {
    const payDate = p.paymentDate || p.createdAt?.slice(0, 10);
    if (payDate && payDate >= startDate && payDate <= endDate) {
      const pKey = payDate.slice(0, 7);
      const entry = getPeriodEntry(pKey);
      entry.revenue += p.amount;
    }
  });

  // Track invoices count in period
  invoices.forEach((inv) => {
    const invDate = inv.issueDate || inv.createdAt?.slice(0, 10);
    if (invDate && invDate >= startDate && invDate <= endDate) {
      const pKey = invDate.slice(0, 7);
      const entry = getPeriodEntry(pKey);
      entry.invoicesCount++;

      // If no payments recorded for a paid invoice, count towards revenue
      if (inv.status === 'paid') {
        const hasPayment = payments.some((pm) => pm.invoiceId === inv.id);
        if (!hasPayment) {
          entry.revenue += inv.total;
        }
      }
    }
  });

  // 2. Accumulate Expenses in range
  expenses.forEach((exp) => {
    const expDate = exp.date || exp.createdAt?.slice(0, 10);
    if (expDate && expDate >= startDate && expDate <= endDate) {
      const pKey = expDate.slice(0, 7);
      const entry = getPeriodEntry(pKey);
      entry.expenses += exp.amount;
      entry.expensesCount++;
    }
  });

  // Convert to sorted rows
  const sortedKeys = Array.from(periodsMap.keys()).sort();
  return sortedKeys.map((key) => {
    const data = periodsMap.get(key)!;
    const [y, m] = key.split('-').map(Number);
    const mName = MONTH_NAMES_ID[m - 1] || `${m}`;
    const label = `${mName} ${y}`;
    const netProfit = data.revenue - data.expenses;
    const profitMargin =
      data.revenue > 0 ? Number(((netProfit / data.revenue) * 100).toFixed(1)) : 0;

    return {
      periodKey: key,
      periodLabel: label,
      revenue: data.revenue,
      expenses: data.expenses,
      netProfit,
      profitMargin,
      invoicesCount: data.invoicesCount,
      expensesCount: data.expensesCount,
    };
  });
}

export function calculateCustomerRevenue(
  invoices: Invoice[],
  payments: Payment[],
  customers: Customer[],
  startDate: string,
  endDate: string
): CustomerRevenueRow[] {
  const customerMap = new Map<string, Customer>();
  customers.forEach((c) => customerMap.set(c.id, c));

  const map = new Map<
    string,
    {
      invoicesCount: number;
      paidInvoicesCount: number;
      totalRevenue: number;
    }
  >();

  // Sum payments by customer
  payments.forEach((p) => {
    const payDate = p.paymentDate || p.createdAt?.slice(0, 10);
    if (payDate && payDate >= startDate && payDate <= endDate) {
      const inv = invoices.find((i) => i.id === p.invoiceId);
      const custId = inv ? inv.customerId : 'unknown';
      let entry = map.get(custId);
      if (!entry) {
        entry = { invoicesCount: 0, paidInvoicesCount: 0, totalRevenue: 0 };
        map.set(custId, entry);
      }
      entry.totalRevenue += p.amount;
    }
  });

  // Track customer invoice counts and fallback paid invoices
  invoices.forEach((inv) => {
    const invDate = inv.issueDate || inv.createdAt?.slice(0, 10);
    if (invDate && invDate >= startDate && invDate <= endDate) {
      let entry = map.get(inv.customerId);
      if (!entry) {
        entry = { invoicesCount: 0, paidInvoicesCount: 0, totalRevenue: 0 };
        map.set(inv.customerId, entry);
      }
      entry.invoicesCount++;
      if (inv.status === 'paid') {
        entry.paidInvoicesCount++;
        const hasPayment = payments.some((pm) => pm.invoiceId === inv.id);
        if (!hasPayment) {
          entry.totalRevenue += inv.total;
        }
      }
    }
  });

  // Calculate total overall revenue for percentage
  let grandTotal = 0;
  map.forEach((item) => {
    grandTotal += item.totalRevenue;
  });

  const result: CustomerRevenueRow[] = [];
  map.forEach((entry, custId) => {
    const cust = customerMap.get(custId);
    const name = cust?.name || (custId === 'unknown' ? 'Lainnya / Dihapus' : 'Pelanggan Dihapus');
    const percentage =
      grandTotal > 0 ? Number(((entry.totalRevenue / grandTotal) * 100).toFixed(1)) : 0;

    result.push({
      customerId: custId,
      customerName: name,
      invoicesCount: entry.invoicesCount,
      paidInvoicesCount: entry.paidInvoicesCount,
      totalRevenue: entry.totalRevenue,
      percentage,
    });
  });

  return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function calculateProductRevenue(
  invoices: Invoice[],
  invoiceItems: InvoiceItem[],
  startDate: string,
  endDate: string
): ProductRevenueRow[] {
  // Find invoices within range that are not cancelled or draft
  const validInvoices = invoices.filter((inv) => {
    const invDate = inv.issueDate || inv.createdAt?.slice(0, 10);
    return (
      invDate &&
      invDate >= startDate &&
      invDate <= endDate &&
      inv.status !== 'cancelled' &&
      inv.status !== 'draft'
    );
  });

  const validInvoiceIds = new Set(validInvoices.map((inv) => inv.id));

  const productMap = new Map<
    string,
    {
      productId?: string;
      productName: string;
      quantity: number;
      totalRevenue: number;
    }
  >();

  invoiceItems.forEach((item) => {
    if (validInvoiceIds.has(item.invoiceId)) {
      const key = item.productId || item.description || 'Lainnya';
      let entry = productMap.get(key);
      if (!entry) {
        entry = {
          productId: item.productId,
          productName: item.description || 'Produk / Layanan',
          quantity: 0,
          totalRevenue: 0,
        };
        productMap.set(key, entry);
      }
      entry.quantity += item.quantity || 1;
      entry.totalRevenue += item.total || 0;
    }
  });

  let grandTotal = 0;
  productMap.forEach((p) => {
    grandTotal += p.totalRevenue;
  });

  const result: ProductRevenueRow[] = [];
  productMap.forEach((entry) => {
    const percentage =
      grandTotal > 0 ? Number(((entry.totalRevenue / grandTotal) * 100).toFixed(1)) : 0;

    result.push({
      productId: entry.productId,
      productName: entry.productName,
      quantity: entry.quantity,
      totalRevenue: entry.totalRevenue,
      percentage,
    });
  });

  return result.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export function calculateCategoryExpenses(
  expenses: Expense[],
  categories: ExpenseCategory[],
  startDate: string,
  endDate: string
): CategoryExpenseRow[] {
  const categoryMap = new Map<string, string>();
  categories.forEach((cat) => categoryMap.set(cat.id, cat.name));

  const filteredExpenses = expenses.filter((e) => {
    const expDate = e.date || e.createdAt?.slice(0, 10);
    return expDate && expDate >= startDate && expDate <= endDate;
  });

  const map = new Map<
    string,
    {
      transactionCount: number;
      totalAmount: number;
    }
  >();

  let grandTotal = 0;

  filteredExpenses.forEach((exp) => {
    grandTotal += exp.amount;
    let entry = map.get(exp.categoryId);
    if (!entry) {
      entry = { transactionCount: 0, totalAmount: 0 };
      map.set(exp.categoryId, entry);
    }
    entry.transactionCount++;
    entry.totalAmount += exp.amount;
  });

  const result: CategoryExpenseRow[] = [];
  map.forEach((entry, catId) => {
    const name = categoryMap.get(catId) || 'Umum';
    const percentage =
      grandTotal > 0 ? Number(((entry.totalAmount / grandTotal) * 100).toFixed(1)) : 0;

    result.push({
      categoryId: catId,
      categoryName: name,
      transactionCount: entry.transactionCount,
      totalAmount: entry.totalAmount,
      percentage,
    });
  });

  return result.sort((a, b) => b.totalAmount - a.totalAmount);
}

export function calculatePaymentMethodExpenses(
  expenses: Expense[],
  startDate: string,
  endDate: string
): PaymentMethodExpenseRow[] {
  const filtered = expenses.filter((e) => {
    const expDate = e.date || e.createdAt?.slice(0, 10);
    return expDate && expDate >= startDate && expDate <= endDate;
  });

  const methodLabels: Record<string, string> = {
    bank_transfer: 'Transfer Bank',
    cash: 'Tunai',
    e_wallet: 'E-Wallet',
    credit_card: 'Kartu Kredit',
    qris: 'QRIS',
    other: 'Lainnya',
  };

  const map = new Map<string, { count: number; totalAmount: number }>();
  let grandTotal = 0;

  filtered.forEach((exp) => {
    grandTotal += exp.amount;
    const method = exp.paymentMethod || 'other';
    let entry = map.get(method);
    if (!entry) {
      entry = { count: 0, totalAmount: 0 };
      map.set(method, entry);
    }
    entry.count++;
    entry.totalAmount += exp.amount;
  });

  const result: PaymentMethodExpenseRow[] = [];
  map.forEach((entry, method) => {
    const label = methodLabels[method] || method;
    const percentage =
      grandTotal > 0 ? Number(((entry.totalAmount / grandTotal) * 100).toFixed(1)) : 0;

    result.push({
      method,
      methodLabel: label,
      count: entry.count,
      totalAmount: entry.totalAmount,
      percentage,
    });
  });

  return result.sort((a, b) => b.totalAmount - a.totalAmount);
}
