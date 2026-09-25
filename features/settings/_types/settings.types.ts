export interface CompanyProfile {
  id: string;
  name: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  logo?: string; // Base64 data URL
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDefaults {
  prefix: string;
  nextNumber: number;
  dueDays: number;
  taxRate: number;
  notes?: string;
  paymentInstructions?: string;
}

export interface AllSettings {
  company: CompanyProfile;
  invoiceDefaults: InvoiceDefaults;
}

export const DEFAULT_CURRENCIES = [
  { code: 'IDR', symbol: 'Rp', label: 'Indonesian Rupiah (Rp)' },
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (S$)' },
  { code: 'MYR', symbol: 'RM', label: 'Malaysian Ringgit (RM)' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar (A$)' },
  { code: 'GBP', symbol: '£', label: 'British Pound (£)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
];

export const INITIAL_INVOICE_DEFAULTS: InvoiceDefaults = {
  prefix: 'INV',
  nextNumber: 1,
  dueDays: 14,
  taxRate: 11,
  notes: 'Terima kasih atas kerja samanya. Harap selesaikan pembayaran sebelum tanggal jatuh tempo.',
  paymentInstructions: 'Transfer Bank:\nBank Central Asia (BCA)\nNo. Rekening: 123-456-7890\na/n PT Nama Bisnis Anda',
};
