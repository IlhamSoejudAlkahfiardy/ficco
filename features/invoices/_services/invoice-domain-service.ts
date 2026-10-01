import { invoiceRepository } from '@/infrastructure/database/repositories/invoice-repository';
import { settingsRepository } from '@/infrastructure/database/repositories/settings-repository';
import { paymentRepository } from '@/infrastructure/database/repositories/payment-repository';
import { customerRepository } from '@/infrastructure/database/repositories/customer-repository';
import { db } from '@/infrastructure/database/db';
import { Customer, Invoice, InvoiceItem, InvoiceStatus, Payment } from '@/infrastructure/database/schema';
import {
  InvoiceCalculationInput,
  InvoiceCalculationResult,
  InvoicePaymentSummary,
} from '../_types/invoice.types';
import { InvoiceFormData, invoiceSchema } from '../_schemas/invoice.schemas';
import {
  calculateInvoiceTotals,
  calculateInvoiceStatus,
  calculatePaymentBalance,
} from '../_utils/invoice-calculations';
import {
  generateNextInvoiceNumber,
  parseInvoiceNumber,
} from '../_utils/invoice-number-generator';

export interface InvoiceFullDetails {
  invoice: Invoice;
  items: InvoiceItem[];
  customer?: Customer;
  calculation: InvoiceCalculationResult;
  paymentSummary: InvoicePaymentSummary;
  payments: Payment[];
}

export class InvoiceDomainService {
  /**
   * Generates the next sequential invoice number based on user defaults
   * and existing invoices in IndexedDB to prevent sequence collisions.
   */
  static async getNextInvoiceNumber(prefixOverride?: string): Promise<string> {
    const existingInvoices = await invoiceRepository.getAll();
    const existingNumbers = existingInvoices.map((inv) => inv.invoiceNumber);

    // Retrieve default settings if available
    const defaults = await settingsRepository.get<{
      prefix?: string;
      nextNumber?: number;
    }>('invoice_defaults');

    const prefix = prefixOverride || defaults?.prefix || 'INV';
    const fallbackSeq = defaults?.nextNumber || 1;

    return generateNextInvoiceNumber(existingNumbers, prefix, fallbackSeq);
  }

  /**
   * Central calculation entry point for creating or previewing invoices.
   */
  static calculateTotals(input: InvoiceCalculationInput): InvoiceCalculationResult {
    return calculateInvoiceTotals(input);
  }

  /**
   * Retrieves full invoice details including line items, customer info,
   * calculated totals, and current payment status.
   */
  static async getFullDetails(id: string): Promise<InvoiceFullDetails | null> {
    const result = await invoiceRepository.getWithItems(id);
    if (!result) return null;

    const { invoice, items } = result;

    // Fetch customer details if available
    const customer = invoice.customerId
      ? await customerRepository.getById(invoice.customerId)
      : undefined;

    // Fetch payments for this invoice
    const payments = await paymentRepository.getByInvoiceId(id);

    // Re-verify calculations
    const calculation = calculateInvoiceTotals({
      items,
      invoiceDiscount: invoice.discount,
      invoiceTaxRate: 0, // line item taxes are already preserved in items
    });

    // Payment metrics
    const paymentSummary = calculatePaymentBalance(
      invoice.total,
      payments,
      invoice.dueDate
    );

    const sortedPayments = payments.sort(
      (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
    );

    return {
      invoice,
      items,
      customer,
      calculation,
      paymentSummary,
      payments: sortedPayments,
    };
  }

  /**
   * Recalculates and updates the invoice status based on current date and payments.
   */
  static async refreshStatus(id: string): Promise<InvoiceStatus> {
    const invoice = await invoiceRepository.getById(id);
    if (!invoice) throw new Error('Faktur tidak ditemukan.');

    if (invoice.status === 'cancelled') {
      return 'cancelled';
    }

    const payments = await paymentRepository.getByInvoiceId(id);
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const newStatus = calculateInvoiceStatus({
      status: invoice.status,
      dueDate: invoice.dueDate,
      total: invoice.total,
      totalPaid,
    });

    if (newStatus !== invoice.status) {
      await invoiceRepository.update(id, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    }

    return newStatus;
  }

  /**
   * Transactionally saves a new invoice and all its line items into IndexedDB.
   */
  static async createInvoice(formData: InvoiceFormData): Promise<{
    invoice: Invoice;
    items: InvoiceItem[];
  }> {
    const validated = invoiceSchema.parse(formData);
    const now = new Date().toISOString();
    const invoiceId = validated.id || `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Central domain calculation
    const calc = calculateInvoiceTotals({
      items: validated.items,
      invoiceDiscount: validated.discount,
      invoiceTaxRate: 0,
    });

    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber: validated.invoiceNumber.trim().toUpperCase(),
      customerId: validated.customerId,
      issueDate: validated.issueDate,
      dueDate: validated.dueDate,
      status: validated.status || 'draft',
      notes: validated.notes?.trim() || undefined,
      subtotal: calc.subtotal,
      discount: calc.totalDiscount,
      tax: calc.totalTax,
      total: calc.grandTotal,
      createdAt: now,
      updatedAt: now,
    };

    const items: InvoiceItem[] = calc.lineItems.map((item, index) => ({
      id: item.id || `item_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
      invoiceId,
      productId: item.productId || undefined,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      subtotal: item.subtotal,
      total: item.total,
    }));

