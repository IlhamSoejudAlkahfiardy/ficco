import { Payment } from '@/infrastructure/database/schema';

export type { Payment };

export const PAYMENT_METHODS = [
  'Transfer Bank',
  'Tunai / Cash',
  'QRIS',
  'Kartu Kredit / Debit',
  'e-Wallet',
  'Giro / Cek',
  'Lainnya',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentRecordInput {
  invoiceId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: string;
  notes?: string;
}

export interface InvoicePaymentSummaryWithHistory {
  invoiceId: string;
  invoiceNumber: string;
  total: number;
  totalPaid: number;
  remainingBalance: number;
  isFullyPaid: boolean;
  isPartiallyPaid: boolean;
  isOverdue: boolean;
  payments: Payment[];
}
