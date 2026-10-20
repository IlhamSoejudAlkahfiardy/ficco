/**
 * Admin domain and authentication types
 * Source of Truth: docs/invoice-expense-prd-blueprint.md (Section 20 & Step 22-25)
 */

export interface AdminUser {
  username: string;
  role: 'admin';
}

export interface AdminSessionPayload {
  username: string;
  role: 'admin';
  iat: number; // Issued at (seconds)
  exp: number; // Expires at (seconds)
}

export interface AdminLoginDTO {
  username: string;
  password: string;
}

export interface AdminAuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: AdminUser;
}

export interface AdminMeResponse {
  authenticated: boolean;
  user?: AdminUser;
}

export interface AdminLicenseStats {
  total: number;
  used: number;
  unused: number;
  activationRate: number;
  isLiveSupabase: boolean;
  recentLicenses: import('@/features/license').License[];
  timestamp: string;
}

export interface AdminDashboardStatsResponse {
  success: boolean;
  stats?: AdminLicenseStats;
  error?: string;
}

export interface CreateLicenseResponse {
  success: boolean;
  license?: import('@/features/license').License;
  error?: string;
  message?: string;
}

export type LicenseFilterType = 'all' | 'used' | 'unused';

export interface LicenseListResponse {
  success: boolean;
  licenses?: import('@/features/license').License[];
  error?: string;
}

export interface ToggleLicenseResponse {
  success: boolean;
  license?: import('@/features/license').License;
  error?: string;
  message?: string;
}

export interface DeleteLicenseResponse {
  success: boolean;
  error?: string;
  message?: string;
}
