/**
 * Device Fingerprint Utility for Client License Activation
 * Source of Truth: docs/invoice-expense-prd-blueprint.md (Step 26 & Section 18)
 */

const DEVICE_FINGERPRINT_STORAGE_KEY = 'ficco_device_fingerprint';

/**
 * Retrieves the existing persistent device fingerprint or generates a new one.
 * Stored in localStorage so it remains stable for this browser/device installation.
 */
export function getOrCreateDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'DEV-SERVER-INIT';
  }

  try {
    const existing = localStorage.getItem(DEVICE_FINGERPRINT_STORAGE_KEY);
    if (existing && existing.trim().length > 0) {
      return existing.trim();
    }

    // Generate a unique fingerprint combining timestamp, random token, and platform hints
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timePart = Date.now().toString(36).toUpperCase();
    const newFingerprint = `DEV-${timePart}-${randomPart}`;

    localStorage.setItem(DEVICE_FINGERPRINT_STORAGE_KEY, newFingerprint);
    return newFingerprint;
  } catch {
    return `DEV-FALLBACK-${Date.now().toString(36).toUpperCase()}`;
  }
}
