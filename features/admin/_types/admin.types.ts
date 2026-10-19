/**
 * Admin domain and authentication types
 * Source of Truth: docs/invoice-expense-prd-blueprint.md (Section 20 & Step 22)
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