    // Transactional save to Dexie
    await invoiceRepository.saveWithItems(invoice, items);

    // Increment nextNumber in settings if standard format
    try {
      const parsed = parseInvoiceNumber(invoice.invoiceNumber);
      if (parsed) {
        const defaults = await settingsRepository.get<any>('invoice_defaults');
        if (defaults && defaults.nextNumber <= parsed.sequence) {
          await settingsRepository.set('invoice_defaults', {
            ...defaults,
            nextNumber: parsed.sequence + 1,
          });
        }
      }
    } catch {
      // Non-critical background setting increment failure
    }

    return { invoice, items };
  }

  /**
   * Transactionally updates an existing invoice and its line items.
   */
  static async updateInvoice(
    id: string,
    formData: InvoiceFormData
  ): Promise<{
    invoice: Invoice;
    items: InvoiceItem[];
  }> {
    const existing = await invoiceRepository.getById(id);
    if (!existing) throw new Error('Faktur tidak ditemukan untuk diperbarui.');

    const validated = invoiceSchema.parse(formData);
    const now = new Date().toISOString();

    const calc = calculateInvoiceTotals({
      items: validated.items,
      invoiceDiscount: validated.discount,
      invoiceTaxRate: 0,
    });

    const invoice: Invoice = {
      id,
      invoiceNumber: validated.invoiceNumber.trim().toUpperCase(),
      customerId: validated.customerId,
      issueDate: validated.issueDate,
      dueDate: validated.dueDate,
      status: validated.status || existing.status,
      notes: validated.notes?.trim() || undefined,
      subtotal: calc.subtotal,
      discount: calc.totalDiscount,
      tax: calc.totalTax,
      total: calc.grandTotal,
      createdAt: existing.createdAt,
      updatedAt: now,
    };

    const items: InvoiceItem[] = calc.lineItems.map((item, index) => ({
      id: item.id || `item_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
      invoiceId: id,
      productId: item.productId || undefined,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate,
      subtotal: item.subtotal,
      total: item.total,
    }));

    await invoiceRepository.saveWithItems(invoice, items);
    return { invoice, items };
  }

  /**
   * Cancels an invoice.
   */
  static async cancelInvoice(id: string): Promise<void> {
    const invoice = await invoiceRepository.getById(id);
    if (!invoice) throw new Error('Faktur tidak ditemukan.');

    await invoiceRepository.update(id, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Manually changes an invoice status (e.g. from draft to sent).
   */
  static async updateStatus(id: string, status: InvoiceStatus): Promise<void> {
    const invoice = await invoiceRepository.getById(id);
    if (!invoice) throw new Error('Faktur tidak ditemukan.');

    await invoiceRepository.update(id, {
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Deletes an invoice and all related line items and payments.
   */
  static async deleteInvoice(id: string): Promise<void> {
    await invoiceRepository.deleteWithItems(id);
  }
}
