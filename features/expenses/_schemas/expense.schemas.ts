import { z } from 'zod';

/**
 * Validation schema for creating / updating an Expense
 */
export const expenseSchema = z.object({
  categoryId: z
    .string()
    .trim()
    .min(1, 'Kategori pengeluaran wajib dipilih.'),
  description: z
    .string()
    .trim()
    .min(1, 'Deskripsi pengeluaran wajib diisi.')
    .max(200, 'Deskripsi maksimal 200 karakter.'),
  amount: z.coerce
    .number()
    .min(1, 'Nominal pengeluaran minimal Rp 1.')
    .max(1_000_000_000_000, 'Nominal pengeluaran melebihi batas wajar.'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid (YYYY-MM-DD).'),
  paymentMethod: z
    .string()
    .trim()
    .min(1, 'Metode pembayaran wajib dipilih.'),
  notes: z
    .string()
    .trim()
    .max(500, 'Catatan maksimal 500 karakter.')
    .optional()
    .or(z.literal('')),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;

/**
 * Validation schema for creating / updating an Expense Category
 */
export const expenseCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama kategori wajib diisi.')
    .max(60, 'Nama kategori maksimal 60 karakter.'),
  description: z
    .string()
    .trim()
    .max(250, 'Deskripsi maksimal 250 karakter.')
    .optional()
    .or(z.literal('')),
  active: z.boolean().default(true),
});

export type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>;
