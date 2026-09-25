import { z } from 'zod';

export const invoiceItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional().or(z.literal('')),
  description: z
    .string()
    .trim()
    .min(1, 'Deskripsi item faktur wajib diisi.')
    .max(250, 'Deskripsi maksimal 250 karakter.'),
  quantity: z.coerce
    .number()
    .min(0.0001, 'Kuantitas item minimal 0.0001.'),
  unitPrice: z.coerce
    .number()
    .min(0, 'Harga satuan tidak boleh negatif.'),
  discount: z.coerce
    .number()
    .min(0, 'Diskon item tidak boleh negatif.')
    .default(0),
  taxRate: z.coerce
    .number()
    .min(0, 'Tarif pajak tidak boleh negatif.')
    .max(100, 'Tarif pajak maksimal 100%.')
    .default(0),
});

export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>;

export const invoiceSchema = z
  .object({
    id: z.string().optional(),
    invoiceNumber: z
      .string()
      .trim()
      .min(1, 'Nomor faktur wajib diisi.')
      .max(50, 'Nomor faktur maksimal 50 karakter.'),
    customerId: z
      .string()
      .trim()
      .min(1, 'Pelanggan wajib dipilih.'),
    issueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal penerbitan tidak valid (YYYY-MM-DD).'),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal jatuh tempo tidak valid (YYYY-MM-DD).'),
    status: z
      .enum([
        'draft',
        'sent',
        'pending',
        'partially_paid',
        'paid',
        'overdue',
        'cancelled',
      ])
      .default('draft'),
    notes: z
      .string()
      .trim()
      .max(1000, 'Catatan maksimal 1000 karakter.')
      .optional()
      .or(z.literal('')),
    discount: z.coerce
      .number()
      .min(0, 'Diskon faktur tidak boleh negatif.')
      .default(0),
    tax: z.coerce
      .number()
      .min(0, 'Pajak faktur tidak boleh negatif.')
      .default(0),
    items: z
      .array(invoiceItemSchema)
      .min(1, 'Faktur harus memiliki minimal 1 baris item.'),
  })
  .refine(
    (data) => {
      if (data.issueDate && data.dueDate) {
        return new Date(data.dueDate) >= new Date(data.issueDate);
      }
      return true;
    },
    {
      message: 'Tanggal jatuh tempo tidak boleh sebelum tanggal penerbitan faktur.',
      path: ['dueDate'],
    }
  );

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
