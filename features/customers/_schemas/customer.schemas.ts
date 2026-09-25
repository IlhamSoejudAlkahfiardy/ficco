import { z } from 'zod';

export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama pelanggan atau kontak wajib diisi.')
    .max(120, 'Nama maksimal 120 karakter.'),
  companyName: z
    .string()
    .trim()
    .max(120, 'Nama perusahaan maksimal 120 karakter.')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .email('Format email tidak valid.')
    .max(100, 'Email maksimal 100 karakter.')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(30, 'Nomor telepon maksimal 30 karakter.')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .trim()
    .max(500, 'Alamat maksimal 500 karakter.')
    .optional()
    .or(z.literal('')),
  taxNumber: z
    .string()
    .trim()
    .max(50, 'NPWP / Tax ID maksimal 50 karakter.')
    .optional()
    .or(z.literal('')),
  notes: z
    .string()
    .trim()
    .max(1000, 'Catatan maksimal 1000 karakter.')
    .optional()
    .or(z.literal('')),
});

export type CustomerFormData = z.infer<typeof customerSchema>;
