import { z } from 'zod';

/**
 * Zod schema for validating license key strings
 * Format: FCC-XXXX-XXXX-XXXX-XXXX (or alphanumeric string between 12 and 64 chars)
 */
export const licenseKeySchema = z
  .string()
  .trim()
  .min(12, 'Kunci lisensi terlalu pendek (minimal 12 karakter).')
  .max(64, 'Kunci lisensi maksimal 64 karakter.')
  .transform((val) => val.toUpperCase());

/**
 * Zod schema for admin license creation
 */
export const createLicenseSchema = z.object({
  customerName: z
    .string()
    .trim()
    .max(120, 'Nama pelanggan maksimal 120 karakter.')
    .optional()
    .or(z.literal('')),
  customerEmail: z
    .string()
    .trim()
    .email('Format email tidak valid.')
    .max(120, 'Email maksimal 120 karakter.')
    .optional()
    .or(z.literal('')),
  customKey: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
});

/**
 * Zod schema for customer license activation
 */
export const activateLicenseSchema = z.object({
  licenseKey: licenseKeySchema,
  deviceFingerprint: z
    .string()
    .trim()
    .max(256)
    .optional(),
});

export type CreateLicenseInput = z.infer<typeof createLicenseSchema>;
export type ActivateLicenseInput = z.infer<typeof activateLicenseSchema>;
