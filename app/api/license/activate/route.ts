import { NextRequest, NextResponse } from 'next/server';
import {
  SupabaseLicenseRepository,
  activateLicenseSchema,
  ActivateLicenseResponse,
} from '@/features/license';

export const dynamic = 'force-dynamic';

/**
 * POST /api/license/activate
 * Customer License Activation Endpoint (Step 26 & Section 18)
 *
 * Rules:
 * - Server-side Supabase lookup with service_role client
 * - Unused valid license -> activation succeeds (marked used = true, activated_at = now, device_fingerprint recorded)
 * - Already used license -> rejected (HTTP 409 ALREADY_USED)
 * - Non-existent license -> rejected (HTTP 404 NOT_FOUND)
 * - Invalid format -> rejected (HTTP 400 INVALID_FORMAT)
 * - Business/financial data is NEVER processed or touched here (Zero-Knowledge rule)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // 1. Validate payload schema
    const parsed = activateLicenseSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Format kunci lisensi tidak valid.';
      const response: ActivateLicenseResponse = {
        success: false,
        error: firstError,
        code: 'INVALID_FORMAT',
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { licenseKey, deviceFingerprint } = parsed.data;

    // 2. Perform server-side Supabase lookup and activation
    const result = await SupabaseLicenseRepository.activate(
      licenseKey,
      deviceFingerprint
    );

    if (!result.valid) {
      const response: ActivateLicenseResponse = {
        success: false,
        error: result.error || 'Aktivasi lisensi gagal.',
        code: result.code || 'DATABASE_ERROR',
      };

      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(response, { status: 404 });
      }

      if (result.code === 'ALREADY_USED') {
        return NextResponse.json(response, { status: 409 });
      }

      return NextResponse.json(response, { status: 500 });
    }

    // 3. Activation succeeded
    const response: ActivateLicenseResponse = {
      success: true,
      message: 'Lisensi berhasil diaktivasi pada perangkat ini.',
      license: result.license,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[API /api/license/activate POST] Error:', error);
    const response: ActivateLicenseResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Terjadi gangguan internal server.',
      code: 'DATABASE_ERROR',
    };
    return NextResponse.json(response, { status: 500 });
  }
}

/**
 * Handle non-POST methods with 405 Method Not Allowed
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method Not Allowed. Gunakan POST untuk melakukan aktivasi lisensi.',
    },
    { status: 405 }
  );
}
