import {
  calculateLineItem,
  calculateInvoiceTotals,
  calculateInvoiceStatus,
  calculatePaymentBalance,
  roundCurrency,
} from './invoice-calculations';
import {
  formatInvoiceNumber,
  parseInvoiceNumber,
  generateNextInvoiceNumber,
} from './invoice-number-generator';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

/**
 * Asserts condition, throws error with message if false
 */
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
  }
}

/**
 * Complete unit test suite for invoice domain calculations and number generation.
 * Conforms to Step 9 acceptance criteria.
 */
export function runInvoiceDomainUnitTests(): {
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

  // ==========================================
  // Suite 1: Line Item Calculation
  // ==========================================
  runTest('Line Item Calculation', 'calculates basic subtotal without tax or discount', () => {
    const item = calculateLineItem({
      description: 'Jasa Desain',
      quantity: 3,
      unitPrice: 150000,
    });
    assertEqual(item.subtotal, 450000, 'Subtotal should be quantity * unitPrice');
    assertEqual(item.discount, 0, 'Discount should be 0');
    assertEqual(item.taxAmount, 0, 'Tax amount should be 0');
    assertEqual(item.total, 450000, 'Total should equal subtotal');
  });

  runTest('Line Item Calculation', 'calculates line item discount correctly', () => {
    const item = calculateLineItem({
      description: 'Web Development',
      quantity: 2,
      unitPrice: 1000000,
      discount: 200000,
    });
    assertEqual(item.subtotal, 2000000, 'Subtotal should be 2,000,000');
    assertEqual(item.discount, 200000, 'Discount should be 200,000');
    assertEqual(item.total, 1800000, 'Total should be subtotal - discount');
  });

  runTest('Line Item Calculation', 'calculates line item tax after discount', () => {
    const item = calculateLineItem({
      description: 'Konsultasi Cloud',
      quantity: 1,
      unitPrice: 1000000,
      discount: 100000,
      taxRate: 11, // 11% PPN
    });
    // Subtotal: 1,000,000
    // After discount: 900,000
    // Tax: 900,000 * 11% = 99,000
    // Total: 999,000
    assertEqual(item.subtotal, 1000000, 'Subtotal is 1,000,000');
    assertEqual(item.discount, 100000, 'Discount is 100,000');
    assertEqual(item.taxAmount, 99000, 'Tax amount is 11% of discounted price');
    assertEqual(item.total, 999000, 'Total is 900,000 + 99,000 = 999,000');
  });

  runTest('Line Item Calculation', 'clamps discount to never exceed subtotal', () => {
    const item = calculateLineItem({
      description: 'Sample',
      quantity: 1,
      unitPrice: 50000,
      discount: 80000, // greater than subtotal
    });
    assertEqual(item.subtotal, 50000, 'Subtotal is 50,000');
    assertEqual(item.discount, 50000, 'Discount is clamped to 50,000');
    assertEqual(item.total, 0, 'Total cannot be negative');
  });

  // ==========================================
  // Suite 2: Invoice Totals Calculation
  // ==========================================
  runTest('Invoice Totals Calculation', 'aggregates multiple items accurately', () => {
    const res = calculateInvoiceTotals({
      items: [
        { description: 'Item A', quantity: 2, unitPrice: 100000 }, // 200,000
        { description: 'Item B', quantity: 1, unitPrice: 300000 }, // 300,000
      ],
    });
    assertEqual(res.subtotal, 500000, 'Total subtotal is 500,000');
    assertEqual(res.totalDiscount, 0, 'Total discount is 0');
    assertEqual(res.totalTax, 0, 'Total tax is 0');
    assertEqual(res.grandTotal, 500000, 'Grand total is 500,000');
  });

  runTest('Invoice Totals Calculation', 'applies invoice-level discount and tax', () => {
    const res = calculateInvoiceTotals({
      items: [
        { description: 'Server Hosting', quantity: 1, unitPrice: 1000000 },
      ],
      invoiceDiscount: 100000, // 100,000 invoice discount
      invoiceTaxRate: 11, // 11% tax
    });
    // Subtotal: 1,000,000
    // Discount: 100,000 -> Taxable: 900,000
    // Tax: 900,000 * 11% = 99,000
    // Grand Total: 900,000 + 99,000 = 999,000
    assertEqual(res.subtotal, 1000000, 'Subtotal is 1,000,000');
    assertEqual(res.invoiceDiscountAmount, 100000, 'Invoice discount is 100,000');
    assertEqual(res.taxableAmount, 900000, 'Taxable amount is 900,000');
    assertEqual(res.invoiceTaxAmount, 99000, 'Invoice tax amount is 99,000');
    assertEqual(res.grandTotal, 999000, 'Grand total is 999,000');
  });

  runTest('Invoice Totals Calculation', 'handles floating point precision without rounding errors', () => {
    // 0.1 + 0.2 floating point anomaly prevention
    const val = roundCurrency(0.1 + 0.2);
    assertEqual(val, 0.3, '0.1 + 0.2 must round precisely to 0.3');

    const item = calculateLineItem({
      description: 'Micro service',
      quantity: 1.333,
      unitPrice: 33333.33,
    });
    assert(!isNaN(item.total), 'Total must be a valid number');
    assert(isFinite(item.total), 'Total must be finite');
    assertEqual(item.total, 44433.33, 'Total matches rounded result');
  });

  // ==========================================
  // Suite 3: Invoice Status Calculation
  // ==========================================
  runTest('Invoice Status Calculation', 'returns paid when totalPaid equals or exceeds total', () => {
    const status = calculateInvoiceStatus({
      status: 'pending',
      dueDate: '2026-10-01',
      total: 1000000,
      totalPaid: 1000000,
    });
    assertEqual(status, 'paid', 'Status should be paid');

    const overpaid = calculateInvoiceStatus({
      status: 'pending',
      dueDate: '2026-10-01',
      total: 1000000,
      totalPaid: 1200000,
    });
    assertEqual(overpaid, 'paid', 'Status should be paid when overpaid');
  });

  runTest('Invoice Status Calculation', 'returns partially_paid when paid amount is between 0 and total', () => {
    const status = calculateInvoiceStatus({
      status: 'pending',
      dueDate: '2026-12-31',
      total: 1000000,
      totalPaid: 400000,
      referenceDate: '2026-09-25',
    });
    assertEqual(status, 'partially_paid', 'Status should be partially_paid before due date');
  });

  runTest('Invoice Status Calculation', 'returns overdue when referenceDate is past due date and unpaid', () => {
    const status = calculateInvoiceStatus({
      status: 'sent',
      dueDate: '2026-09-01', // past date
      total: 1000000,
      totalPaid: 0,
      referenceDate: '2026-09-25',
    });
    assertEqual(status, 'overdue', 'Status should be overdue when past due date');

    const partialOverdue = calculateInvoiceStatus({
      status: 'partially_paid',
      dueDate: '2026-09-01',
      total: 1000000,
      totalPaid: 300000,
      referenceDate: '2026-09-25',
    });
    assertEqual(partialOverdue, 'overdue', 'Partially paid past due date becomes overdue');
  });

  runTest('Invoice Status Calculation', 'preserves cancelled status regardless of dates or payments', () => {
    const status = calculateInvoiceStatus({
      status: 'cancelled',
      dueDate: '2026-01-01',
      total: 1000000,
      totalPaid: 0,
    });
    assertEqual(status, 'cancelled', 'Cancelled invoice remains cancelled');
  });

  runTest('Invoice Status Calculation', 'preserves draft status before publishing', () => {
    const status = calculateInvoiceStatus({
      status: 'draft',
      dueDate: '2026-12-31',
      total: 500000,
      totalPaid: 0,
      referenceDate: '2026-09-25',
    });
    assertEqual(status, 'draft', 'Draft invoice remains draft');
  });

  // ==========================================
  // Suite 4: Payment Balance Calculation & Lifecycle
  // ==========================================
  runTest('Payment Balance Calculation', 'correctly sums payment records and computes balance', () => {
    const balance = calculatePaymentBalance(
      1500000,
      [{ amount: 500000 }, { amount: 300000 }],
      '2026-10-15',
      '2026-09-25'
    );
    assertEqual(balance.totalPaid, 800000, 'Total paid is 800,000');
    assertEqual(balance.remainingBalance, 700000, 'Remaining balance is 700,000');
    assertEqual(balance.isPartiallyPaid, true, 'Is partially paid');
    assertEqual(balance.isFullyPaid, false, 'Is not fully paid');
    assertEqual(balance.isOverdue, false, 'Is not overdue');
  });

  runTest('Payment Balance Calculation', 'acceptance: 0 payment -> unpaid / open', () => {
    const balance = calculatePaymentBalance(1000000, [], '2026-10-31', '2026-09-28');
    assertEqual(balance.totalPaid, 0, 'Total paid must be 0');
    assertEqual(balance.remainingBalance, 1000000, 'Remaining balance must equal full total');
    assertEqual(balance.isPartiallyPaid, false, '0 payment is not partially paid');
    assertEqual(balance.isFullyPaid, false, '0 payment is not fully paid');
    assertEqual(balance.isOverdue, false, 'Before due date is not overdue');
  });

  runTest('Payment Balance Calculation', 'acceptance: partial payment -> partially paid', () => {
    const balance = calculatePaymentBalance(
      2000000,
      [{ amount: 750000 }],
      '2026-10-31',
      '2026-09-28'
    );
    assertEqual(balance.totalPaid, 750000, 'Total paid matches installment');
    assertEqual(balance.remainingBalance, 1250000, 'Remaining balance is 2M - 750k = 1.25M');
    assertEqual(balance.isPartiallyPaid, true, 'Flag isPartiallyPaid must be true');
    assertEqual(balance.isFullyPaid, false, 'Flag isFullyPaid must be false');
  });

  runTest('Payment Balance Calculation', 'acceptance: full payment -> paid', () => {
    const balance = calculatePaymentBalance(
      1000000,
      [{ amount: 400000 }, { amount: 600000 }],
      '2026-10-31',
      '2026-09-28'
    );
    assertEqual(balance.totalPaid, 1000000, 'Total paid equals total');
    assertEqual(balance.remainingBalance, 0, 'Remaining balance must be 0');
    assertEqual(balance.isFullyPaid, true, 'Flag isFullyPaid must be true');
    assertEqual(balance.isPartiallyPaid, false, 'Full payment is not partially paid');
  });

  runTest('Payment Balance Calculation', 'acceptance: past due + unpaid -> overdue', () => {
    const balance = calculatePaymentBalance(
      1000000,
      [{ amount: 200000 }],
      '2026-09-01', // past due date
      '2026-09-28' // today
    );
    assertEqual(balance.isOverdue, true, 'Unpaid past due invoice must be marked overdue');
    assertEqual(balance.isFullyPaid, false, 'Must not be fully paid');
  });

  runTest('Payment Balance Calculation', 'acceptance: past due + fully paid -> not overdue', () => {
    const balance = calculatePaymentBalance(
      1000000,
      [{ amount: 1000000 }],
      '2026-09-01', // past due date
      '2026-09-28' // today
    );
    assertEqual(balance.isOverdue, false, 'Fully paid invoice must never be overdue');
    assertEqual(balance.isFullyPaid, true, 'Must be fully paid');
  });

  // ==========================================
  // Suite 5: Invoice Number Generation
  // ==========================================
  runTest('Invoice Number Generation', 'formats standard invoice number correctly', () => {
    const fixedDate = new Date(2026, 8, 25);
    const num = formatInvoiceNumber('INV', 42, fixedDate);
    assertEqual(num, 'INV-2026-0042', 'Format matches INV-YYYY-0042');
  });

  runTest('Invoice Number Generation', 'parses invoice numbers accurately', () => {
    const parsed = parseInvoiceNumber('INV-2026-0105');
    assert(parsed !== null, 'Should parse valid invoice number');
    assertEqual(parsed?.prefix, 'INV', 'Prefix is INV');
    assertEqual(parsed?.year, 2026, 'Year is 2026');
    assertEqual(parsed?.sequence, 105, 'Sequence is 105');
  });

  runTest('Invoice Number Generation', 'generates next sequential number without collision', () => {
    const existing = [
      'INV-2026-0001',
      'INV-2026-0004',
      'INV-2026-0002',
      'OTHER-2026-0099', // different prefix
    ];
    const fixedDate = new Date(2026, 8, 25);
    const nextNum = generateNextInvoiceNumber(existing, 'INV', 1, fixedDate);
    assertEqual(nextNum, 'INV-2026-0005', 'Next number should be 0005 (max 0004 + 1)');
  });

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passedCount,
    failedCount,
    results,
  };
}
