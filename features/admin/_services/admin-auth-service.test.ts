import {
  validateAdminCredentials,
  createAdminSessionToken,
  verifyAdminSessionToken,
  bytesToBase64Url,
  base64UrlToBytes,
} from './admin-auth-service';

export interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message} - Expected: ${expected}, Actual: ${actual}`);
  }
}

export async function runAdminAuthUnitTests(): Promise<{
  total: number;
  passedCount: number;
  failedCount: number;
  results: TestResult[];
}> {
  const results: TestResult[] = [];
  const originalEnv = { ...process.env };

  process.env.ADMIN_USERNAME = 'testadmin';
  process.env.ADMIN_PASSWORD = 'securepassword123';
  process.env.ADMIN_SESSION_SECRET = 'super-secret-key-for-testing-purposes-123';

  async function test(suite: string, name: string, fn: () => void | Promise<void>) {
    try {
      await fn();
      results.push({ suite, name, passed: true });
    } catch (err) {
      results.push({
        suite,
        name,
        passed: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  try {
    // 1. Credential Validation
    await test('Credential Validation', 'validates correct credentials', () => {
      assert(validateAdminCredentials('testadmin', 'securepassword123'), 'Valid credentials should pass');
    });

    await test('Credential Validation', 'rejects wrong password', () => {
      assert(!validateAdminCredentials('testadmin', 'wrongpass'), 'Wrong password should fail');
    });

    await test('Credential Validation', 'rejects wrong username', () => {
      assert(!validateAdminCredentials('wronguser', 'securepassword123'), 'Wrong username should fail');
    });

    await test('Credential Validation', 'rejects empty credentials', () => {
      assert(!validateAdminCredentials('', ''), 'Empty credentials should fail');
    });

    // 2. Token Creation & Verification
    await test('Token Security', 'creates and verifies valid token', async () => {
      const token = await createAdminSessionToken('testadmin', 3600);
      assert(typeof token === 'string' && token.includes('.'), 'Token format invalid');
      const payload = await verifyAdminSessionToken(token);
      assert(payload !== null, 'Payload should not be null');
      assertEqual(payload?.username, 'testadmin', 'Username mismatch');
      assertEqual(payload?.role, 'admin', 'Role mismatch');
    });

    await test('Token Security', 'rejects tampered payload', async () => {
      const token = await createAdminSessionToken('testadmin', 3600);
      const [payloadB64, signatureB64] = token.split('.');
      const tampered = payloadB64.slice(0, -4) + 'AAAA.' + signatureB64;
      const payload = await verifyAdminSessionToken(tampered);
      assert(payload === null, 'Tampered payload must be rejected');
    });

    await test('Token Security', 'rejects tampered signature', async () => {
      const token = await createAdminSessionToken('testadmin', 3600);
      const [payloadB64, signatureB64] = token.split('.');
      const tampered = payloadB64 + '.' + signatureB64.slice(0, -4) + 'ZZZZ';
      const payload = await verifyAdminSessionToken(tampered);
      assert(payload === null, 'Tampered signature must be rejected');
    });

    await test('Token Security', 'rejects expired token', async () => {
      const token = await createAdminSessionToken('testadmin', -10);
      const payload = await verifyAdminSessionToken(token);
      assert(payload === null, 'Expired token must be rejected');
    });

    await test('Token Security', 'rejects garbage tokens', async () => {
      assert((await verifyAdminSessionToken('')) === null, 'Empty token rejected');
      assert((await verifyAdminSessionToken(null)) === null, 'Null token rejected');
      assert((await verifyAdminSessionToken('bad-token')) === null, 'Malformed token rejected');
    });

    // 3. Base64URL Encoding/Decoding
    await test('Base64URL Utility', 'encodes and decodes symmetrically', () => {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const testStr = 'Ficco Admin Portal - Step 22! 🚀';
      const bytes = encoder.encode(testStr);
      const b64 = bytesToBase64Url(bytes);
      assert(!b64.includes('+') && !b64.includes('/') && !b64.includes('='), 'Base64URL should be url safe');
      const restored = decoder.decode(base64UrlToBytes(b64));
      assertEqual(restored, testStr, 'Restored string must match original');
    });
  } finally {
    process.env = originalEnv;
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    total: results.length,
    passedCount,
    failedCount,
    results,
  };
}
