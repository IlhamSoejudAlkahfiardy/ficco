import { z } from 'zod';

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'ID Faktur wajib diisi.'),
  amount: z.coerce
    .number()
    .min(1, 'Jumlah pembayaran minimal Rp 1.'),
  paymentDate: z
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

export type PaymentFormData = z.infer<typeof paymentSchema>;
