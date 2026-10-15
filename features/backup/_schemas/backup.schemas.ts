import { z } from 'zod';
import { BACKUP_FORMAT } from '../_types/backup.types';

export const companySchema = z.object({
  id: z.string(),
  name: z.string(),
  legalName: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  taxNumber: z.string().optional(),
  logo: z.string().optional(),
  currency: z.string().default('IDR'),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  companyName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxNumber: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string(),
  price: z.number(),
  taxRate: z.number().default(0),
  active: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const invoiceStatusSchema = z.enum([
  'draft',
  'sent',
  'pending',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
]);

export const invoiceSchema = z.object({
  id: z.string(),
  invoiceNumber: z.string(),
  customerId: z.string(),
  issueDate: z.string(),
  dueDate: z.string(),
  status: invoiceStatusSchema,
  notes: z.string().optional(),
  subtotal: z.number(),
  discount: z.number(),
  tax: z.number(),
  total: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const invoiceItemSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  productId: z.string().optional(),
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  discount: z.number().default(0),
  taxRate: z.number().default(0),
  subtotal: z.number(),
  total: z.number(),
});

export const expenseSchema = z.object({
  id: z.string(),
  categoryId: z.string(),
  description: z.string(),
  amount: z.number(),
  date: z.string(),
  paymentMethod: z.string(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const expenseCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  active: z.boolean().default(true),
});

export const paymentSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  amount: z.number(),
  paymentDate: z.string(),
  paymentMethod: z.string(),
  notes: z.string().optional(),
  createdAt: z.string(),
});

export const appSettingSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  updatedAt: z.string(),
});

export const backupDataSchema = z.object({
  companies: z.array(companySchema).default([]),
  customers: z.array(customerSchema).default([]),
  products: z.array(productSchema).default([]),
  invoices: z.array(invoiceSchema).default([]),
  invoiceItems: z.array(invoiceItemSchema).default([]),
  expenses: z.array(expenseSchema).default([]),
  expenseCategories: z.array(expenseCategorySchema).default([]),
  payments: z.array(paymentSchema).default([]),
  settings: z.array(appSettingSchema).default([]),
});

export const backupMetadataSchema = z.object({
  totalRecords: z.number().nonnegative(),
  tableCounts: z.record(z.string(), z.number().nonnegative()),
  generatedBy: z.string().optional(),
});

export const backupPayloadSchema = z.object({
  format: z.literal(BACKUP_FORMAT, {
    message: `Format cadangan harus '${BACKUP_FORMAT}'`,
  }),
  schemaVersion: z.number().int().min(1, 'Versi schema cadangan minimal 1'),
  appVersion: z.string(),
  exportedAt: z.string(),
  data: backupDataSchema,
  metadata: backupMetadataSchema.optional(),
});

export type ValidatedBackupPayload = z.infer<typeof backupPayloadSchema>;
