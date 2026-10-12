import { invoiceRepository } from '@/infrastructure/database/repositories/invoice-repository';
import { paymentRepository } from '@/infrastructure/database/repositories/payment-repository';
import { expenseRepository } from '@/infrastructure/database/repositories/expense-repository';
import { customerRepository } from '@/infrastructure/database/repositories/customer-repository';
import { expenseCategoryRepository } from '@/infrastructure/database/repositories/expense-category-repository';
import { db } from '@/infrastructure/database/db';
import {
  ReportFilter,
  ReportsData,
  RevenueReportData,
  ExpenseReportData,
} from '../_types/reports.types';
import {
  getReportDateBounds,
  getPreviousReportBounds,
  calculateProfitLossSummary,
  generatePeriodicFinancialRows,
  calculateCustomerRevenue,
  calculateProductRevenue,
  calculateCategoryExpenses,
  calculatePaymentMethodExpenses,
} from '../_utils/reports-calculations';

export class ReportsDomainService {
  async getReportsData(filter: ReportFilter): Promise<ReportsData> {
    const { startDate, endDate } = getReportDateBounds(filter);
    const { prevStartDate, prevEndDate } = getPreviousReportBounds(startDate, endDate);

    // Fetch all needed records in parallel from IndexedDB via repositories
    const [
      allInvoices,
      allPayments,
      allExpenses,
      allCustomers,
      allCategories,
      allInvoiceItems,
    ] = await Promise.all([
      invoiceRepository.getAll(),
      paymentRepository.getAll(),
      expenseRepository.getAll(),
      customerRepository.getAll(),
      expenseCategoryRepository.getAll(),
      db.invoiceItems.toArray(),
    ]);

    // 1. Current Period Financials
    let currentRevenue = 0;
    allPayments.forEach((p) => {
      const pDate = p.paymentDate || p.createdAt?.slice(0, 10);
      if (pDate && pDate >= startDate && pDate <= endDate) {
        currentRevenue += p.amount;
      }
    });

    let totalInvoiced = 0;
    let paidInvoicesCount = 0;
    let totalInvoicesCount = 0;

    allInvoices.forEach((inv) => {
      const invDate = inv.issueDate || inv.createdAt?.slice(0, 10);
      if (invDate && invDate >= startDate && invDate <= endDate) {
        totalInvoiced += inv.total;
        totalInvoicesCount++;
        if (inv.status === 'paid') {
          paidInvoicesCount++;
          // Fallback if no payment records exist
          const hasPayment = allPayments.some((pm) => pm.invoiceId === inv.id);
          if (!hasPayment) {
            currentRevenue += inv.total;
          }
        }
      }
    });

    let currentExpenses = 0;
    let totalExpenseTransactions = 0;
    allExpenses.forEach((exp) => {
      const eDate = exp.date || exp.createdAt?.slice(0, 10);
      if (eDate && eDate >= startDate && eDate <= endDate) {
        currentExpenses += exp.amount;
        totalExpenseTransactions++;
      }
    });

    // 2. Previous Period Financials (for MoM / Growth)
    let previousRevenue = 0;
    allPayments.forEach((p) => {
      const pDate = p.paymentDate || p.createdAt?.slice(0, 10);
      if (pDate && pDate >= prevStartDate && pDate <= prevEndDate) {
        previousRevenue += p.amount;
      }
    });
    allInvoices.forEach((inv) => {
      const invDate = inv.issueDate || inv.createdAt?.slice(0, 10);
      if (invDate && invDate >= prevStartDate && invDate <= prevEndDate && inv.status === 'paid') {
        const hasPayment = allPayments.some((pm) => pm.invoiceId === inv.id);
        if (!hasPayment) {
          previousRevenue += inv.total;
        }
      }
    });

    let previousExpenses = 0;
    allExpenses.forEach((exp) => {
      const eDate = exp.date || exp.createdAt?.slice(0, 10);
      if (eDate && eDate >= prevStartDate && eDate <= prevEndDate) {
        previousExpenses += exp.amount;
      }
    });

    // 3. Summaries & Detailed Breakdowns
    const profitLoss = calculateProfitLossSummary(
      currentRevenue,
      currentExpenses,
      previousRevenue,
      previousExpenses
    );

    const periodicRows = generatePeriodicFinancialRows(
      allInvoices,
      allPayments,
      allExpenses,
      startDate,
      endDate
    );

    const byCustomer = calculateCustomerRevenue(
      allInvoices,
      allPayments,
      allCustomers,
      startDate,
      endDate
    );

    const byProduct = calculateProductRevenue(
      allInvoices,
      allInvoiceItems,
      startDate,
      endDate
    );

    const byCategory = calculateCategoryExpenses(
      allExpenses,
      allCategories,
      startDate,
      endDate
    );

    const byPaymentMethod = calculatePaymentMethodExpenses(
      allExpenses,
      startDate,
      endDate
    );

    const collectionRate =
      totalInvoiced > 0
        ? Number(((currentRevenue / totalInvoiced) * 100).toFixed(1))
        : 100;

    const averageInvoiceValue =
      totalInvoicesCount > 0 ? Math.round(totalInvoiced / totalInvoicesCount) : 0;

    const averageExpense =
      totalExpenseTransactions > 0
        ? Math.round(currentExpenses / totalExpenseTransactions)
        : 0;

    const revenue: RevenueReportData = {
      totalRevenue: currentRevenue,
      totalInvoiced,
      collectionRate,
      invoicesPaidCount: paidInvoicesCount,
      totalInvoicesCount,
      averageInvoiceValue,
      byCustomer,
      byProduct,
      periodicTrend: periodicRows,
    };

    const expenses: ExpenseReportData = {
      totalExpenses: currentExpenses,
      totalTransactions: totalExpenseTransactions,
      averageExpense,
      byCategory,
      byPaymentMethod,
      periodicTrend: periodicRows,
    };

    return {
      filter,
      startDate,
      endDate,
      profitLoss,
      periodicRows,
      revenue,
      expenses,
    };
  }
}

export const reportsDomainService = new ReportsDomainService();
