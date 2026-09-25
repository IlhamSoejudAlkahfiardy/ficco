import { Invoice, InvoiceItem, InvoiceStatus } from '@/infrastructure/database/schema';

export type { Invoice, InvoiceItem, InvoiceStatus };

export interface CalculatedInvoiceItem {
  id?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  subtotal: number;
  taxAmount: number;
  total: number;
}

export interface InvoiceCalculationInput {
  items: Array<{
    id?: string;
    productId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
  }>;
  invoiceDiscount?: number;
  invoiceTaxRate?: number;
}

export interface InvoiceCalculationResult {
  lineItems: CalculatedInvoiceItem[];
  subtotal: number;
  lineItemDiscountsTotal: number;
  lineItemTaxesTotal: number;
  invoiceDiscountAmount: number;
  totalDiscount: number;
  taxableAmount: number;
  invoiceTaxAmount: number;
  totalTax: number;
  grandTotal: number;
}

export interface InvoiceStatusParams {
  status: InvoiceStatus;
  dueDate: string | Date;
  total: number;
  totalPaid: number;
  referenceDate?: string | Date;
}

export interface InvoicePaymentSummary {
  totalPaid: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
  isOverdue: boolean;
}

export interface InvoiceStatusMeta {
  status: InvoiceStatus;
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  description: string;
}

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, InvoiceStatusMeta> = {
  draft: {
    status: 'draft',
    label: 'Draf',
    colorClass: 'text-slate-600 dark:text-zinc-400',
    bgClass: 'bg-slate-100 dark:bg-zinc-800',
    borderClass: 'border-slate-200 dark:border-zinc-700',
    description: 'Faktur baru tersimpan dan belum dikirimkan ke pelanggan.',
  },
  sent: {
    status: 'sent',
    label: 'Terkirim',
    colorClass: 'text-blue-700 dark:text-blue-300',
    bgClass: 'bg-blue-50 dark:bg-blue-950/40',
    borderClass: 'border-blue-200 dark:border-blue-800',
    description: 'Faktur telah diterbitkan dan dikirimkan ke pelanggan.',
  },
  pending: {
    status: 'pending',
    label: 'Menunggu Pembayaran',
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-50 dark:bg-amber-950/40',
    borderClass: 'border-amber-200 dark:border-amber-800',
    description: 'Menunggu pelunasan dari pelanggan sebelum tanggal jatuh tempo.',
  },
  partially_paid: {
    status: 'partially_paid',
    label: 'Dibayar Sebagian',
    colorClass: 'text-indigo-700 dark:text-indigo-300',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    borderClass: 'border-indigo-200 dark:border-indigo-800',
    description: 'Pelanggan telah mencicil namun masih ada sisa tagihan.',
  },
  paid: {
    status: 'paid',
    label: 'Lunas',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderClass: 'border-emerald-200 dark:border-emerald-800',
    description: 'Faktur telah dibayar penuh oleh pelanggan.',
  },
  overdue: {
    status: 'overdue',
    label: 'Jatuh Tempo',
    colorClass: 'text-rose-700 dark:text-rose-300',
    bgClass: 'bg-rose-50 dark:bg-rose-950/40',
    borderClass: 'border-rose-200 dark:border-rose-800',
    description: 'Melewati tanggal jatuh tempo dan tagihan belum lunas.',
  },
  cancelled: {
    status: 'cancelled',
    label: 'Dibatalkan',
    colorClass: 'text-zinc-500 dark:text-zinc-500',
    bgClass: 'bg-zinc-100 dark:bg-zinc-800/60',
    borderClass: 'border-zinc-200 dark:border-zinc-700',
    description: 'Faktur telah dibatalkan dan tidak lagi ditagihkan.',
  },
};
