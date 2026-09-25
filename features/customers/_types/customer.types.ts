import { Customer } from '@/infrastructure/database/schema';

export type { Customer };

export interface CustomerWithInvoiceSummary {
  customer: Customer;
  invoiceCount: number;
  totalInvoiced: number;
  unpaidAmount: number;
}

export interface CustomerStats {
  totalCustomers: number;
  withCompanyCount: number;
  withEmailCount: number;
  withInvoicesCount: number;
}

export type CustomerSortBy = 'name_asc' | 'name_desc' | 'created_desc' | 'created_asc';
