import { z } from 'zod';

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama produk atau layanan wajib diisi.')
    .max(120, 'Nama maksimal 120 karakter.'),
  sku: z
    .string()
    .trim()
    .max(50, 'SKU maksimal 50 karakter.')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .trim()
    .max(500, 'Deskripsi maksimal 500 karakter.')
    .optional()
    .or(z.literal('')),
  unit: z
    .string()
    .trim()
    .min(1, 'Satuan unit wajib dipilih.')
    .max(30, 'Satuan unit maksimal 30 karakter.'),
  price: z.coerce
    .number()
    .min(0, 'Harga satuan tidak boleh negatif.'),
  taxRate: z.coerce
    .number()
    .min(0, 'Tarif pajak tidak boleh negatif.')
    .max(100, 'Tarif pajak maksimal 100%.')
    .default(0),
  active: z.boolean().default(true),
});

export type ProductFormData = z.infer<typeof productSchema>;
