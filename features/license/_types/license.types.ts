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
  | 'SERVER_MISCONFIGURED'
  | 'NETWORK_ERROR'
  | 'SERVER_UNAVAILABLE';

export interface LicenseValidationResult {
  valid: boolean;
  license?: License;
  error?: string;
  code?: LicenseErrorCode;
}

export interface ActivateLicenseResponse {
  success: boolean;
  message?: string;
  license?: License;
  error?: string;
  code?: LicenseErrorCode;
}

/**
 * Local persisted license state (Step 27 & Section 23)
 * Separated from business data in IndexedDB
 */
export interface LocalLicenseState {
  isActivated: boolean;
  licenseKey: string | null;
  customerName: string | null;
  customerEmail: string | null;
  activatedAt: string | null;
  deviceFingerprint: string | null;
  lastVerifiedAt: string | null;
}

export interface LicenseStoreState extends LocalLicenseState {
  isHydrated: boolean;
  isActivating: boolean;
  error: string | null;
  errorCode: LicenseErrorCode | null;

  // Actions
  setActivated: (license: License) => void;
  clearActivation: () => void;
  resetError: () => void;
  setHydrated: (hydrated: boolean) => void;
  activateWithServer: (rawLicenseKey: string) => Promise<{
    success: boolean;
    license?: License;
    error?: string;
    code?: LicenseErrorCode;
  }>;
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
