/**
 * License Feature Domain Types
 * Source of Truth: docs/invoice-expense-prd-blueprint.md (Step 21 & Section 15-19)
 */

export interface License {
  id: string;
  licenseKey: string;
  used: boolean;
  createdAt: string;
  customerName?: string | null;
  customerEmail?: string | null;
  activatedAt?: string | null;
  deviceFingerprint?: string | null;
}

export interface CreateLicenseDTO {
  customerName?: string | null;
  customerEmail?: string | null;
  customKey?: string;
}

export interface ActivateLicenseDTO {
  licenseKey: string;
  deviceFingerprint?: string;
}

export type LicenseErrorCode =
  | 'NOT_FOUND'
  | 'ALREADY_USED'
  | 'INVALID_FORMAT'
  | 'DATABASE_ERROR'
  | 'SERVER_MISCONFIGURED';

export interface LicenseValidationResult {
  valid: boolean;
  license?: License;
  error?: string;
  code?: LicenseErrorCode;
}

export interface LicenseDatabaseHealth {
  status: 'connected' | 'mock_connected' | 'error';
  tableExists: boolean;
  rlsEnabled: boolean;
  isLiveSupabase: boolean;
  totalLicensesCount: number;
  message: string;
  timestamp: string;
}
