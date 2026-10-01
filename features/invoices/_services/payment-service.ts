import { paymentRepository } from '@/infrastructure/database/repositories/payment-repository';
import { invoiceRepository } from '@/infrastructure/database/repositories/invoice-repository';
import { Payment, InvoiceStatus } from '@/infrastructure/database/schema';
import { PaymentFormData, paymentSchema } from '../_schemas/payment.schemas';
import { InvoiceDomainService } from './invoice-domain-service';
import { calculatePaymentBalance } from '../_utils/invoice-calculations';
import { InvoicePaymentSummaryWithHistory } from '../_types/payment.types';

export class PaymentService {
  /**
   * Records a payment against an invoice and automatically recalculates
   * the invoice's lifecycle status (paid, partially_paid, overdue, etc.).
   */
  static async recordPayment(formData: PaymentFormData): Promise<{
    payment: Payment;
    newStatus: InvoiceStatus;
  }> {
    const validated = paymentSchema.parse(formData);

    const invoice = await invoiceRepository.getById(validated.invoiceId);
    if (!invoice) {
      throw new Error('Faktur tidak ditemukan untuk pencatatan pembayaran.');
    }

    if (invoice.status === 'cancelled') {
      throw new Error('Tidak dapat mencatat pembayaran pada faktur yang telah dibatalkan.');
    }

    const now = new Date().toISOString();
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const payment: Payment = {
      id: paymentId,
      invoiceId: validated.invoiceId,
      amount: validated.amount,
      paymentDate: validated.paymentDate,
      paymentMethod: validated.paymentMethod,
      notes: validated.notes?.trim() || undefined,
      createdAt: now,
    };

    // 1. Save payment record
    await paymentRepository.create(payment);

    // 2. Automatically update invoice status
    const newStatus = await InvoiceDomainService.refreshStatus(validated.invoiceId);

    return { payment, newStatus };
  }

  /**
   * Deletes a payment record and automatically recalculates and rolls back
   * the invoice's lifecycle status if required.
   */
  static async deletePayment(paymentId: string): Promise<{
    invoiceId: string;
    newStatus: InvoiceStatus;
  }> {
    const payment = await paymentRepository.getById(paymentId);
    if (!payment) {
      throw new Error('Catatan pembayaran tidak ditemukan.');
    }

    const invoiceId = payment.invoiceId;

    // 1. Delete payment record
    await paymentRepository.delete(paymentId);

    // 2. Automatically refresh invoice status
    const newStatus = await InvoiceDomainService.refreshStatus(invoiceId);

    return { invoiceId, newStatus };
  }

  /**
   * Retrieves all payments recorded for a given invoice sorted newest first.
   */
  static async getByInvoiceId(invoiceId: string): Promise<Payment[]> {
    const payments = await paymentRepository.getByInvoiceId(invoiceId);
    return payments.sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );
  }

  /**
   * Computes full payment summary including history, total paid, and remaining balance.
   */
  static async getSummary(invoiceId: string): Promise<InvoicePaymentSummaryWithHistory | null> {
    const invoice = await invoiceRepository.getById(invoiceId);
    if (!invoice) return null;

    const payments = await this.getByInvoiceId(invoiceId);
    const balance = calculatePaymentBalance(
      invoice.total,
      payments,
      invoice.dueDate
    );

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      total: invoice.total,
      totalPaid: balance.totalPaid,
      remainingBalance: balance.remainingBalance,
      isFullyPaid: balance.isFullyPaid,
      isPartiallyPaid: balance.isPartiallyPaid,
      isOverdue: balance.isOverdue,
      payments,
    };
  }
}
