import crypto from 'crypto';

/**
 * Generates a cryptographically strong random license key.
 * Format: FCC-XXXX-XXXX-XXXX-XXXX (e.g. FCC-8F92-4A7B-D13E-9C05)
 * Source of Truth: docs/invoice-expense-prd-blueprint.md (Section 17)
 */
export function generateLicenseKey(prefix = 'FCC'): string {
  // Generate 8 bytes of cryptographically secure random numbers (16 hex chars)
  const randomHex = crypto.randomBytes(8).toString('hex').toUpperCase();

  // Split into 4 chunks of 4 characters each
  const parts = [
    randomHex.slice(0, 4),
    randomHex.slice(4, 8),
    randomHex.slice(8, 12),
    randomHex.slice(12, 16),
  ];

  return `${prefix}-${parts.join('-')}`;
}

/**
 * Cleans and normalizes user-entered license key strings.
 * Removes spaces, ensures uppercase.
 */
export function normalizeLicenseKey(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');
}

/**
 * Validates basic format of a license key without querying database.
 */
export function isValidLicenseKeyFormat(key: string): boolean {
  const normalized = normalizeLicenseKey(key);
  // Matches FCC-XXXX-XXXX-XXXX-XXXX or standard alphanumeric formatted key
  const regex = /^FCC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return regex.test(normalized) || normalized.length >= 16;
}
