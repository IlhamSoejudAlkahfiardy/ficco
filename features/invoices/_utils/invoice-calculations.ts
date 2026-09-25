import {
  CalculatedInvoiceItem,
  InvoiceCalculationInput,
  InvoiceCalculationResult,
  InvoicePaymentSummary,
  InvoiceStatus,
  InvoiceStatusParams,
} from '../_types/invoice.types';

/**
 * Rounds a numeric currency value to avoid floating-point imprecision.
 */
export function roundCurrency(amount: number, decimals: number = 2): number {
  if (isNaN(amount) || !isFinite(amount)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
}

/**
 * Calculates financial figures for a single invoice line item.
 *
 * Rules:
 * - itemSubtotal = quantity * unitPrice
 * - discountAmount = min(itemSubtotal, discount)
 * - afterDiscount = itemSubtotal - discountAmount
 * - taxAmount = afterDiscount * (taxRate / 100)
 * - total = afterDiscount + taxAmount
 */
export function calculateLineItem(item: {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}): CalculatedInvoiceItem {
  const qty = Math.max(0, item.quantity || 0);
  const price = Math.max(0, item.unitPrice || 0);
  const rawDiscount = Math.max(0, item.discount || 0);
  const taxRate = Math.max(0, Math.min(100, item.taxRate || 0));

  const subtotal = roundCurrency(qty * price);
  const discountAmount = roundCurrency(Math.min(rawDiscount, subtotal));
  const afterDiscount = Math.max(0, roundCurrency(subtotal - discountAmount));
  const taxAmount = roundCurrency(afterDiscount * (taxRate / 100));
  const total = roundCurrency(afterDiscount + taxAmount);

  return {
    id: item.id,
    productId: item.productId,
    description: item.description,
    quantity: qty,
    unitPrice: price,
    discount: discountAmount,
    taxRate,
    subtotal,
    taxAmount,
    total,
  };
}

/**
 * Calculates aggregated financial totals for an entire invoice.
 * Centralized calculation layer conforming to Section 9 of the PRD Blueprint.
 *
 * Prevents calculation duplication across Form, Preview, Detail, Dashboard, PDF, and Reports.
 */
export function calculateInvoiceTotals(
  input: InvoiceCalculationInput
): InvoiceCalculationResult {
  const items = input.items || [];
  const calculatedItems = items.map((item) => calculateLineItem(item));

  const subtotal = roundCurrency(
    calculatedItems.reduce((acc, curr) => acc + curr.subtotal, 0)
  );

  const lineItemDiscountsTotal = roundCurrency(
    calculatedItems.reduce((acc, curr) => acc + curr.discount, 0)
  );

  const lineItemTaxesTotal = roundCurrency(
    calculatedItems.reduce((acc, curr) => acc + curr.taxAmount, 0)
  );

  // Invoice-level discount (applied after line-item discounts)
  const remainingAfterLineDiscounts = Math.max(0, subtotal - lineItemDiscountsTotal);
  const invoiceDiscountInput = Math.max(0, input.invoiceDiscount || 0);
  const invoiceDiscountAmount = roundCurrency(
    Math.min(invoiceDiscountInput, remainingAfterLineDiscounts)
  );

  const totalDiscount = roundCurrency(lineItemDiscountsTotal + invoiceDiscountAmount);
  const taxableAmount = Math.max(0, roundCurrency(subtotal - totalDiscount));

  // Invoice-level tax (if any)
  const invoiceTaxRate = Math.max(0, Math.min(100, input.invoiceTaxRate || 0));
  const invoiceTaxAmount = roundCurrency(taxableAmount * (invoiceTaxRate / 100));

  const totalTax = roundCurrency(lineItemTaxesTotal + invoiceTaxAmount);
  const grandTotal = Math.max(
    0,
    roundCurrency(subtotal - totalDiscount + totalTax)
  );

  return {
    lineItems: calculatedItems,
    subtotal,
    lineItemDiscountsTotal,
    lineItemTaxesTotal,
    invoiceDiscountAmount,
    totalDiscount,
    taxableAmount,
    invoiceTaxAmount,
    totalTax,
    grandTotal,
  };
}

/**
 * Normalizes any date input into a comparable calendar day string (YYYY-MM-DD).
 */
export function normalizeDateToDayString(dateInput: string | Date): string {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Determines invoice lifecycle status based on business rules in Section 10 of PRD Blueprint.
 *
 * Rules:
 * - CANCELLED: Explicitly cancelled.
 * - PAID: totalPaid >= invoiceTotal (where total > 0).
 * - PARTIALLY_PAID: 0 < totalPaid < invoiceTotal.
 * - OVERDUE: referenceDate > dueDate AND not fully paid.
 * - DRAFT: If status is draft and not yet sent.
 * - PENDING/SENT: Active invoice awaiting payment before due date.
 */
export function calculateInvoiceStatus(params: InvoiceStatusParams): InvoiceStatus {
  const { status, dueDate, total, totalPaid, referenceDate = new Date() } = params;

  // 1. Explicit cancellation takes priority
  if (status === 'cancelled') {
    return 'cancelled';
  }

  const roundedTotal = roundCurrency(total);
  const roundedPaid = roundCurrency(totalPaid);

  // 2. Fully Paid check
  if (roundedTotal > 0 && roundedPaid >= roundedTotal) {
    return 'paid';
  }

  // 3. Partially Paid check
  if (roundedPaid > 0 && roundedPaid < roundedTotal) {
    // Check if partial payment is already overdue
    const dueDay = normalizeDateToDayString(dueDate);
    const refDay = normalizeDateToDayString(referenceDate);
    if (refDay > dueDay) {
      return 'overdue';
    }
    return 'partially_paid';
  }

  // 4. Overdue check
  const dueDay = normalizeDateToDayString(dueDate);
  const refDay = normalizeDateToDayString(referenceDate);
  if (refDay > dueDay && roundedPaid < roundedTotal) {
    return 'overdue';
  }

  // 5. Draft check
  if (status === 'draft') {
    return 'draft';
  }

  // 6. Default active pending / sent state
  return status === 'sent' ? 'sent' : 'pending';
}

/**
 * Calculates payment history metrics and balances for an invoice.
 */
export function calculatePaymentBalance(
  total: number,
  payments: Array<{ amount: number }> = [],
  dueDate?: string | Date,
  referenceDate?: string | Date
): InvoicePaymentSummary {
  const roundedTotal = roundCurrency(total);
  const totalPaid = roundCurrency(
    payments.reduce((acc, curr) => acc + Math.max(0, curr.amount || 0), 0)
  );

  const remainingBalance = Math.max(0, roundCurrency(roundedTotal - totalPaid));
  const isFullyPaid = roundedTotal > 0 && totalPaid >= roundedTotal;
  const isPartiallyPaid = totalPaid > 0 && totalPaid < roundedTotal;

  let isOverdue = false;
  if (dueDate && !isFullyPaid) {
    const dueDay = normalizeDateToDayString(dueDate);
    const refDay = normalizeDateToDayString(referenceDate || new Date());
    isOverdue = refDay > dueDay;
  }

  return {
    totalPaid,
    remainingBalance,
    isFullyPaid,
    isPartiallyPaid,
    isOverdue,
  };
}
