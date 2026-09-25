import { z } from 'zod';

export const companyProfileSchema = z.object({
  name: z.string().trim().min(1, 'Business name is required.'),
  legalName: z.string().trim().optional(),
  address: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .email('Invalid email address.')
    .or(z.literal(''))
    .optional(),
  taxNumber: z.string().trim().optional(),
  currency: z.string().min(1, 'Currency is required.'),
  logo: z.string().optional(),
});

export type CompanyProfileFormData = z.infer<typeof companyProfileSchema>;

export const invoiceDefaultsSchema = z.object({
  prefix: z
    .string()
    .trim()
    .min(1, 'Invoice prefix is required.')
    .max(10, 'Prefix maximum 10 characters.'),
  nextNumber: z.coerce.number().int().min(1, 'Next invoice number must be at least 1.'),
  dueDays: z.coerce.number().int().min(0, 'Due days cannot be negative.').max(365, 'Due days max 365.'),
  taxRate: z.coerce.number().min(0, 'Tax rate cannot be negative.').max(100, 'Tax rate max 100%.'),
  notes: z.string().optional(),
  paymentInstructions: z.string().optional(),
});

export type InvoiceDefaultsFormData = z.infer<typeof invoiceDefaultsSchema>;
