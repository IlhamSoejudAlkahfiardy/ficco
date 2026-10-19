import { AdminSessionPayload } from '../_types/admin.types';

/**
 * Admin Authentication Server Service
 * Source of Truth: docs/invoice-expense-prd-blueprint.md (Section 20 & Step 22)
 *
 * Implements HMAC-SHA256 signed session tokens via Web Crypto API (SubtleCrypto),
 * ensuring zero-dependency cross-runtime compatibility between Edge (Middleware)
 * and Node.js (Route Handlers & Server Components).
 */

export const ADMIN_COOKIE_NAME = 'ficco_admin_session';
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds
export const ADMIN_OBSCURE_PATH = '/sk-11312301239';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Universal Uint8Array to Base64URL string
 */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Universal Base64URL string to Uint8Array
 */
export function base64UrlToBytes(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Import HMAC-SHA256 CryptoKey
 */
async function getHmacKey(secret: string): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Retrieve session secret from server environment
 */
export function getAdminSessionSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || 'ficco-dev-admin-secret-key-32-chars-long';
}

/**
 * Validate username and password against server environment variables
 */
export function validateAdminCredentials(username: string, password: string): boolean {
  const expectedUsername = process.env.ADMIN_USERNAME || 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'ficco-admin-2026';

  if (!username || !password) return false;
  return username === expectedUsername && password === expectedPassword;
}

/**
 * Create a cryptographically signed HMAC-SHA256 session token
 */
export async function createAdminSessionToken(
  username: string,
  maxAgeSeconds = ADMIN_COOKIE_MAX_AGE
): Promise<string> {
  const secret = getAdminSessionSecret();
  const key = await getHmacKey(secret);
  const now = Math.floor(Date.now() / 1000);

  const payload: AdminSessionPayload = {
    username,
    role: 'admin',
    iat: now,
    exp: now + maxAgeSeconds,
  };

  const payloadJson = JSON.stringify(payload);
  const payloadB64 = bytesToBase64Url(encoder.encode(payloadJson));

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadB64)
  );
  const signatureB64 = bytesToBase64Url(new Uint8Array(signatureBuffer));

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verify HMAC-SHA256 session token and check validity / expiration
 */
export async function verifyAdminSessionToken(
  token?: string | null
): Promise<AdminSessionPayload | null> {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signatureB64] = parts;
    if (!payloadB64 || !signatureB64) return null;

    const secret = getAdminSessionSecret();
    const key = await getHmacKey(secret);

    const signatureBytes = base64UrlToBytes(signatureB64);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as BufferSource,
      encoder.encode(payloadB64)
    );

    if (!isValid) return null;

    const payloadBytes = base64UrlToBytes(payloadB64);
    const payload: AdminSessionPayload = JSON.parse(decoder.decode(payloadBytes));

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== 'number' || payload.exp < now) {
      return null; // Expired
    }

    if (payload.role !== 'admin' || !payload.username) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
