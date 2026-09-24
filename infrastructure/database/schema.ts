/**
 * Database Entity Schemas & Type Definitions
 * Source of Truth: docs/invoice-expense-prd-blueprint.md (Section 8)
 */

export interface Company {
  id: string;
  name: string;
  legalName?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  logo?: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  unit: string;
  price: number;
  taxRate: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: InvoiceStatus;
  notes?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  subtotal: number;
  total: number;
}

export interface Expense {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMethod: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

export interface AppSetting {
  key: string;
  value: unknown;
  updatedAt: string;
}
