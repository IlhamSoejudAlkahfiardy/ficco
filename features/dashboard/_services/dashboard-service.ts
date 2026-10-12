import {
  invoiceRepository,
  InvoiceRepository,
} from '@/infrastructure/database/repositories/invoice-repository';
import {
  paymentRepository,
  PaymentRepository,
} from '@/infrastructure/database/repositories/payment-repository';
import {
  expenseRepository,
  ExpenseRepository,
} from '@/infrastructure/database/repositories/expense-repository';
import {
  customerRepository,
  CustomerRepository,
} from '@/infrastructure/database/repositories/customer-repository';
import {
  expenseCategoryRepository,
  ExpenseCategoryRepository,
} from '@/infrastructure/database/repositories/expense-category-repository';
import {
  DashboardFilter,
  DashboardData,
  RecentInvoiceItem,
  RecentExpenseItem,
} from '../_types/dashboard.types';
import {
  calculateDashboardMetrics,
  generateMonthlyTrends,
  calculateDashboardCategoryBreakdown,
} from '../_utils/dashboard-calculations';
import { calculatePaymentBalance } from '@/features/invoices/_utils/invoice-calculations';

export class DashboardDomainService {
  constructor(
    private readonly invoiceRepo: InvoiceRepository = invoiceRepository,
    private readonly paymentRepo: PaymentRepository = paymentRepository,
    private readonly expenseRepo: ExpenseRepository = expenseRepository,
    private readonly customerRepo: CustomerRepository = customerRepository,
    private readonly categoryRepo: ExpenseCategoryRepository = expenseCategoryRepository
  ) {}

  /**
   * Derives all dashboard statistics and historical trends directly from local IndexedDB
   * Conforms to Step 15 acceptance criteria: 100% offline, zero server request.
   */
  async getDashboardData(
    filter: DashboardFilter,
    refDate: Date = new Date()
  ): Promise<DashboardData> {
    const [invoices, payments, expenses, customers, categories] = await Promise.all([
      this.invoiceRepo.getAll(),
      this.paymentRepo.getAll(),
      this.expenseRepo.getAll(),
      this.customerRepo.getAll(),
      this.categoryRepo.getAll(),
    ]);

    // Fast lookup maps
    const customerMap = new Map<string, string>();
    customers.forEach((c) => customerMap.set(c.id, c.name));

    const categoryMap = new Map<string, string>();
    categories.forEach((c) => categoryMap.set(c.id, c.name));

    const paymentsByInvoice = new Map<string, typeof payments>();
    for (const pay of payments) {
      const list = paymentsByInvoice.get(pay.invoiceId) || [];
      list.push(pay);
      paymentsByInvoice.set(pay.invoiceId, list);
    }

    // 1. Calculate executive financial metrics
    const metrics = calculateDashboardMetrics(
      invoices,
      payments,
      expenses,
      filter,
      refDate
    );

    // 2. Generate monthly historical trend (6 months)
    const monthlyTrend = generateMonthlyTrends(
      payments,
      expenses,
      invoices,
      6,
      refDate
    );

    // 3. Category breakdown
    const categoryBreakdown = calculateDashboardCategoryBreakdown(
      expenses,
      categories,
      filter,
      refDate
    );

    // 4. Recent Invoices (latest 5)
    const sortedInvoices = [...invoices].sort((a, b) => {
      if (a.issueDate !== b.issueDate) {
        return b.issueDate.localeCompare(a.issueDate);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });

    const recentInvoices: RecentInvoiceItem[] = sortedInvoices.slice(0, 5).map((inv) => {
      const invPayments = paymentsByInvoice.get(inv.id) || [];
      const balance = calculatePaymentBalance(inv.total, invPayments, inv.dueDate, refDate);
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId,
        customerName: customerMap.get(inv.customerId) || 'Pelanggan',
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        status: inv.status,
        total: inv.total,
        totalPaid: balance.totalPaid,
        remainingBalance: balance.remainingBalance,
      };
    });

    // 5. Recent Expenses (latest 5)
    const sortedExpenses = [...expenses].sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.createdAt.localeCompare(a.createdAt);
    });

    const recentExpenses: RecentExpenseItem[] = sortedExpenses.slice(0, 5).map((exp) => ({
      id: exp.id,
      description: exp.description,
      categoryId: exp.categoryId,
      categoryName: categoryMap.get(exp.categoryId) || 'Operasional',
      date: exp.date,
      amount: exp.amount,
      paymentMethod: exp.paymentMethod,
      notes: exp.notes,
    }));

    return {
      metrics,
      monthlyTrend,
      recentInvoices,
      recentExpenses,
      categoryBreakdown,
    };
  }
}

export const dashboardDomainService = new DashboardDomainService();
