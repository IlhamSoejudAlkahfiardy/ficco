import { buildInvoicePdf, generateInvoicePdfBlob } from '@/infrastructure/pdf';
import { Invoice, InvoiceItem, Customer } from '@/infrastructure/database/schema';
import { InvoiceCalculationResult, InvoicePaymentSummary } from '../_types/invoice.types';
import { CompanyProfile } from '@/features/settings/_types/settings.types';
import { Payment } from '../_types/payment.types';

export interface PdfTestResult {
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

/**
 * Unit test suite for client-side offline PDF generation conforming to Step 13.
 */
export function runInvoicePdfUnitTests(): {
  total: number;
  passedCount: number;
  failedCount: number;
  results: PdfTestResult[];
} {
  const results: PdfTestResult[] = [];

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

  const sampleInvoice: Invoice = {
    id: 'inv-test-1',
    invoiceNumber: 'INV-2026-0001',
    customerId: 'cust-1',
    issueDate: '2026-10-01',
    dueDate: '2026-10-15',
    status: 'sent',
    subtotal: 1000000,
    discount: 50000,
    tax: 104500,
    total: 1054500,
    notes: 'Pembayaran dilakukan maksimal 14 hari sejak faktur ini diterbitkan.',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  const sampleItems: InvoiceItem[] = [
    {
      id: 'item-1',
      invoiceId: 'inv-test-1',
      description: 'Layanan Desain UI/UX & Prototipe Sistem',
      quantity: 1,
      unitPrice: 1000000,
      discount: 50000,
      taxRate: 11,
      total: 1054500,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    },
  ];

  const sampleCustomer: Customer = {
    id: 'cust-1',
    name: 'PT Maju Bersama',
    companyName: 'Maju Jaya Tech',
    email: 'finance@majubersama.id',
    phone: '081234567890',
    address: 'Jl. Sudirman Kav. 52, Jakarta Selatan',
    taxNumber: '01.234.567.8-012.000',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  };

  const sampleCompany: Partial<CompanyProfile> = {
    name: 'PT Ficco Digital Solusi',
    legalName: 'PT Ficco Digital Solusi',
    address: 'Menara Mandiri Lt. 15, Jakarta Pusat',
    phone: '021-5551234',
    email: 'halo@ficco.id',
    taxNumber: '09.876.543.2-123.000',
    currency: 'IDR',
  };

  const sampleCalculation: InvoiceCalculationResult = {
    subtotal: 1000000,
    itemDiscountsTotal: 50000,
    invoiceDiscountAmount: 0,
    totalDiscount: 50000,
    taxableAmount: 950000,
    totalTax: 104500,
    grandTotal: 1054500,
    calculatedItems: [],
  };

  const samplePaymentSummary: InvoicePaymentSummary = {
    totalPaid: 500000,
    remainingBalance: 554500,
    isFullyPaid: false,
    isOverdue: false,
    paymentStatus: 'partially_paid',
    paymentPercentage: 47.4,
  };

  const samplePayments: Payment[] = [
    {
      id: 'pay-1',
      invoiceId: 'inv-test-1',
      amount: 500000,
      paymentDate: '2026-10-02',
      paymentMethod: 'bank_transfer',
      reference: 'TRX-998877',
      notes: 'DP 50%',
      createdAt: '2026-10-02T10:00:00Z',
      updatedAt: '2026-10-02T10:00:00Z',
    },
  ];

  // Test Suite 1: PDF Generation Format Validity
  runTest('PDF Architecture', 'Should generate valid PDF 1.4 binary structure', () => {
    const pdf = buildInvoicePdf({
      invoice: sampleInvoice,
      items: sampleItems,
      customer: sampleCustomer,
      company: sampleCompany,
      calculation: sampleCalculation,
      paymentSummary: samplePaymentSummary,
      payments: samplePayments,
      paymentInstructions: 'BCA: 123-456-7890 a/n PT Ficco',
    });

    const bytes = pdf.build();
    assert(bytes.length > 500, 'PDF output should have sufficient size');

    const pdfString = new TextDecoder().decode(bytes);
    assert(pdfString.startsWith('%PDF-1.4'), 'PDF header must start with %PDF-1.4');
    assert(pdfString.includes('%%EOF'), 'PDF must end with %%EOF marker');
    assert(pdfString.includes('trailer'), 'PDF must contain trailer dictionary');
    assert(pdfString.includes('xref'), 'PDF must contain cross-reference table');
  });

  // Test Suite 2: Document Content Inclusion
  runTest('Invoice Content', 'Should include invoice number, company, and customer data', () => {
    const pdf = buildInvoicePdf({
      invoice: sampleInvoice,
      items: sampleItems,
      customer: sampleCustomer,
      company: sampleCompany,
      calculation: sampleCalculation,
      paymentSummary: samplePaymentSummary,
      payments: samplePayments,
      paymentInstructions: 'BCA 123-456-7890',
    });

    const bytes = pdf.build();
    const str = new TextDecoder().decode(bytes);

    assert(str.includes('INV-2026-0001'), 'Must include invoice number');
    assert(str.includes('PT Ficco Digital Solusi'), 'Must include company name');
    assert(str.includes('PT Maju Bersama'), 'Must include customer name');
    assert(str.includes('1.054.500'), 'Must include formatted grand total');
  });

  // Test Suite 3: Graceful Missing Data Handling
  runTest('Data Resilience', 'Should generate cleanly even if customer or company is missing', () => {
    const pdf = buildInvoicePdf({
      invoice: sampleInvoice,
      items: sampleItems,
      calculation: sampleCalculation,
      paymentSummary: samplePaymentSummary,
    });

    const bytes = pdf.build();
    assert(bytes.length > 300, 'PDF must generate successfully without optional metadata');
    const str = new TextDecoder().decode(bytes);
    assert(str.startsWith('%PDF-1.4') && str.includes('%%EOF'), 'Structure remains valid');
  });

  // Test Suite 4: Multi-item & Pagination
  runTest('Pagination', 'Should support multiple items cleanly without breaking', () => {
    const manyItems: InvoiceItem[] = Array.from({ length: 15 }).map((_, i) => ({
      id: `item-${i + 1}`,
      invoiceId: 'inv-test-1',
      description: `Item Layanan Operasional ${i + 1}`,
      quantity: 1,
      unitPrice: 100000,
      discount: 0,
      taxRate: 11,
      total: 111000,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    }));

    const pdf = buildInvoicePdf({
      invoice: sampleInvoice,
      items: manyItems,
      customer: sampleCustomer,
      company: sampleCompany,
      calculation: sampleCalculation,
      paymentSummary: samplePaymentSummary,
    });

    const bytes = pdf.build();
    assert(bytes.length > 1000, 'Multi-item PDF must be generated with adequate size');
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
