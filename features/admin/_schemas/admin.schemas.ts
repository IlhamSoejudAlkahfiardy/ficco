import { z } from 'zod';

/**
 * Validation schema for Admin login
 * Source of Truth: docs/invoice-expense-prd-blueprint.md (Section 20.1 & Step 22)
 */
export const adminLoginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username wajib diisi')
    .max(50, 'Username maksimal 50 karakter')
    .trim(),
  password: z
    .string()
    .min(1, 'Password wajib diisi')
    .max(100, 'Password maksimal 100 karakter'),
});

export type AdminLoginSchemaType = z.infer<typeof adminLoginSchema>;
